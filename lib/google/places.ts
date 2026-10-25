import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, ready, schema as s, one } from "@/lib/db";
import { todaySP } from "@/lib/dates";
import { consumir, LIMITES, type TipoUso } from "./uso";

/**
 * Places API (New). Tudo roda no servidor; a chave nunca vai ao navegador.
 * A API do Business Profile só vale para empresas que você administra,
 * por isso os dados públicos dos clientes vêm daqui.
 */
// GOOGLE_PLACES_BASE_URL: só para apontar a um simulador nos testes.
const BASE = process.env.GOOGLE_PLACES_BASE_URL ?? "https://places.googleapis.com/v1";
const DETAIL_FIELDS =
  "id,displayName,rating,userRatingCount,photos,formattedAddress,googleMapsUri,primaryTypeDisplayName,nationalPhoneNumber,reviews,addressComponents";
const SEARCH_FIELDS = "places.id,places.displayName,places.formattedAddress,places.primaryTypeDisplayName,places.rating,places.userRatingCount";
const REFRESH_TTL_MS = 20 * 60 * 60 * 1000; // 20h: o cron diário sempre encontra o cache vencido

export const googleKey = () => process.env.GOOGLE_PLACES_API_KEY?.trim() || null;
export const googleEnabled = () => !!googleKey();

export class GoogleDisabledError extends Error {
  constructor() {
    super("GOOGLE_PLACES_API_KEY não configurada");
  }
}

/** `uso`: em que cota grátis a chamada conta (null = gratuita sem limite, como buscar só IDs). */
async function call<T>(url: string, init: RequestInit & { fieldMask: string; uso: TipoUso | null }): Promise<T> {
  const key = googleKey();
  if (!key) throw new GoogleDisabledError();
  if (init.uso && !(await consumir(init.uso))) throw new GoogleLimiteError(init.uso);
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": init.fieldMask,
      "Accept-Language": "pt-BR",
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new GoogleApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}

/** Erro do Google já traduzido: `motivo` diz em português o que mudar no Google Cloud. */
export class GoogleApiError extends Error {
  motivo: string;
  constructor(
    public status: number,
    corpo: string,
  ) {
    super(`Places API ${status}: ${corpo.slice(0, 300)}`);
    this.motivo = traduzirErro(status, corpo);
  }
}

/** O painel chegou no limite grátis do mês e não chamou o Google (para não gerar cobrança). */
export class GoogleLimiteError extends GoogleApiError {
  constructor(tipo: TipoUso) {
    super(429, "");
    const nome = tipo === "buscas" ? "buscas" : tipo === "fotos" ? "fotos" : "atualizações de clientes";
    this.motivo = `Chegou no limite grátis do mês (${LIMITES[tipo]} ${nome}). O painel parou para não gerar cobrança no seu cartão; volta no dia 1º.`;
  }
}

function traduzirErro(status: number, corpo: string): string {
  let reason = "";
  let mensagem = "";
  try {
    const j = JSON.parse(corpo) as { error?: { message?: string; details?: { reason?: string }[] } };
    reason = j.error?.details?.find((d) => d.reason)?.reason ?? "";
    mensagem = j.error?.message ?? "";
  } catch {}
  const tudo = `${reason} ${mensagem}`;
  if (/API_KEY_INVALID|API key not valid/i.test(tudo))
    return "A chave está errada. Copie de novo a chave inteira no Google Cloud (Credenciais) e cole na Vercel, sem espaços.";
  if (/BILLING|billing/i.test(tudo))
    return "Falta ativar o faturamento no projeto do Google Cloud. Vá em Faturamento, vincule um cartão (o Google dá crédito mensal grátis) e espere uns minutos.";
  if (/SERVICE_DISABLED|has not been used|is disabled/i.test(tudo))
    return "A “Places API (New)” não está ativada nesse projeto. Em APIs e serviços → Biblioteca, procure “Places API (New)” e clique em Ativar. Atenção: é a “(New)”, não a antiga.";
  if (/REFERRER|referer/i.test(tudo))
    return "A chave está restrita a sites (HTTP referrers). O painel chama o Google pelo servidor, então em “Restrições de aplicativo” escolha “Nenhuma”.";
  if (/IP_ADDRESS|IP address/i.test(tudo)) return "A chave está restrita por IP. A Vercel muda de IP, então em “Restrições de aplicativo” escolha “Nenhuma”.";
  if (/API_KEY_SERVICE_BLOCKED|blocked/i.test(tudo))
    return "A chave não tem permissão para a Places API (New). Em “Restrições de API”, marque a “Places API (New)” na lista ou deixe sem restrição.";
  if (status === 429) return "O Google limitou as chamadas (cota). Espere alguns minutos ou aumente a cota no Google Cloud.";
  if (status === 401 || status === 403) return `O Google recusou a chave: ${mensagem || "permissão negada"}`;
  return `O Google respondeu com erro ${status}${mensagem ? `: ${mensagem}` : ""}.`;
}

