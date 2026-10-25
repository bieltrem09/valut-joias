/**
 * Busca de empresas no OpenStreetMap (Overpass), grátis e sem chave.
 * Aqui fica só o que é puro (montar a consulta e ler a resposta), com testes;
 * as chamadas de rede estão em lib/osm-server.ts.
 *
 * O OSM não tem nota nem número de avaliações. Isso a pessoa confere no Google
 * com um toque, e a pontuação completa entra quando ela anota.
 */
import type { LugarBruto } from "./prospeccao";

export type LugarAberto = LugarBruto & { instagram: string | null; horario: string | null };

type Regra = { rotulo: string; tags: string[]; nome: string };

/** Nicho em português → etiquetas do OSM + pedaço de nome que costuma aparecer. */
const REGRAS: [RegExp, Regra][] = [
  [/hamburg|burger|smash/, { rotulo: "Hamburgueria", tags: ['["cuisine"~"burger",i]'], nome: "burg|smash" }],
  [/pizz/, { rotulo: "Pizzaria", tags: ['["cuisine"~"pizza",i]'], nome: "pizz" }],
  [/barb/, { rotulo: "Barbearia", tags: ['["shop"="hairdresser"]["hairdresser"~"barber",i]', '["shop"="barber"]'], nome: "barb" }],
  [/salao|cabeleir|cabelo|hair/, { rotulo: "Salão de beleza", tags: ['["shop"="hairdresser"]'], nome: "sal[aã]o|hair|cabel" }],
  [
    /estetic|beleza|sobrancelha|unha|manicure|nail|cilios/,
    { rotulo: "Estética", tags: ['["shop"="beauty"]'], nome: "est[eé]tica|beauty|unha|nail|sobrancelha|c[ií]lios" },
  ],
  [/odonto|dentist|dental/, { rotulo: "Clínica odontológica", tags: ['["amenity"="dentist"]', '["healthcare"="dentist"]'], nome: "odonto|dent" }],
  [/veterin/, { rotulo: "Veterinária", tags: ['["amenity"="veterinary"]'], nome: "vet" }],
  [/pet/, { rotulo: "Pet shop", tags: ['["shop"="pet"]', '["amenity"="veterinary"]'], nome: "pet" }],
  [
    /clinica|medic|saude|consultorio/,
    { rotulo: "Clínica", tags: ['["amenity"~"^(clinic|doctors)$"]', '["healthcare"~"^(clinic|doctor|centre)$"]'], nome: "cl[ií]nica|consult[oó]rio" },
  ],
  [
    /academia|fitness|crossfit|muscula|gym/,
    { rotulo: "Academia", tags: ['["leisure"="fitness_centre"]', '["sport"~"fitness|crossfit",i]'], nome: "academia|fit|gym|cross" },
  ],
  [/acai/, { rotulo: "Açaí", tags: ['["cuisine"~"acai",i]'], nome: "a[cç]a[ií]" }],
  [/cafe/, { rotulo: "Cafeteria", tags: ['["amenity"="cafe"]'], nome: "caf[eé]" }],
  [/padaria|panific/, { rotulo: "Padaria", tags: ['["shop"="bakery"]'], nome: "padaria|panif" }],
  [/sorvet|gelat/, { rotulo: "Sorveteria", tags: ['["amenity"="ice_cream"]', '["shop"="ice_cream"]'], nome: "sorvet|gelat" }],
  [/japon|sushi|temaki/, { rotulo: "Restaurante japonês", tags: ['["cuisine"~"japanese|sushi",i]'], nome: "sushi|japa|temaki" }],
  [/lanch|fast ?food/, { rotulo: "Lanchonete", tags: ['["amenity"="fast_food"]'], nome: "lanch" }],
  [/restaurante|comida|almoco/, { rotulo: "Restaurante", tags: ['["amenity"="restaurant"]'], nome: "restaurante" }],
  [/\bbar\b|boteco|chop/, { rotulo: "Bar", tags: ['["amenity"~"^(bar|pub)$"]'], nome: "boteco|chop" }],
  [/otica/, { rotulo: "Ótica", tags: ['["shop"="optician"]'], nome: "[oó]tica" }],
  [/flor/, { rotulo: "Floricultura", tags: ['["shop"="florist"]'], nome: "flor" }],
  [/lava.?(rapido|jato)|car ?wash/, { rotulo: "Lava-rápido", tags: ['["amenity"="car_wash"]'], nome: "lava|wash" }],
  [/oficina|mecanic|auto ?center|pneu/, { rotulo: "Oficina", tags: ['["shop"~"^(car_repair|tyres)$"]'], nome: "mec[aâ]nica|oficina|auto ?center" }],
  [/farmac|drogar/, { rotulo: "Farmácia", tags: ['["amenity"="pharmacy"]'], nome: "farm[aá]cia|drogaria" }],
  [/imobili|imove/, { rotulo: "Imobiliária", tags: ['["office"="estate_agent"]', '["shop"="estate_agent"]'], nome: "imobili|im[oó]veis" }],
  [/auto ?escola|cfc/, { rotulo: "Autoescola", tags: ['["amenity"="driving_school"]'], nome: "auto ?escola|cfc" }],
  [/roupa|moda|boutique/, { rotulo: "Loja de roupas", tags: ['["shop"~"^(clothes|boutique)$"]'], nome: "moda|boutique" }],
  [/pilates|fisio/, { rotulo: "Fisioterapia e pilates", tags: ['["healthcare"="physiotherapist"]', '["sport"="pilates"]'], nome: "pilates|fisio" }],
  [/tatu|tattoo/, { rotulo: "Estúdio de tatuagem", tags: ['["shop"="tattoo"]'], nome: "tattoo|tatu" }],
  [/mercado|mercearia|hortifruti/, { rotulo: "Mercado", tags: ['["shop"~"^(supermarket|convenience|greengrocer)$"]'], nome: "mercado|mercearia|hortifruti" }],
  [/idioma|ingles|escola de/, { rotulo: "Escola", tags: ['["amenity"="language_school"]'], nome: "idiomas|english|ingl[eê]s" }],
];

