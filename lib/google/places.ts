import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, ready, schema as s } from "@/lib/db";
import { todaySP } from "@/lib/dates";

/**
 * Places API (New). Tudo roda no servidor; a chave nunca vai ao navegador.
 * A API do Business Profile só vale para empresas que você administra,
 * por isso os dados públicos dos clientes vêm daqui.
 */
const BASE = "https://places.googleapis.com/v1";
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

async function call<T>(url: string, init: RequestInit & { fieldMask: string }): Promise<T> {
  const key = googleKey();
  if (!key) throw new GoogleDisabledError();
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
  if (!res.ok) throw new Error(`Places API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<T>;
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
    body: JSON.stringify({ textQuery: query, languageCode: "pt-BR", regionCode: "BR", pageSize: 6 }),
  });
  return data.places ?? [];
}

export async function placeDetails(placeId: string): Promise<PlaceDetails> {
  return call<PlaceDetails>(`${BASE}/places/${encodeURIComponent(placeId)}`, { method: "GET", fieldMask: DETAIL_FIELDS });
}

/** Baixa a foto e guarda no banco (o disco da Vercel é temporário). Servida por /api/google/photo/[id]. */
async function savePhoto(photoName: string, empresaId: number): Promise<string | null> {
  const key = googleKey();
  if (!key) return null;
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
  const atual = await db.select().from(s.empresas).where(eq(s.empresas.id, empresaId)).get();
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
};

/** Acha a cidade e devolve o retângulo dela (para buscar "na cidade inteira" de verdade). */
export async function localizarCidade(nome: string): Promise<{ nome: string; centro: LatLng; viewport: Viewport } | null> {
  const data = await call<{ places?: { displayName?: LocalizedText; formattedAddress?: string; location?: LatLng; viewport?: Viewport }[] }>(
    `${BASE}/places:searchText`,
    {
      method: "POST",
      fieldMask: "places.displayName,places.formattedAddress,places.location,places.viewport",
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
    const data = await call<{ places?: LeadPlace[]; nextPageToken?: string }>(`${BASE}/places:searchText`, {
      method: "POST",
      fieldMask: LEAD_FIELDS,
      body: JSON.stringify(body),
    });
    out.push(...(data.places ?? []));
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  // A mesma empresa pode vir em duas páginas.
  return [...new Map(out.map((p) => [p.id, p])).values()];
}
