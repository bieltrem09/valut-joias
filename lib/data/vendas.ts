import "server-only";
import { between, desc, eq, sql } from "drizzle-orm";
import { db, ready, schema as s } from "@/lib/db";
import { cmvDaVenda, resumir, serieDiaria, cents, type PontoDiario, type Resumo } from "@/lib/finance";
import type { Period } from "@/lib/period";
import type { ISODate } from "@/lib/dates";

export type VendaRow = {
  id: number;
  data: ISODate;
  empresaId: number;
  empresa: string;
  cidade: string;
  fotoUrl: string | null;
  categoria: string;
  valor: number;
  custo: number;
  lucro: number;
  status: "paga" | "pendente" | "cancelada";
  metodo: "Pix" | "Cartão" | "Boleto";
  placas: number;
};

async function vendasEntre(de: ISODate, ate: ISODate, empresaId?: number) {
  await ready();
  return db
    .select({
      id: s.vendas.id,
      data: s.vendas.data,
      empresaId: s.vendas.empresaId,
      valorVenda: s.vendas.valorVenda,
      custoPlaca: s.vendas.custoPlaca,
      custoGravacao: s.vendas.custoGravacao,
      frete: s.vendas.frete,
      taxaPagamento: s.vendas.taxaPagamento,
      status: s.vendas.status,
      metodo: s.vendas.metodo,
      empresa: s.empresas.nome,
      cidade: s.empresas.cidade,
      fotoUrl: s.empresas.fotoUrl,
      categoria: s.empresas.categoria,
      placas: sql<number>`(select count(*) from ${s.vendaPlacas} vp where vp.venda_id = ${s.vendas.id})`,
    })
    .from(s.vendas)
    .innerJoin(s.empresas, eq(s.empresas.id, s.vendas.empresaId))
    .where(empresaId ? sql`${s.vendas.empresaId} = ${empresaId} and ${s.vendas.data} between ${de} and ${ate}` : between(s.vendas.data, de, ate))
    .orderBy(desc(s.vendas.data), desc(s.vendas.id));
}

async function despesasEntre(de: ISODate, ate: ISODate) {
  await ready();
  return db
    .select({ data: s.despesas.data, valor: s.despesas.valor })
    .from(s.despesas)
    .where(between(s.despesas.data, de, ate));
}

type VendaBruta = Awaited<ReturnType<typeof vendasEntre>>[number];

function toVendaRow(v: VendaBruta): VendaRow {
  const custo = cmvDaVenda(v);
  return {
    id: v.id,
    data: v.data,
    empresaId: v.empresaId,
    empresa: v.empresa,
    cidade: v.cidade,
    fotoUrl: v.fotoUrl,
    categoria: v.categoria,
    valor: v.valorVenda,
    custo: cents(custo),
    lucro: cents(v.valorVenda - custo - v.taxaPagamento),
    status: v.status,
    metodo: v.metodo,
    placas: Number(v.placas),
  };
}

export type TopCliente = { empresaId: number; nome: string; cidade: string; fotoUrl: string | null; categoria: string; faturamento: number; vendas: number };

export type Dashboard = {
  resumo: Resumo;
  anterior: Resumo;
  serie: PontoDiario[];
  placasVendidas: number;
  placasVendidasAnterior: number;
  topClientes: TopCliente[];
  vendas: VendaRow[];
};

export async function getDashboard(p: Period): Promise<Dashboard> {
  const [vendas, despesas, vendasAnt, despesasAnt] = await Promise.all([
    vendasEntre(p.de, p.ate),
    despesasEntre(p.de, p.ate),
    vendasEntre(p.anterior.de, p.anterior.ate),
    despesasEntre(p.anterior.de, p.anterior.ate),
  ]);

  const pagas = vendas.filter((v) => v.status === "paga");
  const porEmpresa = new Map<number, TopCliente>();
  for (const v of pagas) {
    const t = porEmpresa.get(v.empresaId) ?? {
      empresaId: v.empresaId,
      nome: v.empresa,
      cidade: v.cidade,
      fotoUrl: v.fotoUrl,
      categoria: v.categoria,
      faturamento: 0,
      vendas: 0,
    };
    t.faturamento = cents(t.faturamento + v.valorVenda);
    t.vendas++;
    porEmpresa.set(v.empresaId, t);
  }

  return {
    resumo: resumir(vendas, despesas),
    anterior: resumir(vendasAnt, despesasAnt),
    serie: serieDiaria(vendas, despesas, p.de, p.ate),
    placasVendidas: pagas.reduce((a, v) => a + Number(v.placas), 0),
    placasVendidasAnterior: vendasAnt.filter((v) => v.status === "paga").reduce((a, v) => a + Number(v.placas), 0),
    topClientes: [...porEmpresa.values()].sort((a, b) => b.faturamento - a.faturamento).slice(0, 5),
    vendas: vendas.map(toVendaRow),
  };
}

/** Resumo enxuto (usado na tela de Despesas para o lucro "ao vivo"). */
export async function getResumo(p: Period): Promise<Resumo> {
  const [v, d] = await Promise.all([vendasEntre(p.de, p.ate), despesasEntre(p.de, p.ate)]);
  return resumir(v, d);
}

export async function getVendasDaEmpresa(empresaId: number): Promise<VendaRow[]> {
  return (await vendasEntre("0000-01-01", "9999-12-31", empresaId)).map(toVendaRow);
}

/** Para o formulário de venda: clientes em ordem alfabética. */
export async function listEmpresasParaSelect() {
  await ready();
  return db.select({ id: s.empresas.id, nome: s.empresas.nome, cidade: s.empresas.cidade }).from(s.empresas).orderBy(s.empresas.nome);
}
