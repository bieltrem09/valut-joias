/**
 * Busca de estabelecimentos no TomTom (Search API), feita no servidor.
 * Grátis até 2.500 chamadas por dia, sem cartão: passando disso o TomTom só
 * recusa, não cobra. Base comercial, bem maior que o mapa aberto no Brasil.
 * Não traz nota nem avaliações do Google: a pontuação usa os mesmos sinais do mapa aberto.
 */
import { ehTodos, semAcento, type LugarAberto } from "./osm";

const BASE = process.env.TOMTOM_BASE_URL ?? "https://api.tomtom.com";
/** Até 2 páginas de 100: dá conta de uma cidade média sem gastar a cota. */
const POR_PAGINA = 100;
const PAGINAS = 2;
/** "Tudo perto de mim" junta qualquer ramo: até 5 páginas (500 lugares, 5 chamadas da cota). */
const PAGINAS_TODOS = 5;

export const tomtomEnabled = () => !!process.env.TOMTOM_API_KEY;

type Ponto = { lat: number; lon: number };
export type ResultadoTomTom = {
  id: string;
  poi?: { name?: string; phone?: string; url?: string; categories?: string[] };
  address?: { freeformAddress?: string; municipality?: string; streetName?: string; streetNumber?: string; municipalitySubdivision?: string };
  position?: Ponto;
};
type Geocode = {
  results?: { position: Ponto; boundingBox?: { topLeftPoint: Ponto; btmRightPoint: Ponto }; address?: { municipality?: string } }[];
};

export class TomTomError extends Error {}

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Celular primeiro, como no mapa aberto: é o que vira WhatsApp. */
function telefoneDe(bruto?: string): string | null {
  const todos = (bruto ?? "")
    .split(/[;,/]/)
    .map((v) => v.trim())
    .filter((v) => v.replace(/\D/g, "").length >= 10);
  const celular = todos.find((v) => {
    const d = v.replace(/\D/g, "").replace(/^55/, "");
    return d.length === 11 && d[2] === "9";
  });
  return celular ?? todos[0] ?? null;
}

export function tomtomParaLugar(r: ResultadoTomTom, categoriaPadrao: string): LugarAberto | null {
  const nome = r.poi?.name?.trim();
  if (!nome || !r.position) return null;
  let website = r.poi?.url?.trim() || null;
  if (website && !/^https?:/i.test(website)) website = `https://${website}`;
  let instagram: string | null = null;
  if (website && /instagram\.com/i.test(website)) {
    instagram = website;
    website = null;
  }
  const a = r.address ?? {};
  const rua = [a.streetName, a.streetNumber].filter(Boolean).join(", ");
  const endereco = [rua, a.municipalitySubdivision, a.municipality].filter(Boolean).join(" - ") || a.freeformAddress || null;
  return {
    placeId: `tomtom:${r.id}`,
    nome,
    categoria: r.poi?.categories?.[0] ? capitalizar(r.poi.categories[0]) : categoriaPadrao,
    endereco,
    lat: r.position.lat,
    lng: r.position.lon,
    telefone: telefoneDe(r.poi?.phone),
    website,
    mapsUrl: null,
    rating: null,
    totalAvaliacoes: null,
    status: null,
    instagram,
    horario: null,
    fotoUrl: null,
  };
}

async function chamar<T>(caminho: string, params: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE}${caminho}`);
  url.search = new URLSearchParams({
    key: process.env.TOMTOM_API_KEY ?? "",
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  }).toString();
  const res = await fetch(url, { signal: AbortSignal.timeout(12000), cache: "no-store" });
  if (res.status === 403 || res.status === 401) throw new TomTomError("A chave do TomTom foi recusada (confira a TOMTOM_API_KEY ou a cota do dia).");
  if (res.status === 429) throw new TomTomError("O TomTom pediu uma pausa (muitas buscas seguidas). Tente em alguns segundos.");
  if (!res.ok) throw new TomTomError(`O TomTom não respondeu (${res.status}).`);
  return (await res.json()) as T;
}

export async function buscarTomTom(o: {
  segmento: string;
  modo: "cidade" | "perto";
  local: string;
  centro?: { lat: number; lng: number };
  raioKm: number;
  categoria: string;
}): Promise<{ lugares: LugarAberto[]; onde: { nome: string; centro: { lat: number; lng: number } } | null }> {
  const comum = { countrySet: "BR", language: "pt-BR", limit: POR_PAGINA };
  let area: Record<string, string | number>;
  let onde: { nome: string; centro: { lat: number; lng: number } } | null = null;
  let municipio: string | undefined;

  if (o.modo === "perto" && o.centro) {
    area = { lat: o.centro.lat, lon: o.centro.lng, radius: Math.round(o.raioKm * 1000) };
  } else {
    const g = await chamar<Geocode>(`/search/2/geocode/${encodeURIComponent(o.local)}.json`, { countrySet: "BR", language: "pt-BR", limit: 1 });
    const r = g.results?.[0];
    if (!r) throw new TomTomError(`Não achamos “${o.local}”. Tente “Limeira, SP”.`);
    municipio = r.address?.municipality;
    onde = { nome: municipio ?? o.local, centro: { lat: r.position.lat, lng: r.position.lon } };
    area = r.boundingBox
      ? {
          lat: r.position.lat,
          lon: r.position.lon,
          topLeft: `${r.boundingBox.topLeftPoint.lat},${r.boundingBox.topLeftPoint.lon}`,
          btmRight: `${r.boundingBox.btmRightPoint.lat},${r.boundingBox.btmRightPoint.lon}`,
        }
      : { lat: r.position.lat, lon: r.position.lon, radius: 8000 };
  }

  const resultados: ResultadoTomTom[] = [];
  const todos = ehTodos(o.segmento);
  // nearbySearch devolve tudo ao redor, sem precisar dizer o ramo.
  const caminho = todos ? "/search/2/nearbySearch/.json" : `/search/2/poiSearch/${encodeURIComponent(o.segmento)}.json`;
  for (let p = 0; p < (todos ? PAGINAS_TODOS : PAGINAS); p++) {
    const pagina = await chamar<{ results?: ResultadoTomTom[] }>(caminho, {
      ...comum,
      ...area,
      ofs: p * POR_PAGINA,
    });
    resultados.push(...(pagina.results ?? []));
    if ((pagina.results?.length ?? 0) < POR_PAGINA) break;
  }

  // Busca por cidade: o retângulo pega um pedaço das vizinhas; fica só quem é da cidade.
  const daCidade = (r: ResultadoTomTom) => !municipio || !r.address?.municipality || semAcento(r.address.municipality) === semAcento(municipio);
  const lugares = resultados
    .filter(daCidade)
    .map((r) => tomtomParaLugar(r, o.categoria))
    .filter((l): l is LugarAberto => !!l);
  return { lugares: [...new Map(lugares.map((l) => [l.placeId, l])).values()], onde };
}