export const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Texto livre vira regex tolerante a acento: "acai" acha "Açaí". */
function regexDoTermo(t: string): string {
  const mapa: Record<string, string> = { a: "[aáàâã]", e: "[eéê]", i: "[ií]", o: "[oóôõ]", u: "[uú]", c: "[cç]" };
  return semAcento(t)
    .replace(/[^a-z0-9 ]/g, "")
    .split("")
    .map((ch) => mapa[ch] ?? ch)
    .join("");
}

export function regraDoNicho(segmento: string): Regra {
  const s = semAcento(segmento);
  const achada = REGRAS.find(([re]) => re.test(s))?.[1];
  if (achada) return achada;
  // Sem regra: procura pelo nome, entre comércios e serviços.
  const rotulo = segmento.trim().charAt(0).toUpperCase() + segmento.trim().slice(1);
  return { rotulo, tags: [], nome: regexDoTermo(segmento) };
}

export type Escopo =
  | { tipo: "area"; areaId: number }
  | { tipo: "raio"; lat: number; lng: number; metros: number }
  | { tipo: "caixa"; south: number; west: number; north: number; east: number };

/**
 * Busca por nome é cara no Overpass (regex em toda a cidade): só em comércio
 * (amenity/shop), e só como reforço das etiquetas; sem etiqueta conhecida, é o que sobra.
 */
const COMERCIO = ['["amenity"]', '["shop"]'];

