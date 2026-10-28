/**
 * Busca de empresas no OpenStreetMap (Overpass), grátis e sem chave.
 * Aqui fica só o que é puro (montar a consulta e ler a resposta), com testes;
 * as chamadas de rede estão em lib/osm-server.ts.
 *
 * O OSM não tem nota nem número de avaliações. Isso a pessoa confere no Google
 * com um toque, e a pontuação completa entra quando ela anota.
 */
import type { LugarBruto } from "./prospeccao";

export type LugarAberto = LugarBruto & { instagram: string | null; horario: string | null; fotoUrl: string | null };

type Regra = { rotulo: string; tags: string[]; nome: string };

/** Nicho em português → etiquetas do OSM + pedaço de nome que costuma aparecer. */
const REGRAS: [RegExp, Regra][] = [
  // Mais específicos primeiro: "estética automotiva" não pode cair em "estética", nem "salão de festa" em "salão".
  [
    /estetica automotiva|automotiv|polimento|vitrific|martelinho|insulfilm|envelopament|detail/,
    {
      rotulo: "Estética automotiva",
      tags: [
        '["shop"="car_repair"]["name"~"est[eé]tica|polim|vitrific|detail|insulfilm|envelop|martelinho",i]',
        '["amenity"="car_wash"]["name"~"est[eé]tica|detail|polim",i]',
      ],
      nome: "est[eé]tica automotiva|polimento|vitrific|detailing|insulfilm|martelinho",
    },
  ],
  [/autope|auto pe|pecas/, { rotulo: "Autopeças", tags: ['["shop"="car_parts"]'], nome: "autope[cç]as|auto pe[cç]as|pe[cç]as" }],
  [/borrachar|pneu/, { rotulo: "Borracharia e pneus", tags: ['["shop"="tyres"]'], nome: "borrachar|pneu" }],
  [
    /funilar|lanternag|pintura automotiva/,
    { rotulo: "Funilaria", tags: ['["shop"="car_repair"]["name"~"funilar|lanterna|pintura",i]'], nome: "funilaria|lanternagem" },
  ],
  [/auto ?eletric|eletrica automotiva/, { rotulo: "Auto elétrica", tags: ['["shop"="car_repair"]["name"~"el[eé]tric",i]'], nome: "auto ?el[eé]trica" }],
  [/\bmoto/, { rotulo: "Moto peças e oficina", tags: ['["shop"="motorcycle"]', '["shop"="motorcycle_repair"]'], nome: "moto" }],
  [
    /buffet|salao de festa|eventos|festa/,
    { rotulo: "Buffet e eventos", tags: ['["amenity"="events_venue"]', '["shop"="party"]'], nome: "buffet|festa|evento" },
  ],
  [/banho e tosa|tosa|groom/, { rotulo: "Banho e tosa", tags: ['["shop"="pet_grooming"]'], nome: "tosa|groom|banho" }],
  [
    /manicure|unha|nail|esmalteria/,
    {
      rotulo: "Esmalteria",
      tags: ['["shop"="beauty"]["beauty"~"nails",i]', '["shop"="beauty"]["name"~"unha|nail|esmalt",i]'],
      nome: "unha|nail|esmalt|manicure",
    },
  ],
  [
    /sobrancelha|cilios|lash|design de sobr/,
    { rotulo: "Sobrancelha e cílios", tags: ['["shop"="beauty"]["name"~"sobrancel|c[ií]lios|lash|brow",i]'], nome: "sobrancel|c[ií]lios|lash|brow" },
  ],
  [/depila/, { rotulo: "Depilação", tags: ['["shop"="beauty"]["name"~"depila|laser",i]'], nome: "depila" }],
  [/\bspa\b|massag/, { rotulo: "Spa e massagem", tags: ['["shop"="massage"]', '["leisure"="spa"]', '["amenity"="spa"]'], nome: "spa|massag" }],
  [
    /doceria|confeitaria|doces|bolo|brigadeir/,
    { rotulo: "Doceria e confeitaria", tags: ['["shop"="confectionery"]', '["shop"="pastry"]'], nome: "doce|confeitar|bolo|brigadeir" },
  ],
  [/churras|espeto|steak/, { rotulo: "Churrascaria", tags: ['["cuisine"~"barbecue|steak_house",i]'], nome: "churrasc|espeto|grill" }],
  [
    /marmit|self.?service|por quilo|quilo/,
    { rotulo: "Restaurante por quilo", tags: ['["amenity"="restaurant"]["name"~"marmit|quilo|kilo|self",i]'], nome: "marmit|quilo|kilo|self" },
  ],
  [/pastel/, { rotulo: "Pastelaria", tags: ['["cuisine"~"pastel",i]'], nome: "pastel" }],
  [/esfiha|esfirra|arabe/, { rotulo: "Comida árabe", tags: ['["cuisine"~"lebanese|arab",i]'], nome: "esf[ih]+a|[aá]rabe|kebab" }],
  [
    /adega|distribuidora|bebida|conveniencia/,
    { rotulo: "Adega e conveniência", tags: ['["shop"~"^(alcohol|beverages)$"]'], nome: "adega|distribuidora|bebidas|conveni" },
  ],
  [/cachorro.?quente|hot.?dog|dogueria/, { rotulo: "Hot dog", tags: ['["cuisine"~"hot_dog",i]'], nome: "dog|cachorr" }],
  [/nutri/, { rotulo: "Nutricionista", tags: ['["healthcare"="dietitian"]'], nome: "nutri" }],
  [/psicolog/, { rotulo: "Psicologia", tags: ['["healthcare"="psychotherapist"]'], nome: "psic" }],
  [/laborator|exames/, { rotulo: "Laboratório", tags: ['["healthcare"="laboratory"]'], nome: "laborat" }],
  [/calcad|sapat|tenis/, { rotulo: "Calçados", tags: ['["shop"="shoes"]'], nome: "cal[cç]ad|sapat" }],
  [/joia|joalher|relojo|semijoia|bijou/, { rotulo: "Joias e semijoias", tags: ['["shop"~"^(jewelry|watches)$"]'], nome: "j[oó]ia|joalh|relojo|semij|bijou" }],
  [/presente|variedade|utilidade/, { rotulo: "Presentes e variedades", tags: ['["shop"~"^(gift|variety_store)$"]'], nome: "presente|variedade|utilidade" }],
  [
    /celular|assistencia tecnica|eletronic/,
    {
      rotulo: "Celulares e assistência",
      tags: ['["shop"="mobile_phone"]', '["craft"="electronics_repair"]', '["shop"="electronics"]'],
      nome: "celular|cell|assist[eê]ncia|eletr[oô]nic",
    },
  ],
  [/informatica|computador/, { rotulo: "Informática", tags: ['["shop"="computer"]'], nome: "inform[aá]tica|computa" }],
  [
    /material de construcao|construcao|ferragem|ferramenta/,
    { rotulo: "Material de construção", tags: ['["shop"~"^(hardware|doityourself|building_materials)$"]'], nome: "constru|ferrag|materiai" },
  ],
  [
    /movel|moveis|decorac|colchao/,
    { rotulo: "Móveis e decoração", tags: ['["shop"~"^(furniture|interior_decoration|bed)$"]'], nome: "m[oó]veis|decora|colch" },
  ],
  [/papelaria|livraria/, { rotulo: "Papelaria e livraria", tags: ['["shop"~"^(stationery|books)$"]'], nome: "papelar|livrar" }],
  [/cosmetic|perfum/, { rotulo: "Cosméticos e perfumaria", tags: ['["shop"~"^(cosmetics|perfumery)$"]'], nome: "cosm[eé]t|perfum" }],
  [/acougue|casa de carne/, { rotulo: "Açougue", tags: ['["shop"="butcher"]'], nome: "a[cç]ougue|carnes" }],
  [/brinquedo|infantil|bebe/, { rotulo: "Loja infantil", tags: ['["shop"~"^(toys|baby_goods)$"]'], nome: "brinqued|infantil|beb[eê]|kids" }],
  [/esporte|suplemento/, { rotulo: "Esportes e suplementos", tags: ['["shop"~"^(sports|nutrition_supplements)$"]'], nome: "esporte|suplement|sport" }],
  [/lavanderia/, { rotulo: "Lavanderia", tags: ['["shop"~"^(laundry|dry_cleaning)$"]'], nome: "lavander" }],
  [/chaveiro/, { rotulo: "Chaveiro", tags: ['["shop"="locksmith"]', '["craft"="key_cutter"]'], nome: "chaveir" }],
  [/grafica|copiadora|impressao/, { rotulo: "Gráfica", tags: ['["shop"="copyshop"]', '["craft"="printer"]'], nome: "gr[aá]fica|copiad|impress" }],
  [/fotograf|estudio de foto/, { rotulo: "Estúdio de fotografia", tags: ['["shop"="photo"]', '["craft"="photographer"]'], nome: "foto" }],
  [/hotel|pousada|motel/, { rotulo: "Hotel e pousada", tags: ['["tourism"~"^(hotel|guest_house|motel|hostel)$"]'], nome: "hotel|pousada" }],
  [/hamburg|burger|smash/, { rotulo: "Hamburgueria", tags: ['["cuisine"~"burger",i]'], nome: "burg|smash" }],
  [/pizz/, { rotulo: "Pizzaria", tags: ['["cuisine"~"pizza",i]'], nome: "pizz" }],
  [/barb/, { rotulo: "Barbearia", tags: ['["shop"="hairdresser"]["hairdresser"~"barber",i]', '["shop"="barber"]'], nome: "barb" }],
  [
    /salao|cabeleir|cabelo|hair/,
    // "Salão de beleza" no Google junta cabeleireiro e estética; no OSM são etiquetas diferentes.
    { rotulo: "Salão de beleza", tags: ['["shop"="hairdresser"]', '["shop"="beauty"]'], nome: "sal[aã]o|hair|cabel|beauty|beleza" },
  ],
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

/** Busca "tudo perto de mim": qualquer estabelecimento com nome, de qualquer ramo. */
export const TODOS = "todos os estabelecimentos";
export const ehTodos = (segmento: string) => semAcento(segmento) === TODOS;

/** Etiquetas de quem atende público (fica de fora banco de praça, ponto de ônibus, estacionamento…). */
const TAGS_TODOS = [
  '["shop"]',
  '["amenity"~"^(restaurant|fast_food|cafe|bar|pub|ice_cream|food_court|biergarten|dentist|clinic|doctors|pharmacy|veterinary|car_wash|car_rental|driving_school|language_school|school|kindergarten|college|bank|fuel|marketplace|nightclub|cinema|theatre|events_venue|coworking_space)$"]',
  '["office"]',
  '["craft"]',
  '["healthcare"]',
  '["leisure"~"^(fitness_centre|sports_centre|dance|swimming_pool)$"]',
  '["tourism"~"^(hotel|motel|guest_house|hostel)$"]',
];

export function regraDoNicho(segmento: string): Regra {
  const s = semAcento(segmento);
  if (ehTodos(segmento)) return { rotulo: "Estabelecimento", tags: TAGS_TODOS, nome: "" };
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
  const nomes = r.nome ? COMERCIO.map((c) => `nwr["name"~"${r.nome}",i]${c}${onde};`) : [];
  const linhas = [...r.tags.map((t) => `nwr${t}["name"]${onde};`), ...nomes];
  const todos = ehTodos(segmento);
  return [
    `[out:json][timeout:${todos ? 25 : 15}];`,
    escopo.tipo === "area" ? `area(id:${escopo.areaId})->.alvo;` : "",
    "(",
    ...linhas.map((l) => `  ${l}`),
    ");",
    `out center tags ${todos ? Math.max(limite, escopo.tipo === "area" ? 1500 : 800) : limite};`,
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
  hotel: "Hotel",
  motel: "Motel",
  guest_house: "Pousada",
  pharmacy_shop: "Farmácia",
  hardware: "Loja de materiais",
  doityourself: "Loja de materiais",
  mobile_phone: "Loja de celular",
  electronics: "Eletrônicos",
  furniture: "Móveis",
  shoes: "Calçados",
  jewelry: "Joalheria",
  cosmetics: "Cosméticos",
  butcher: "Açougue",
  greengrocer: "Hortifrúti",
  kiosk: "Banca",
  books: "Livraria",
  stationery: "Papelaria",
  gift: "Presentes",
  tyres: "Pneus",
  car: "Concessionária",
  car_parts: "Autopeças",
  laundry: "Lavanderia",
  dry_cleaning: "Lavanderia",
  tattoo: "Estúdio de tatuagem",
  massage: "Massagem",
  variety_store: "Variedades",
  department_store: "Loja de departamento",
  fuel: "Posto de combustível",
  bank: "Banco",
  school: "Escola",
  kindergarten: "Escola infantil",
  language_school: "Escola de idiomas",
  driving_school: "Autoescola",
  physiotherapist: "Fisioterapia",
  sports_centre: "Centro esportivo",
  lawyer: "Advocacia",
  accountant: "Contabilidade",
  insurance: "Seguros",
  company: "Empresa",
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

  const tipo = t.amenity || t.shop || t.leisure || t.healthcare || t.craft || t.office || t.tourism;
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
    fotoUrl: fotoDe(t),
  };
}

/** Foto que alguém marcou no OSM: link direto de imagem ou arquivo do Wikimedia Commons. */
export function fotoDe(t: Record<string, string>): string | null {
  const img = t.image?.trim();
  if (img && /^https:\/\/.+\.(jpe?g|png|webp)(\?.*)?$/i.test(img)) return img;
  const commons = (t.wikimedia_commons ?? (img?.startsWith("File:") ? img : ""))?.trim();
  if (commons?.startsWith("File:")) return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(commons.slice(5))}?width=480`;
  return null;
}

/** Palavra em inglês que o Nominatim entende no campo `amenity` (reserva quando o Overpass falha). */
export function tipoNominatim(segmento: string): string {
  const r = regraDoNicho(segmento);
  const m = r.tags[0]?.match(/"(?:amenity|shop|leisure|healthcare|office)"[=~]"\^?\(?([a-z_]+)/) ?? r.tags[0]?.match(/~"([a-z_]+)/);
  return m?.[1]?.replace(/_/g, " ") ?? segmento.trim();
}

export type ResultadoNominatim = {
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  type?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
};

/** Item do Nominatim (com extratags) no mesmo formato do Overpass. */
export function nominatimParaLugar(r: ResultadoNominatim, cidadePadrao?: string): LugarAberto | null {
  const a = r.address ?? {};
  const tags: Record<string, string> = {
    ...(r.extratags ?? {}),
    name: r.name || r.display_name.split(",")[0],
    ...(a.road ? { "addr:street": a.road } : {}),
    ...(a.house_number ? { "addr:housenumber": a.house_number } : {}),
    ...((a.suburb ?? a.neighbourhood) ? { "addr:suburb": (a.suburb ?? a.neighbourhood)! } : {}),
    ...((a.city ?? a.town) ? { "addr:city": (a.city ?? a.town)! } : {}),
    ...(r.type ? { amenity: r.type } : {}),
  };
  const tipo = r.osm_type === "node" || r.osm_type === "way" || r.osm_type === "relation" ? r.osm_type : "node";
  return elementoParaLugar({ type: tipo, id: r.osm_id, lat: Number(r.lat), lon: Number(r.lon), tags }, cidadePadrao);
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

/** Mesma empresa nas duas fontes: nome igual e a menos de ~300 m. */
export function juntarFontes(principal: LugarAberto[], extra: LugarAberto[]): LugarAberto[] {
  const perto = (a: LugarAberto, b: LugarAberto) => a.lat != null && b.lat != null && Math.abs(a.lat - b.lat) < 0.003 && Math.abs(a.lng! - b.lng!) < 0.003;
  const nome = (l: LugarAberto) => semAcento(l.nome).replace(/[^a-z0-9]/g, "");
  const novos = extra.filter((e) => !principal.some((p) => nome(p) === nome(e) && perto(p, e)));
  return [...principal, ...novos];
}