/** Testa a chave com a chamada mais barata possível (só IDs). */
export async function testarChave(): Promise<{ ok: true } | { ok: false; motivo: string }> {
  try {
    await call(`${BASE}/places:searchText`, {
      method: "POST",
      fieldMask: "places.id",
      uso: null, // só IDs: faixa sem custo
      body: JSON.stringify({ textQuery: "padaria Limeira SP", pageSize: 1 }),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: e instanceof GoogleApiError ? e.motivo : "Não deu para falar com o Google agora. Tente de novo em instantes." };
  }
}

type LocalizedText = { text: string; languageCode?: string };
export type PlaceSearchResult = {
  id: string;
  displayName?: LocalizedText;
  formattedAddress?: string;
  primaryTypeDisplayName?: LocalizedText;
  rating?: number;
  userRatingCount?: number;
};
type PlaceDetails = PlaceSearchResult & {
  googleMapsUri?: string;
  nationalPhoneNumber?: string;
  photos?: { name: string }[];
  reviews?: {
    rating: number;
    text?: LocalizedText;
    originalText?: LocalizedText;
    authorAttribution?: { displayName: string };
    publishTime?: string;
  }[];
  addressComponents?: { longText: string; types: string[] }[];
};

export async function searchText(query: string): Promise<PlaceSearchResult[]> {
  const data = await call<{ places?: PlaceSearchResult[] }>(`${BASE}/places:searchText`, {
    method: "POST",
    fieldMask: SEARCH_FIELDS,
    uso: "buscas",
    body: JSON.stringify({ textQuery: query, languageCode: "pt-BR", regionCode: "BR", pageSize: 6 }),
  });
  return data.places ?? [];
}

export async function placeDetails(placeId: string): Promise<PlaceDetails> {
  return call<PlaceDetails>(`${BASE}/places/${encodeURIComponent(placeId)}`, { method: "GET", fieldMask: DETAIL_FIELDS, uso: "detalhes" });
}

/** Baixa a foto e guarda no banco (o disco da Vercel é temporário). Servida por /api/google/photo/[id]. */
async function savePhoto(photoName: string, empresaId: number): Promise<string | null> {
  const key = googleKey();
  if (!key || !(await consumir("fotos"))) return null;
  const res = await fetch(`${BASE}/${photoName}/media?maxWidthPx=800`, { headers: { "X-Goog-Api-Key": key }, cache: "no-store" });
  if (!res.ok) return null;
  const bytes = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type") ?? "image/jpeg";
  const now = new Date().toISOString();
  await db
    .insert(s.fotos)
    .values({ empresaId, mime, bytes, atualizadaEm: now })
    .onConflictDoUpdate({ target: s.fotos.empresaId, set: { mime, bytes, atualizadaEm: now } });
  return `/api/google/photo/${empresaId}?v=${Date.now().toString(36)}`;
}

function cidadeDe(d: PlaceDetails): string | null {
  return d.addressComponents?.find((c) => c.types.includes("administrative_area_level_2"))?.longText ?? null;
}

/** Uma medição por empresa por dia: a mais recente do dia vence. */
export async function registrarMedicao(empresaId: number, total: number, rating: number | null, fonte: "google" | "manual", data = todaySP()) {
  await ready();
  await db
    .insert(s.avaliacoesHistorico)
    .values({ empresaId, data, total, rating, fonte })
    .onConflictDoUpdate({ target: [s.avaliacoesHistorico.empresaId, s.avaliacoesHistorico.data], set: { total, rating, fonte } });
}

/** Aplica os dados do Google numa empresa e registra a medição do dia. */
export async function syncEmpresa(empresaId: number, placeId: string, opts: { foto?: boolean } = {}) {
  await ready();
  const d = await placeDetails(placeId);
  const atual = await db.select().from(s.empresas).where(eq(s.empresas.id, empresaId)).then(one);
  // Foto: na criação e quando ainda não há; o cron diário não baixa de novo.
  const precisaFoto = opts.foto ?? !atual?.fotoUrl;
  const fotoUrl = precisaFoto && d.photos?.[0] ? await savePhoto(d.photos[0].name, empresaId) : null;

  await db
    .update(s.empresas)
    .set({
      placeId: d.id,
      nome: d.displayName?.text ?? atual?.nome,
      categoria: d.primaryTypeDisplayName?.text ?? atual?.categoria,
      cidade: cidadeDe(d) ?? atual?.cidade,
      endereco: d.formattedAddress ?? atual?.endereco,
      mapsUrl: d.googleMapsUri ?? atual?.mapsUrl,
      telefone: d.nationalPhoneNumber ?? atual?.telefone,
      rating: d.rating ?? atual?.rating,
      totalAvaliacoes: d.userRatingCount ?? atual?.totalAvaliacoes,
      ...(fotoUrl ? { fotoUrl } : {}),
      refreshedAt: new Date().toISOString(),
    })
    .where(eq(s.empresas.id, empresaId));

  if (d.userRatingCount != null) await registrarMedicao(empresaId, d.userRatingCount, d.rating ?? null, "google");

  if (d.reviews?.length) {
    await db.delete(s.reviews).where(eq(s.reviews.empresaId, empresaId));
    await db.insert(s.reviews).values(
      d.reviews.slice(0, 5).map((r) => ({
        empresaId,
        autor: r.authorAttribution?.displayName ?? "Cliente Google",
        nota: Math.round(r.rating),
        texto: (r.text ?? r.originalText)?.text ?? "",
        data: (r.publishTime ?? new Date().toISOString()).slice(0, 10),
      })),
    );
  }
  return { total: d.userRatingCount ?? null, rating: d.rating ?? null };
}

export function isStale(refreshedAt: string | null) {
  return !refreshedAt || Date.now() - new Date(refreshedAt).getTime() > REFRESH_TTL_MS;
}

/** Atualiza as empresas vinculadas com cache vencido. Usado pelo cron diário e ao abrir Clientes. */
export async function refreshStale(limit = 50) {
  if (!googleEnabled()) return { atualizadas: 0, falhas: 0 };
  await ready();
  const stale = (
    await db
      .select({ id: s.empresas.id, placeId: s.empresas.placeId, refreshedAt: s.empresas.refreshedAt })
      .from(s.empresas)
      .where(sql`${s.empresas.placeId} is not null`)
  )
    .filter((e) => isStale(e.refreshedAt))
    .slice(0, limit);
  const r = await Promise.allSettled(stale.map((e) => syncEmpresa(e.id, e.placeId!)));
  return { atualizadas: r.filter((x) => x.status === "fulfilled").length, falhas: r.filter((x) => x.status === "rejected").length };
}

/* --------------------------- Prospecção --------------------------- */

const LEAD_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.primaryTypeDisplayName",
  "places.rating",
  "places.userRatingCount",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.businessStatus",
  "places.photos",
  "places.regularOpeningHours.weekdayDescriptions",
  "places.currentOpeningHours.openNow",
  "places.priceLevel",
  "nextPageToken",
].join(",");

