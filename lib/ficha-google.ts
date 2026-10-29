/**
 * Ficha do Google a partir de um link colado (Maps, Perfil da Empresa, link de avaliação).
 * Sem chave paga: faz a mesma busca que o Google Maps faz ao abrir o link e lê o resultado
 * (nome, endereço, cidade, categoria, nota, total de avaliações, telefone, site e foto).
 */

export type FichaGoogle = {
  nome: string;
  endereco: string | null;
  cidade: string | null;
  categoria: string | null;
  telefone: string | null;
  site: string | null;
  rating: number | null;
  totalAvaliacoes: number | null;
  fotoUrl: string | null;
  mapsUrl: string | null;
  linkAvaliacao: string | null;
  placeId: string | null;
};

const URL_RE = /https?:\/\/[^\s<>"]+/i;
const HOST_GOOGLE = /(^|\.)(google\.[a-z.]+|goo\.gl|g\.page|g\.co|share\.google)$/i;
const CHAVE_RE = /^0x[0-9a-f]+:0x[0-9a-f]+$/i;

export const hostGoogle = (url: string) => {
  try {
    const u = new URL(url);
    return (u.protocol === "https:" || u.protocol === "http:") && HOST_GOOGLE.test(u.hostname);
  } catch {
    return false;
  }
};

export const urlDoTexto = (texto: string) => texto.match(URL_RE)?.[0]?.replace(/[).,;]+$/, "") ?? null;

/** Link que abre direto a janelinha de dar estrelas. */
export const ehLinkAvaliacao = (url: string) => /g\.page\/r\/[^/]+\/review|writereview/i.test(url);

/** "Ribeirão Preto - SP" ou endereço completo → "Ribeirão Preto". */
export function cidadeDoEndereco(endereco: string | null): string | null {
  if (!endereco) return null;
  const m = [...endereco.matchAll(/(?:^|,)\s*([^,\d][^,]*?)\s*-\s*[A-Z]{2}\b/g)].pop();
  return m?.[1]?.trim() || null;
}

/** Tudo o que o link revela por si só: id do lugar, chave 0x…:0x…, nome e coordenadas. */
export function pistasDoLink(urls: string[]) {
  const junto = urls
    .map((u) => {
      try {
        return decodeURIComponent(u.replace(/\+/g, " "));
      } catch {
        return u;
      }
    })
    .join(" ");
  const placeId = junto.match(/place_?id[=:]\s*(ChIJ[A-Za-z0-9_-]{10,}|[A-Za-z0-9_-]{25,})/i)?.[1] ?? null;
  const chave = junto.match(/(0x[0-9a-f]{6,}:0x[0-9a-f]{6,})/i)?.[1]?.toLowerCase() ?? null;
  const cid = junto.match(/[?&](?:cid|ludocid)=(\d{5,})/)?.[1] ?? null;
  const nome = junto.match(/\/maps\/place\/([^/@?]+)/)?.[1]?.trim() ?? null;
  const ponto = junto.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ?? junto.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const q = junto.match(/[?&]q=([^&]+)/)?.[1]?.trim() ?? null;
  return { placeId, chave, cid, nome, q, lat: ponto ? Number(ponto[1]) : null, lng: ponto ? Number(ponto[2]) : null };
}

type Lugar = unknown[];

/** Acha, em qualquer profundidade da resposta, os blocos que descrevem um lugar. */
export function acharLugares(no: unknown, saida: Lugar[] = [], fundo = 0): Lugar[] {
  if (!Array.isArray(no) || fundo > 12) return saida;
  if (typeof no[11] === "string" && typeof no[10] === "string" && CHAVE_RE.test(no[10])) saida.push(no);
  for (const filho of no) acharLugares(filho, saida, fundo + 1);
  return saida;
}

