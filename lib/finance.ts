/**
 * Todas as contas do negócio num lugar só. Funções puras, sem banco.
 *
 * Receita bruta          = Σ valorVenda das vendas pagas
 * CMV                    = Σ (custoPlaca + custoGravacao + frete)      [vendas pagas]
 * Lucro bruto            = Receita bruta − CMV
 * Despesas operacionais  = Σ despesas do período + Σ taxaPagamento     [vendas pagas]
 *                          (a taxa da maquininha é despesa de venda, não custo da placa)
 * Lucro líquido          = Lucro bruto − Despesas operacionais
 * Margem líquida         = Lucro líquido / Receita bruta
 * Ticket médio           = Receita bruta / nº de vendas pagas
 * A receber              = Σ valorVenda das vendas pendentes
 */
import type { ISODate } from "./dates";
import { eachDay } from "./dates";

export type VendaFin = {
  data: ISODate;
  valorVenda: number;
  custoPlaca: number;
  custoGravacao: number;
  frete: number;
  taxaPagamento: number;
  status: "paga" | "pendente" | "cancelada";
};

export type DespesaFin = { data: ISODate; valor: number };

export type Resumo = {
  receitaBruta: number;
  cmv: number;
  lucroBruto: number;
  despesasOperacionais: number;
  gastos: number;
  lucroLiquido: number;
  margemLiquida: number;
  ticketMedio: number;
  aReceber: number;
  vendasPagas: number;
  vendasPendentes: number;
};

/** Arredonda para centavos sem acumular erro de ponto flutuante. */
export const cents = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

export const cmvDaVenda = (v: VendaFin) => v.custoPlaca + v.custoGravacao + v.frete;

export function resumir(vendas: VendaFin[], despesas: DespesaFin[]): Resumo {
  let receitaBruta = 0;
  let cmv = 0;
  let taxas = 0;
  let aReceber = 0;
  let vendasPagas = 0;
  let vendasPendentes = 0;

  for (const v of vendas) {
    if (v.status === "paga") {
      receitaBruta += v.valorVenda;
      cmv += cmvDaVenda(v);
      taxas += v.taxaPagamento;
      vendasPagas++;
    } else if (v.status === "pendente") {
      aReceber += v.valorVenda;
      vendasPendentes++;
    }
  }
  const despesasOperacionais = despesas.reduce((a, d) => a + d.valor, 0) + taxas;
  const lucroBruto = receitaBruta - cmv;
  const lucroLiquido = lucroBruto - despesasOperacionais;

  return {
    receitaBruta: cents(receitaBruta),
    cmv: cents(cmv),
    lucroBruto: cents(lucroBruto),
    despesasOperacionais: cents(despesasOperacionais),
    gastos: cents(cmv + despesasOperacionais),
    lucroLiquido: cents(lucroLiquido),
    margemLiquida: receitaBruta > 0 ? lucroLiquido / receitaBruta : 0,
    ticketMedio: vendasPagas > 0 ? cents(receitaBruta / vendasPagas) : 0,
    aReceber: cents(aReceber),
    vendasPagas,
    vendasPendentes,
  };
}

/** Variação relativa. `null` quando não há base de comparação. */
export function variacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual === 0 ? 0 : null;
  return (atual - anterior) / Math.abs(anterior);
}

export type PontoDiario = {
  data: ISODate;
  receita: number;
  cmv: number;
  despesas: number;
  lucro: number;
  /** Lucro líquido acumulado até o fim deste dia. */
  acumulado: number;
};

/** Série diária do período (dias sem movimento entram zerados). */
export function serieDiaria(vendas: VendaFin[], despesas: DespesaFin[], de: ISODate, ate: ISODate): PontoDiario[] {
  const dias = new Map<ISODate, Omit<PontoDiario, "data" | "acumulado" | "lucro">>();
  for (const d of eachDay(de, ate)) dias.set(d, { receita: 0, cmv: 0, despesas: 0 });

  for (const v of vendas) {
    const dia = dias.get(v.data);
    if (!dia || v.status !== "paga") continue;
    dia.receita += v.valorVenda;
    dia.cmv += cmvDaVenda(v);
    dia.despesas += v.taxaPagamento;
  }
  for (const d of despesas) {
    const dia = dias.get(d.data);
    if (dia) dia.despesas += d.valor;
  }

  let acc = 0;
  return [...dias.entries()].map(([data, p]) => {
    const lucro = p.receita - p.cmv - p.despesas;
    acc += lucro;
    return {
      data,
      receita: cents(p.receita),
      cmv: cents(p.cmv),
      despesas: cents(p.despesas),
      lucro: cents(lucro),
      acumulado: cents(acc),
    };
  });
}

/**
 * "De onde vai cada real": fatias da receita, em fração de 0 a 1.
 * Se o período deu prejuízo, `lucro` fica 0 e `prejuizo` traz o excedente.
 */
export function composicaoDoReal(r: Resumo) {
  if (r.receitaBruta <= 0) return { cmv: 0, despesas: 0, lucro: 0, prejuizo: 0 };
  const cmv = r.cmv / r.receitaBruta;
  const despesas = r.despesasOperacionais / r.receitaBruta;
  const lucro = Math.max(0, r.lucroLiquido / r.receitaBruta);
  const prejuizo = Math.max(0, -r.lucroLiquido / r.receitaBruta);
  return { cmv, despesas, lucro, prejuizo };
}