type LatLng = { latitude: number; longitude: number };
export type Viewport = { low: LatLng; high: LatLng };

type LeadPlace = {
  id: string;
  displayName?: LocalizedText;
  formattedAddress?: string;
  location?: LatLng;
  primaryTypeDisplayName?: LocalizedText;
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  photos?: { name: string }[];
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  currentOpeningHours?: { openNow?: boolean };
  priceLevel?: string;
};
export type { LeadPlace };

/** Acha a cidade e devolve o retângulo dela (para buscar "na cidade inteira" de verdade). */
export async function localizarCidade(nome: string): Promise<{ nome: string; centro: LatLng; viewport: Viewport } | null> {
  const data = await call<{ places?: { displayName?: LocalizedText; formattedAddress?: string; location?: LatLng; viewport?: Viewport }[] }>(
    `${BASE}/places:searchText`,
    {
      method: "POST",
      fieldMask: "places.displayName,places.formattedAddress,places.location,places.viewport",
      uso: "buscas",
      body: JSON.stringify({ textQuery: nome, includedType: "locality", strictTypeFiltering: true, languageCode: "pt-BR", regionCode: "BR", pageSize: 1 }),
    },
  );
  const p = data.places?.[0];
  if (!p?.location || !p.viewport) return null;
  return { nome: p.displayName?.text ?? nome, centro: p.location, viewport: p.viewport };
}

