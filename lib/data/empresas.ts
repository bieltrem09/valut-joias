import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db, ready, schema as s, one } from "@/lib/db";
import { cents } from "@/lib/finance";
import { todaySP, type ISODate } from "@/lib/dates";
import { calcularCrescimento, ganhoAgregado, type Crescimento, type Medicao } from "@/lib/crescimento";
import { listPlacas, type PlacaRow } from "./placas";
import { getVendasDaEmpresa, type VendaRow } from "./vendas";

export type EmpresaCardData = {
  id: number;
  nome: string;
  categoria: string;
  cidade: string;
  endereco: string | null;
  mapsUrl: string | null;
  linkAvaliacao: string | null;
  fotoUrl: string | null;
  telefone: string | null;
  rating: number | null;
  totalAvaliacoes: number | null;
  contatoNome: string | null;
  contatoCargo: string | null;
  faturamento: number;
  placasCompradas: number;
  ultimaCompra: ISODate | null;
  criadaEm: ISODate;
  refreshedAt: string | null;
  vinculadaAoGoogle: boolean;
  /** Data de ativação da primeira placa "Avaliação Google" ativa. */
  instalacao: ISODate | null;
  baseInformada: number | null;
  crescimento: Crescimento;
};

export type EmpresaDetalhe = {
  vendas: VendaRow[];
  placas: PlacaRow[];
  reviews: { id: number; autor: string; nota: number; texto: string; data: ISODate }[];
};

async function medicoesPorEmpresa() {
  const rows = await db.select().from(s.avaliacoesHistorico).orderBy(asc(s.avaliacoesHistorico.data));
  const map = new Map<number, Medicao[]>();
  for (const r of rows) {
    if (!map.has(r.empresaId)) map.set(r.empresaId, []);
    map.get(r.empresaId)!.push({ data: r.data, total: r.total, rating: r.rating, fonte: r.fonte });
  }
  return map;
}

export async function listEmpresas(): Promise<EmpresaCardData[]> {
  await ready();
  const [empresas, vendas, placas, medicoes] = await Promise.all([
    db.select().from(s.empresas),
    db.select().from(s.vendas),
    db.select().from(s.placas),
    medicoesPorEmpresa(),
  ]);
  const hoje = todaySP();

  return empresas.map((e) => {
    const vs = vendas.filter((v) => v.empresaId === e.id);
    const ps = placas.filter((p) => p.empresaId === e.id && p.status !== "Cancelada");
    const google = ps
      .filter((p) => p.tipo === "Avaliação Google" && (p.status === "Ativa" || p.status === "Inativa") && p.ativadaEm)
      .sort((a, b) => (a.ativadaEm! < b.ativadaEm! ? -1 : 1))[0];
    const instalacao = google?.ativadaEm ?? null;
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
      linkAvaliacao: e.linkAvaliacao,
      fotoUrl: e.fotoUrl,
      telefone: e.telefone,
      rating: e.rating,
      totalAvaliacoes: e.totalAvaliacoes,
      contatoNome: e.contatoNome,
      contatoCargo: e.contatoCargo,
      faturamento: cents(vs.filter((v) => v.status === "paga").reduce((a, v) => a + v.valorVenda, 0)),
      placasCompradas: ps.length,
      ultimaCompra: ultima,
      criadaEm: e.criadaEm,
      refreshedAt: e.refreshedAt,
      vinculadaAoGoogle: !!e.placeId,
      instalacao,
      baseInformada: e.avaliacoesNaInstalacao,
      crescimento: calcularCrescimento(medicoes.get(e.id) ?? [], instalacao, e.avaliacoesNaInstalacao, hoje),
    };
  });
}

/** Série somada de todos os clientes, para o gráfico do topo de Clientes. */
export function crescimentoGeral(empresas: EmpresaCardData[]) {
  return ganhoAgregado(
    empresas.map((e) => ({ base: e.crescimento.base, instalacao: e.instalacao, medicoes: e.crescimento.medicoes })),
    todaySP(),
  );
}

export async function getEmpresaDetalhe(id: number): Promise<EmpresaDetalhe> {
  await ready();
  const [vendas, placas, reviews] = await Promise.all([
    getVendasDaEmpresa(id),
    listPlacas({ empresaId: id }),
    db
      .select({ id: s.reviews.id, autor: s.reviews.autor, nota: s.reviews.nota, texto: s.reviews.texto, data: s.reviews.data })
      .from(s.reviews)
      .where(eq(s.reviews.empresaId, id))
      .orderBy(desc(s.reviews.data))
      .limit(5),
  ]);
  return { vendas, placas, reviews };
}

export async function getEmpresa(id: number) {
  await ready();
  return db.select().from(s.empresas).where(eq(s.empresas.id, id)).then(one);
}