export function montarConsulta(segmento: string, escopo: Escopo, limite = 120): string {
  const r = regraDoNicho(segmento);
  const onde =
    escopo.tipo === "area"
      ? "(area.alvo)"
      : escopo.tipo === "raio"
        ? `(around:${Math.round(escopo.metros)},${escopo.lat.toFixed(6)},${escopo.lng.toFixed(6)})`
        : `(${[escopo.south, escopo.west, escopo.north, escopo.east].map((n) => n.toFixed(6)).join(",")})`;
  const linhas = [...r.tags.map((t) => `nwr${t}["name"]${onde};`), ...COMERCIO.map((c) => `nwr["name"~"${r.nome}",i]${c}${onde};`)];
  return [
    "[out:json][timeout:15];",
    escopo.tipo === "area" ? `area(id:${escopo.areaId})->.alvo;` : "",
    "(",
    ...linhas.map((l) => `  ${l}`),
    ");",
    `out center tags ${limite};`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Relação do OSM → id de área do Overpass. */
export const areaDaRelacao = (osmId: number) => 3600000000 + osmId;

export type ElementoOSM = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const ROTULO_TAG: Record<string, string> = {
  restaurant: "Restaurante",
  fast_food: "Lanchonete",
  cafe: "Cafeteria",
  bar: "Bar",
  pub: "Bar",
  ice_cream: "Sorveteria",
  dentist: "Clínica odontológica",
  clinic: "Clínica",
  doctors: "Consultório",
  pharmacy: "Farmácia",
  veterinary: "Veterinária",
  hairdresser: "Salão de beleza",
  beauty: "Estética",
  bakery: "Padaria",
  pet: "Pet shop",
  fitness_centre: "Academia",
  clothes: "Loja de roupas",
  optician: "Ótica",
  florist: "Floricultura",
  car_repair: "Oficina",
  car_wash: "Lava-rápido",
  supermarket: "Mercado",
  convenience: "Mercado",
  estate_agent: "Imobiliária",
};

/** Primeiro telefone da lista, preferindo celular (vira WhatsApp). */
function telefoneDe(t: Record<string, string>): string | null {
  const todos = [t["contact:whatsapp"], t["contact:mobile"], t.mobile, t.phone, t["contact:phone"]]
    .filter(Boolean)
    .flatMap((v) => v!.split(/[;,/]/))
    .map((v) => v.trim())
    .filter((v) => v.replace(/\D/g, "").length >= 10);
  const celular = todos.find((v) => {
    const d = v.replace(/\D/g, "").replace(/^55/, "");
    return d.length === 11 && d[2] === "9";
  });
  return celular ?? todos[0] ?? null;
}

export function elementoParaLugar(el: ElementoOSM, cidadePadrao?: string): LugarAberto | null {
  const t = el.tags ?? {};
  const nome = t.name?.trim();
  const lat = el.lat ?? el.center?.lat ?? null;
  const lng = el.lon ?? el.center?.lon ?? null;
  if (!nome || lat == null || lng == null) return null;

  let website = t.website || t["contact:website"] || t.url || null;
  let instagram = t["contact:instagram"] || t.instagram || null;
  if (website && /instagram\.com/i.test(website)) {
    instagram ??= website;
    website = null;
  }
  if (instagram && !/^https?:/i.test(instagram)) instagram = `https://instagram.com/${instagram.replace(/^@/, "")}`;

  const rua = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", ");
  const bairro = t["addr:suburb"] || t["addr:neighbourhood"] || t["addr:quarter"];
  const cidade = t["addr:city"] || cidadePadrao;
  const endereco = [rua, bairro, rua || bairro ? cidade : null].filter(Boolean).join(" - ") || null;

  const tipo = t.amenity || t.shop || t.leisure || t.healthcare || t.craft || t.office;
  const cozinha = t.cuisine?.split(";")[0];
  const categoria =
    (cozinha && /burger/i.test(cozinha) && "Hamburgueria") ||
    (cozinha && /pizza/i.test(cozinha) && "Pizzaria") ||
    (cozinha && /japanese|sushi/i.test(cozinha) && "Restaurante japonês") ||
    (t.hairdresser && /barber/i.test(t.hairdresser) && "Barbearia") ||
    (tipo && ROTULO_TAG[tipo]) ||
    null;

  return {
    placeId: `osm:${el.type}/${el.id}`,
    nome,
    categoria,
    endereco,
    lat,
    lng,
    telefone: telefoneDe(t),
    website,
    mapsUrl: null,
    rating: null,
    totalAvaliacoes: null,
    // Fechado de vez no OSM some da lista; temporário vira aviso.
    status: t["disused:shop"] || t["disused:amenity"] ? "CLOSED_PERMANENTLY" : null,
    instagram,
    horario: t.opening_hours ?? null,
  };
}

/** Mesma empresa mapeada duas vezes (ponto e prédio): fica a mais completa. */
export function semRepetidos(ls: LugarAberto[]): LugarAberto[] {
  const porNome = new Map<string, LugarAberto>();
  const nota = (l: LugarAberto) => (l.telefone ? 2 : 0) + (l.endereco ? 1 : 0) + (l.website || l.instagram ? 1 : 0);
  for (const l of ls) {
    const k = `${semAcento(l.nome)}|${l.lat!.toFixed(3)}|${l.lng!.toFixed(3)}`;
    const atual = porNome.get(k);
    if (!atual || nota(l) > nota(atual)) porNome.set(k, l);
  }
  return [...porNome.values()];
}