/**
 * Text Search com paginação (até 3 páginas = 60 lugares, limite do Google).
 * `restricao` corta fora do retângulo; `vies` só favorece o círculo.
 */
export async function buscarLugares(opts: {
  query: string;
  restricao?: Viewport;
  vies?: { centro: LatLng; raioM: number };
  porDistancia?: boolean;
  paginas?: number;
}): Promise<LeadPlace[]> {
  const out: LeadPlace[] = [];
  let pageToken: string | undefined;
  for (let i = 0; i < (opts.paginas ?? 3); i++) {
    const body: Record<string, unknown> = { textQuery: opts.query, languageCode: "pt-BR", regionCode: "BR", pageSize: 20 };
    if (opts.restricao) body.locationRestriction = { rectangle: opts.restricao };
    else if (opts.vies) body.locationBias = { circle: { center: opts.vies.centro, radius: Math.min(50000, opts.vies.raioM) } };
    if (opts.porDistancia) body.rankPreference = "DISTANCE";
    if (pageToken) body.pageToken = pageToken;
    let data: { places?: LeadPlace[]; nextPageToken?: string };
    try {
      data = await call(`${BASE}/places:searchText`, { method: "POST", fieldMask: LEAD_FIELDS, uso: "buscas", body: JSON.stringify(body) });
    } catch (e) {
      // Limite do mês no meio da paginação: fica com o que já veio.
      if (e instanceof GoogleLimiteError && out.length) break;
      throw e;
    }
    out.push(...(data.places ?? []));
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  // A mesma empresa pode vir em duas páginas.
  return [...new Map(out.map((p) => [p.id, p])).values()];
}

/** Endereço público da foto (googleusercontent), sem a chave. Conta na cota de fotos. */
const cacheFoto = new Map<string, string>();
export async function urlFoto(nome: string, larguraPx = 480): Promise<string | null> {
  const k = `${nome}|${larguraPx}`;
  if (cacheFoto.has(k)) return cacheFoto.get(k)!;
  const key = googleKey();
  if (!key || !(await consumir("fotos"))) return null;
  const res = await fetch(`${BASE}/${nome}/media?maxWidthPx=${larguraPx}&skipHttpRedirect=true`, { headers: { "X-Goog-Api-Key": key }, cache: "no-store" });
  if (!res.ok) return null;
  const j = (await res.json()) as { photoUri?: string };
  if (!j.photoUri) return null;
  cacheFoto.set(k, j.photoUri);
  return j.photoUri;
}
