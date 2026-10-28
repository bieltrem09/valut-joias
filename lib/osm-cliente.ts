/**
 * Busca no OpenStreetMap feita pelo navegador de quem usa o painel.
 * Do servidor da Vercel os serviços públicos do OSM recusam (bloqueio de IP de nuvem);
 * do aparelho da pessoa, respondem normal. Duas fontes, juntas:
 * - Overpass: empresas pelas etiquetas e pelo nome (a mais completa);
 * - Nominatim: reserva rápida quando o Overpass está ocupado.
 */
import {
  areaDaRelacao,
  montarConsulta,
  nominatimParaLugar,
  semRepetidos,
  tipoNominatim,
  elementoParaLugar,
  ehTodos,
  type ElementoOSM,
  type Escopo,
  type LugarAberto,
  type ResultadoNominatim,
} from "./osm";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export type Limites = { south: number; west: number; north: number; east: number };
type Lugar = { nome: string; centro: { lat: number; lng: number }; limites: Limites; escopo: Escopo };

const cache = new Map<string, Lugar | null>();

/** Junta "cancelar" e "tempo esgotado" (navegadores mais antigos não têm AbortSignal.any). */
const comPrazo = (ctrl: AbortController, ms: number) =>
  "any" in AbortSignal ? AbortSignal.any([ctrl.signal, AbortSignal.timeout(ms)]) : (setTimeout(() => ctrl.abort(), ms), ctrl.signal);

async function localizar(texto: string): Promise<Lugar | null> {
  const chave = texto.trim().toLowerCase();
  if (cache.has(chave)) return cache.get(chave)!;
  const url = new URL(NOMINATIM);
  url.search = new URLSearchParams({ q: texto, format: "jsonv2", limit: "5", countrycodes: "br", "accept-language": "pt-BR" }).toString();
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const lista = (await res.json()) as (ResultadoNominatim & { boundingbox: [string, string, string, string]; addresstype?: string })[];
  if (!lista.length) {
    cache.set(chave, null);
    return null;
  }
  const r = lista.find((x) => x.osm_type === "relation" && /city|town|municipality|village/.test(x.addresstype ?? "city")) ?? lista[0];
  const [s, n, w, e] = r.boundingbox.map(Number);
  const centro = { lat: Number(r.lat), lng: Number(r.lon) };
  const limites = { south: s, north: n, west: w, east: e };
  const nome = r.name || r.display_name.split(",")[0];
  const diag = Math.hypot((n - s) * 111_000, (e - w) * 111_000 * Math.cos((centro.lat * Math.PI) / 180));
  const lugar: Lugar =
    r.osm_type === "relation"
      ? { nome, centro, limites, escopo: { tipo: "area", areaId: areaDaRelacao(r.osm_id) } }
      : { nome, centro, limites, escopo: { tipo: "raio", ...centro, metros: Math.min(6000, Math.max(800, diag / 2)) } };
  cache.set(chave, lugar);
  return lugar;
}

/** Primeiro servidor Overpass que responder. */
async function overpass(consulta: string): Promise<ElementoOSM[]> {
  const ctrl = new AbortController();
  const um = async (base: string) => {
    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data: consulta }).toString(),
      signal: comPrazo(ctrl, 25000),
    });
    if (!res.ok) throw new Error(`Overpass ${res.status}`);
    const j = (await res.json()) as { elements?: ElementoOSM[]; remark?: string };
    if (j.remark && /error|timed out/i.test(j.remark) && !j.elements?.length) throw new Error(j.remark);
    return j.elements ?? [];
  };
  try {
    return await Promise.any(OVERPASS.map(um));
  } finally {
    ctrl.abort();
  }
}

/** Nominatim: o tipo ("restaurant") dentro do retângulo, com telefone/site/horário. */
async function nominatimPOIs(segmento: string, limites: Limites): Promise<ResultadoNominatim[]> {
  const url = new URL(NOMINATIM);
  const tipo = tipoNominatim(segmento);
  url.search = new URLSearchParams({
    // "[restaurant]" = categoria do OSM; texto livre quando o nicho não tem categoria conhecida.
    q: tipo === segmento.trim() ? tipo : `[${tipo}]`,
    format: "jsonv2",
    limit: "50",
    addressdetails: "1",
    extratags: "1",
    bounded: "1",
    viewbox: [limites.west, limites.north, limites.east, limites.south].join(","),
    "accept-language": "pt-BR",
  }).toString();
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return (await res.json()) as ResultadoNominatim[];
}

export async function buscarNoNavegador(o: {
  segmento: string;
  modo: "cidade" | "perto";
  local: string;
  centro?: { lat: number; lng: number };
  raioKm: number;
}): Promise<{ lugares: LugarAberto[]; onde: { nome: string; centro: { lat: number; lng: number } } | null }> {
  let escopo: Escopo;
  let limites: Limites;
  let onde: { nome: string; centro: { lat: number; lng: number } } | null = null;
  if (o.modo === "perto" && o.centro) {
    escopo = { tipo: "raio", lat: o.centro.lat, lng: o.centro.lng, metros: o.raioKm * 1000 };
    const d = o.raioKm / 111;
    const dl = d / Math.cos((o.centro.lat * Math.PI) / 180);
    limites = { south: o.centro.lat - d, north: o.centro.lat + d, west: o.centro.lng - dl, east: o.centro.lng + dl };
  } else {
    const lugar = await localizar(o.local);
    if (!lugar) throw new Error(`Não achamos “${o.local}”. Tente “Limeira, SP”.`);
    escopo = lugar.escopo;
    limites = lugar.limites;
    onde = { nome: lugar.nome, centro: lugar.centro };
  }
  const cidade = onde?.nome;
  // "Tudo perto de mim" não tem categoria para o Nominatim: só o Overpass responde.
  const [op, nm] = await Promise.allSettled([
    overpass(montarConsulta(o.segmento, escopo)),
    ehTodos(o.segmento) ? Promise.resolve([] as ResultadoNominatim[]) : nominatimPOIs(o.segmento, limites),
  ]);
  if (op.status === "rejected" && nm.status === "rejected") throw new Error("O mapa aberto não respondeu agora. Tente de novo em alguns segundos.");
  const lugares = [
    ...(op.status === "fulfilled" ? op.value.map((el) => elementoParaLugar(el, cidade)) : []),
    ...(nm.status === "fulfilled" ? nm.value.map((r) => nominatimParaLugar(r, cidade)) : []),
  ].filter((l): l is LugarAberto => !!l && l.status !== "CLOSED_PERMANENTLY");
  const unicos = [...new Map(lugares.map((l) => [l.placeId, l])).values()];
  return { lugares: semRepetidos(unicos), onde };
}