const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const numero = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Converte o bloco de um lugar na ficha (só o que dá para confiar; o resto fica vazio). */
export function fichaDoLugar(p: Lugar): Omit<FichaGoogle, "linkAvaliacao" | "mapsUrl"> & { chave: string } {
  const bruto = JSON.stringify(p);
  const partes = Array.isArray(p[2]) ? (p[2] as unknown[]).filter((x): x is string => typeof x === "string") : [];
  const endereco = texto(p[39]) ?? (partes.length ? partes.join(", ") : null);
  const cidadeUf = partes.find((x) => /\s-\s[A-Z]{2}$/.test(x));
  const cidade = cidadeUf ? cidadeUf.replace(/\s-\s[A-Z]{2}$/, "").trim() : cidadeDoEndereco(endereco);
  const notas = Array.isArray(p[4]) ? (p[4] as unknown[]) : [];
  const categorias = Array.isArray(p[13]) ? (p[13] as unknown[]) : [];
  const site = Array.isArray(p[7]) ? texto((p[7] as unknown[])[0]) : null;

  const placeId = bruto.match(/placeid(?:\\u003d|=)(ChIJ[A-Za-z0-9_-]+)/)?.[1] ?? bruto.match(/"(ChIJ[A-Za-z0-9_-]{20,})"/)?.[1] ?? null;

  // Foto do lugar (não o avatar de quem avaliou, que vem em /a/ ou /a-/).
  const foto = bruto.match(/https:\/\/lh\d\.googleusercontent\.com\/(?:p|gps-cs-s|gps-proxy|grass-cs)\/[^"\\]+/)?.[0] ?? null;
  const fotoUrl = foto ? foto.replace(/=[whsk][^/]*$/, "") + "=w800-h600-k-no" : null;

  const tel = bruto.match(/\(\d{2}\)\s?\d{4,5}-\d{4}/)?.[0] ?? null;
  const tel55 = tel ? null : bruto.match(/\+55\s?(\d{2})\s?(\d{4,5})-?(\d{4})/);
  const telefone = tel ?? (tel55 ? `(${tel55[1]}) ${tel55[2]}-${tel55[3]}` : null);

  return {
    nome: String(p[11]).trim(),
    endereco,
    cidade,
    categoria: texto(categorias[0]),
    telefone,
    site,
    rating: numero(notas[7]),
    totalAvaliacoes: numero(notas[8]),
    fotoUrl,
    placeId,
    chave: String(p[10]).toLowerCase(),
  };
}

const NAVEGADOR = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

const pegar = (url: string, redirect: RequestRedirect = "follow") =>
  fetch(url, { redirect, headers: NAVEGADOR, cache: "no-store", signal: AbortSignal.timeout(8000) });

/** Segue os redirecionamentos do link (curto, g.page, share.google) sem sair do Google. */
async function seguir(url: string): Promise<string[]> {
  const vistos = [url];
  let atual = url;
  for (let i = 0; i < 6; i++) {
    const res = await pegar(atual, "manual");
    const destino = res.headers.get("location");
    if (!destino) break;
    const proximo = new URL(destino, atual).toString();
    if (!hostGoogle(proximo)) break;
    vistos.push(proximo);
    atual = proximo;
  }
  return vistos;
}

/** Faz a busca do Google Maps e devolve os lugares encontrados. */
export const rastro: unknown[] = [];
async function buscarNoMaps(consulta: string): Promise<Lugar[]> {
  const pagina = await pegar(`https://www.google.com/maps?q=${encodeURIComponent(consulta)}&hl=pt-BR&gl=br`);
  const html = await pagina.text();
  const href = html.match(/href="(\/search\?tbm=map[^"]+)"/)?.[1];
  rastro.push({ consulta, final: pagina.url, status: pagina.status, links: [...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map((m) => m[1].slice(0, 300)).slice(0, 12) });
  if (!href) return [];
  const res = await pegar("https://www.google.com" + href.replace(/&amp;/g, "&"));
  const corpo = (await res.text()).replace(/^\)\]\}'\s*/, "");
  try {
    return acharLugares(JSON.parse(corpo));
  } catch {
    return [];
  }
}

export async function puxarFichaGoogle(entrada: string): Promise<FichaGoogle> {
  const url = urlDoTexto(entrada);
  if (!url || !hostGoogle(url)) throw new ErroFicha("Cole um link do Google Maps ou do Perfil da Empresa no Google.");

  const caminho = await seguir(url);
  const pista = pistasDoLink(caminho);

  // Do mais certeiro para o mais solto.
  const consultas = [
    pista.placeId && `place_id:${pista.placeId}`,
    pista.cid && pista.nome && `${pista.nome}`,
    pista.nome && pista.lat != null ? `${pista.nome} @${pista.lat},${pista.lng}` : pista.nome,
    pista.q,
    pista.lat != null && `${pista.lat},${pista.lng}`,
  ].filter((c): c is string => !!c);

  let escolhido: ReturnType<typeof fichaDoLugar> | null = null;
  for (const c of [...new Set(consultas)]) {
    const lugares = (await buscarNoMaps(c)).map(fichaDoLugar);
    if (!lugares.length) continue;
    escolhido =
      lugares.find((l) => (pista.chave && l.chave === pista.chave) || (pista.placeId && l.placeId === pista.placeId)) ??
      (pista.chave || pista.placeId ? null : lugares[0]) ??
      lugares[0];
    if (escolhido) break;
  }
  if (!escolhido) throw new ErroFicha("Não achei esse estabelecimento no Google. Abra o lugar no Google Maps, toque em Compartilhar e cole o link.");

  const placeId = escolhido.placeId ?? pista.placeId;
  return {
    nome: escolhido.nome,
    endereco: escolhido.endereco,
    cidade: escolhido.cidade,
    categoria: escolhido.categoria,
    telefone: escolhido.telefone,
    site: escolhido.site,
    rating: escolhido.rating,
    totalAvaliacoes: escolhido.totalAvaliacoes,
    fotoUrl: escolhido.fotoUrl,
    placeId,
    mapsUrl: placeId
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(escolhido.nome)}&query_place_id=${placeId}`
      : `https://www.google.com/maps/place/data=!4m2!3m1!1s${escolhido.chave}`,
    linkAvaliacao: ehLinkAvaliacao(url) ? url : placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : null,
  };
}

export class ErroFicha extends Error {}
