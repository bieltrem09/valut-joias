import "server-only";
import { areaDaRelacao, elementoParaLugar, montarConsulta, semRepetidos, type ElementoOSM, type Escopo, type LugarAberto } from "./osm";

/**
 * OpenStreetMap: Nominatim acha a cidade, Overpass acha as empresas.
 * Serviços públicos e gratuitos; a política deles pede um User-Agent que identifique o app.
 */
const UA = "EclouraPainel/1.0 (prospeccao; https://ecloura-painel.vercel.app)";
// OSM_OVERPASS_URL / OSM_NOMINATIM_URL: só para apontar a um servidor próprio (ou de teste).
const OVERPASS = process.env.OSM_OVERPASS_URL
  ? [process.env.OSM_OVERPASS_URL]
  : ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
const NOMINATIM = process.env.OSM_NOMINATIM_URL ?? "https://nominatim.openstreetmap.org/search";

export type Limites = { south: number; west: number; north: number; east: number };
export type Lugar = { nome: string; centro: { lat: number; lng: number }; limites: Limites; escopo: Escopo };

export class OsmError extends Error {}

const cacheLugar = new Map<string, Lugar | null>();

/** "Limeira, SP" → contorno da cidade. Bairro ou endereço vira um raio em volta do ponto. Guardado por processo. */
export async function localizar(texto: string): Promise<Lugar | null> {
  const chave = texto.trim().toLowerCase();
  if (cacheLugar.has(chave)) return cacheLugar.get(chave)!;
  const lugar = await localizarSemCache(texto);
  cacheLugar.set(chave, lugar);
  return lugar;
}

async function localizarSemCache(texto: string): Promise<Lugar | null> {
  const url = new URL(NOMINATIM);
  url.search = new URLSearchParams({ q: texto, format: "jsonv2", limit: "5", countrycodes: "br", "accept-language": "pt-BR" }).toString();
  const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new OsmError(`Nominatim ${res.status}`);
  const lista = (await res.json()) as {
    osm_type: string;
    osm_id: number;
    lat: string;
    lon: string;
    boundingbox: [string, string, string, string];
    name?: string;
    display_name: string;
    addresstype?: string;
  }[];
  if (!lista.length) return null;
  // Cidade de verdade (relação administrativa) vence; senão, o primeiro resultado.
  const r = lista.find((x) => x.osm_type === "relation" && /city|town|municipality|village/.test(x.addresstype ?? "city")) ?? lista[0];
  const [s, n, w, e] = r.boundingbox.map(Number);
  const centro = { lat: Number(r.lat), lng: Number(r.lon) };
  const limites = { south: s, north: n, west: w, east: e };
  const nome = r.name || r.display_name.split(",")[0];
  if (r.osm_type === "relation") return { nome, centro, limites, escopo: { tipo: "area", areaId: areaDaRelacao(r.osm_id) } };
  // Bairro/rua: raio de metade da diagonal do retângulo, entre 800 m e 6 km.
  const diag = Math.hypot((n - s) * 111_000, (e - w) * 111_000 * Math.cos((centro.lat * Math.PI) / 180));
  return { nome, centro, limites, escopo: { tipo: "raio", ...centro, metros: Math.min(6000, Math.max(800, diag / 2)) } };
}

/** Pergunta aos servidores Overpass ao mesmo tempo e fica com o primeiro que responder. */
async function overpass(consulta: string): Promise<ElementoOSM[]> {
  const ctrl = new AbortController();
  const um = async (base: string) => {
    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
      body: new URLSearchParams({ data: consulta }).toString(),
      cache: "no-store",
      signal: AbortSignal.any([ctrl.signal, AbortSignal.timeout(16000)]),
    });
    if (!res.ok) throw new OsmError(`Overpass ${res.status}`);
    const j = (await res.json()) as { elements?: ElementoOSM[]; remark?: string };
    // "runtime error: Query timed out" vem com 200 e lista vazia: conta como falha.
    if (j.remark && /error|timed out/i.test(j.remark) && !j.elements?.length) throw new OsmError(j.remark);
    return j.elements ?? [];
  };
  try {
    return await Promise.any(OVERPASS.map(um));
  } catch {
    throw new OsmError("Overpass indisponível");
  } finally {
    ctrl.abort();
  }
}

export async function buscarAberto(segmento: string, escopo: Escopo, cidade?: string): Promise<LugarAberto[]> {
  const elementos = await overpass(montarConsulta(segmento, escopo));
  const lugares = elementos.map((el) => elementoParaLugar(el, cidade)).filter((l): l is LugarAberto => !!l && l.status !== "CLOSED_PERMANENTLY");
  return semRepetidos(lugares);
}
