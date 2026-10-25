import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
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
const REFRESH_TTL_MS = 24 * 60 * 60 * 1000;
export const PHOTO_DIR = process.env.VERCEL ? "/tmp/photos" : path.join(process.cwd(), "data", "photos");

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

/** Baixa a foto e guarda em disco; o app serve por /api/google/photo/[id]. */
async function savePhoto(photoName: string, empresaId: number): Promise<string | null> {
  const key = googleKey();
  if (!key) return null;
  const res = await fetch(`${BASE}/${photoName}/media?maxWidthPx=800`, { headers: { "X-Goog-Api-Key": key }, cache: "no-store" });
  if (!res.ok) return null;
  await fs.mkdir(PHOTO_DIR, { recursive: true });
  await fs.writeFile(path.join(PHOTO_DIR, `${empresaId}.jpg`), Buffer.from(await res.arrayBuffer()));
  return `/api/google/photo/${empresaId}?v=${Date.now().toString(36)}`;
}

function cidadeDe(d: PlaceDetails): string | null {
  return d.addressComponents?.find((c) => c.types.includes("administrative_area_level_2"))?.longText ?? null;
}

/** Aplica os dados do Google numa empresa (cria histórico e reviews). */
export async function syncEmpresa(empresaId: number, placeId: string) {
  const d = await placeDetails(placeId);
  const fotoUrl = d.photos?.[0] ? await savePhoto(d.photos[0].name, empresaId) : null;
  const atual = db.select().from(s.empresas).where(eq(s.empresas.id, empresaId)).get();
  const now = new Date().toISOString();

  db.update(s.empresas)
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
      refreshedAt: now,
    })
    .where(eq(s.empresas.id, empresaId))
    .run();

  if (d.userRatingCount != null) {
    db.insert(s.avaliacoesHistorico)
      .values({ empresaId, data: todaySP(), rating: d.rating ?? null, total: d.userRatingCount })
      .run();
  }
  if (d.reviews?.length) {
    db.delete(s.reviews).where(eq(s.reviews.empresaId, empresaId)).run();
    for (const r of d.reviews.slice(0, 5)) {
      db.insert(s.reviews)
        .values({
          empresaId,
          autor: r.authorAttribution?.displayName ?? "Cliente Google",
          nota: Math.round(r.rating),
          texto: (r.text ?? r.originalText)?.text ?? "",
          data: (r.publishTime ?? now).slice(0, 10),
        })
        .run();
    }
  }
}

export function isStale(refreshedAt: string | null) {
  return !refreshedAt || Date.now() - new Date(refreshedAt).getTime() > REFRESH_TTL_MS;
}

/** Atualiza em segundo plano as empresas vinculadas com cache vencido (no máx. `limit`). */
export async function refreshStale(limit = 4) {
  if (!googleEnabled()) return;
  const stale = db
    .select({ id: s.empresas.id, placeId: s.empresas.placeId, refreshedAt: s.empresas.refreshedAt })
    .from(s.empresas)
    .all()
    .filter((e) => e.placeId && isStale(e.refreshedAt))
    .slice(0, limit);
  await Promise.allSettled(stale.map((e) => syncEmpresa(e.id, e.placeId!)));
}
