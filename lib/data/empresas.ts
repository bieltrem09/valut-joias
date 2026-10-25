import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { cents } from "@/lib/finance";
import type { ISODate } from "@/lib/dates";
import { listPlacas, type PlacaRow } from "./placas";
import { getVendasDaEmpresa, type VendaRow } from "./vendas";

export type EmpresaCardData = {
  id: number;
  nome: string;
  categoria: string;
  cidade: string;
  endereco: string | null;
  mapsUrl: string | null;
  fotoUrl: string | null;
  rating: number | null;
  totalAvaliacoes: number | null;
  /** Avaliações ganhas desde a ativação da placa "Avaliação Google". null se não há placa ativa desse tipo. */
  deltaAvaliacoes: number | null;
  googleDesde: ISODate | null;
  contatoNome: string | null;
  contatoCargo: string | null;
  contatoFotoUrl: string | null;
  telefone: string | null;
  faturamento: number;
  placasCompradas: number;
  ultimaCompra: ISODate | null;
  criadaEm: ISODate;
  refreshedAt: string | null;
  vinculadaAoGoogle: boolean;
};

export type EmpresaDetalhe = {
  vendas: VendaRow[];
  placas: PlacaRow[];
  reviews: { id: number; autor: string; nota: number; texto: string; data: ISODate }[];
  historico: { data: ISODate; total: number }[];
};

export function listEmpresas(): EmpresaCardData[] {
  const empresas = db.select().from(s.empresas).all();
  const vendas = db.select().from(s.vendas).all();
  const placas = db.select().from(s.placas).all();

  return empresas.map((e) => {
    const vs = vendas.filter((v) => v.empresaId === e.id);
    const pagas = vs.filter((v) => v.status === "paga");
    const ps = placas.filter((p) => p.empresaId === e.id && p.status !== "Cancelada");
    const google = ps
      .filter((p) => p.tipo === "Avaliação Google" && p.status === "Ativa" && p.ativadaEm)
      .sort((a, b) => (a.ativadaEm! < b.ativadaEm! ? -1 : 1))[0];
    const delta = google && e.avaliacoesNaInstalacao != null && e.totalAvaliacoes != null ? Math.max(0, e.totalAvaliacoes - e.avaliacoesNaInstalacao) : null;
    const ultima =
      vs
        .filter((v) => v.status !== "cancelada")
        .map((v) => v.data)
        .sort()
        .at(-1) ?? null;

    return {
      id: e.id,
      nome: e.nome,
      categoria: e.categoria,
      cidade: e.cidade,
      endereco: e.endereco,
      mapsUrl: e.mapsUrl,
      fotoUrl: e.fotoUrl,
      rating: e.rating,
      totalAvaliacoes: e.totalAvaliacoes,
      deltaAvaliacoes: delta,
      googleDesde: google?.ativadaEm ?? null,
      contatoNome: e.contatoNome,
      contatoCargo: e.contatoCargo,
      contatoFotoUrl: e.contatoFotoUrl,
      telefone: e.telefone,
      faturamento: cents(pagas.reduce((a, v) => a + v.valorVenda, 0)),
      placasCompradas: ps.length,
      ultimaCompra: ultima,
      criadaEm: e.criadaEm,
      refreshedAt: e.refreshedAt,
      vinculadaAoGoogle: !!e.placeId,
    };
  });
}

export function getEmpresaDetalhe(id: number): EmpresaDetalhe {
  return {
    vendas: getVendasDaEmpresa(id),
    placas: listPlacas({ empresaId: id }),
    reviews: db
      .select({ id: s.reviews.id, autor: s.reviews.autor, nota: s.reviews.nota, texto: s.reviews.texto, data: s.reviews.data })
      .from(s.reviews)
      .where(eq(s.reviews.empresaId, id))
      .orderBy(desc(s.reviews.data))
      .limit(5)
      .all(),
    historico: db
      .select({ data: s.avaliacoesHistorico.data, total: s.avaliacoesHistorico.total })
      .from(s.avaliacoesHistorico)
      .where(eq(s.avaliacoesHistorico.empresaId, id))
      .orderBy(s.avaliacoesHistorico.data)
      .all(),
  };
}

export function getEmpresa(id: number) {
  return db.select().from(s.empresas).where(eq(s.empresas.id, id)).get();
}
