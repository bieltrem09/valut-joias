/**
 * Regras do estoque, sem banco: situação de cada produto, margem e os totais
 * do topo da aba. Valores em reais, arredondados ao centavo.
 */
import { cents } from "./finance";

export type Situacao = "ok" | "baixo" | "esgotado";

/** Esgotado com zero (ou menos); baixo quando chega no mínimo definido. */
export function situacao(quantidade: number, minimo: number): Situacao {
  if (quantidade <= 0) return "esgotado";
  if (minimo > 0 && quantidade <= minimo) return "baixo";
  return "ok";
}

/** Margem sobre o preço de venda (0,4 = 40%). Sem preço, não há margem. */
export function margem(preco: number, custo: number): number | null {
  return preco > 0 ? (preco - custo) / preco : null;
}

type ItemResumo = { quantidade: number; estoqueMinimo: number; custo: number; preco: number };

export function resumoEstoque(ps: ItemResumo[]) {
  const comSaldo = ps.map((p) => ({ ...p, q: Math.max(0, p.quantidade) }));
  const valorCusto = cents(comSaldo.reduce((a, p) => a + p.q * p.custo, 0));
  const valorVenda = cents(comSaldo.reduce((a, p) => a + p.q * p.preco, 0));
  return {
    produtos: ps.length,
    unidades: comSaldo.reduce((a, p) => a + p.q, 0),
    valorCusto,
    valorVenda,
    lucroPotencial: cents(valorVenda - valorCusto),
    baixos: ps.filter((p) => situacao(p.quantidade, p.estoqueMinimo) === "baixo").length,
    esgotados: ps.filter((p) => situacao(p.quantidade, p.estoqueMinimo) === "esgotado").length,
  };
}

export type ProdutoEntrada = {
  nome: string;
  sku?: string | null;
  categoria?: string | null;
  descricao?: string | null;
  custo: number;
  preco: number;
  quantidade?: number;
  estoqueMinimo: number;
  unidade?: string | null;
  fornecedor?: string | null;
  localizacao?: string | null;
  atributos?: { nome: string; valor: string }[];
};

const txt = (v: string | null | undefined, max = 200) => {
  const t = (v ?? "").trim().slice(0, max);
  return t || null;
};

export type ProdutoValido = {
  nome: string;
  sku: string | null;
  categoria: string | null;
  descricao: string | null;
  custo: number;
  preco: number;
  quantidade: number;
  estoqueMinimo: number;
  unidade: string;
  fornecedor: string | null;
  localizacao: string | null;
  atributos: { nome: string; valor: string }[];
};

/** Limpa e valida o que veio do formulário. Devolve o erro em português ou os dados prontos. */
export function validarProduto(e: ProdutoEntrada): { ok: true; dados: ProdutoValido } | { ok: false; error: string } {
  const nome = txt(e.nome, 120);
  if (!nome) return { ok: false, error: "Dê um nome ao produto." };
  const num = (v: number) => (Number.isFinite(v) ? v : NaN);
  const custo = num(e.custo);
  const preco = num(e.preco);
  if (!(custo >= 0)) return { ok: false, error: "O custo não pode ser negativo." };
  if (!(preco >= 0)) return { ok: false, error: "O preço não pode ser negativo." };
  const quantidade = Math.trunc(num(e.quantidade ?? 0));
  if (!(quantidade >= 0)) return { ok: false, error: "A quantidade inicial não pode ser negativa." };
  const estoqueMinimo = Math.trunc(num(e.estoqueMinimo));
  if (!(estoqueMinimo >= 0)) return { ok: false, error: "O estoque mínimo não pode ser negativo." };
  const atributos = (e.atributos ?? [])
    .map((a) => ({ nome: (a.nome ?? "").trim().slice(0, 40), valor: (a.valor ?? "").trim().slice(0, 120) }))
    .filter((a) => a.nome && a.valor)
    .slice(0, 20);
  return {
    ok: true,
    dados: {
      nome,
      sku: txt(e.sku, 40),
      categoria: txt(e.categoria, 60),
      descricao: txt(e.descricao, 2000),
      custo: cents(custo),
      preco: cents(preco),
      quantidade,
      estoqueMinimo,
      unidade: txt(e.unidade, 12) ?? "un",
      fornecedor: txt(e.fornecedor, 120),
      localizacao: txt(e.localizacao, 120),
      atributos,
    },
  };
}
