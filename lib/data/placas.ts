import "server-only";
import { desc, eq, gte, inArray } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { cents } from "@/lib/finance";
import { addDays, eachDay, todaySP, type ISODate } from "@/lib/dates";
import type { PlacaStatus, PlacaTipo } from "@/lib/db/schema";

export type PlacaRow = {
  id: number;
  codigo: string;
  tipo: PlacaTipo;
  status: PlacaStatus;
  destinoUrl: string;
  leituras: number;
  ativadaEm: ISODate | null;
  data: ISODate;
  empresaId: number;
  empresa: string;
  cidade: string;
  fotoUrl: string | null;
  categoria: string;
  valor: number;
  custoProducao: number;
  lucro: number;
  /** Leituras por dia, últimos 30 dias (mais antigo → hoje). */
  leituras30d: number[];
};

export function listPlacas(filtro?: { empresaId?: number }): PlacaRow[] {
  const rows = db
    .select({
      id: s.placas.id,
      codigo: s.placas.codigo,
      tipo: s.placas.tipo,
      status: s.placas.status,
      destinoUrl: s.placas.destinoUrl,
      leituras: s.placas.leituras,
      ativadaEm: s.placas.ativadaEm,
      empresaId: s.placas.empresaId,
      empresa: s.empresas.nome,
      cidade: s.empresas.cidade,
      fotoUrl: s.empresas.fotoUrl,
      categoria: s.empresas.categoria,
      vendaId: s.vendas.id,
      data: s.vendas.data,
      valorVenda: s.vendas.valorVenda,
      custoPlaca: s.vendas.custoPlaca,
      custoGravacao: s.vendas.custoGravacao,
      frete: s.vendas.frete,
      taxa: s.vendas.taxaPagamento,
    })
    .from(s.placas)
    .innerJoin(s.empresas, eq(s.empresas.id, s.placas.empresaId))
    .innerJoin(s.vendaPlacas, eq(s.vendaPlacas.placaId, s.placas.id))
    .innerJoin(s.vendas, eq(s.vendas.id, s.vendaPlacas.vendaId))
    .where(filtro?.empresaId ? eq(s.placas.empresaId, filtro.empresaId) : undefined)
    .orderBy(desc(s.vendas.data), desc(s.placas.codigo))
    .all();

  // Quantas placas cada venda tem, para ratear valor e custo.
  const porVenda = new Map<number, number>();
  for (const r of rows) porVenda.set(r.vendaId, (porVenda.get(r.vendaId) ?? 0) + 1);

  const today = todaySP();
  const inicio = addDays(today, -29);
  const dias = eachDay(inicio, today);
  const ids = new Set(rows.map((r) => r.id));
  const leit = ids.size
    ? db
        .select()
        .from(s.leituras)
        .where(gte(s.leituras.data, inicio))
        .all()
        .filter((l) => ids.has(l.placaId))
    : [];
  const mapa = new Map<number, Map<ISODate, number>>();
  for (const l of leit) {
    if (!mapa.has(l.placaId)) mapa.set(l.placaId, new Map());
    mapa.get(l.placaId)!.set(l.data, l.total);
  }

  return rows.map((r) => {
    const n = porVenda.get(r.vendaId) ?? 1;
    const cancelada = r.status === "Cancelada";
    const valor = cancelada ? 0 : cents(r.valorVenda / n);
    const custoProducao = cents((r.custoPlaca + r.custoGravacao) / n);
    const lucro = cancelada ? 0 : cents((r.valorVenda - r.custoPlaca - r.custoGravacao - r.frete - r.taxa) / n);
    const m = mapa.get(r.id);
    return {
      id: r.id,
      codigo: r.codigo,
      tipo: r.tipo,
      status: r.status,
      destinoUrl: r.destinoUrl,
      leituras: r.leituras,
      ativadaEm: r.ativadaEm,
      data: r.data,
      empresaId: r.empresaId,
      empresa: r.empresa,
      cidade: r.cidade,
      fotoUrl: r.fotoUrl,
      categoria: r.categoria,
      valor,
      custoProducao,
      lucro,
      leituras30d: dias.map((d) => m?.get(d) ?? 0),
    };
  });
}

export function placasResumo(rows: PlacaRow[]) {
  const vendidas = rows.filter((r) => r.status !== "Cancelada");
  return {
    vendidas: vendidas.length,
    ativas: rows.filter((r) => r.status === "Ativa").length,
    pendentes: rows.filter((r) => r.status === "Pendente de envio").length,
    leituras: rows.reduce((a, r) => a + r.leituras, 0),
    leituras30d: rows.reduce((a, r) => a + r.leituras30d.reduce((x, y) => x + y, 0), 0),
  };
}

export function placasPorIds(ids: number[]) {
  if (!ids.length) return [];
  return db.select().from(s.placas).where(inArray(s.placas.id, ids)).all();
}
