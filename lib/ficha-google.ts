/**
 * Ficha do Google a partir de um link colado (Maps, Perfil da Empresa, link de avaliação).
 * Sem chave paga: abre a página pública do Google Maps e lê o que ela já traz
 * (nome, endereço, categoria, nota, telefone e foto).
 */

export type FichaGoogle = {
  nome: string | null;
  endereco: string | null;
  cidade: string | null;
  categoria: string | null;
  telefone: string | null;
  rating: number | null;
  totalAvaliacoes: number | null;
  fotoUrl: string | null;
  mapsUrl: string | null;
  linkAvaliacao: string | null;
  placeId: string | null;
};

const URL_RE = /https?:\/\/[^\s<>"]+/i;
const HOST_GOOGLE = /(^|\.)(google\.[a-z.]+|goo\.gl|g\.page|g\.co|share\.google|gstatic\.com)$/i;

export const hostGoogle = (url: string) => {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && HOST_GOOGLE.test(u.hostname);
  } catch {
    return false;
  }
};

export const urlDoTexto = (texto: string) => texto.match(URL_RE)?.[0]?.replace(/[).,;]+$/, "") ?? null;

/** Link de avaliação de verdade (o que abre a janelinha de estrelas). */
export const ehLinkAvaliacao = (url: string) => /g\.page\/r\/[^/]+\/review|writereview|\/local\/writereview|lrd=/i.test(url);

const decodificar = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\\u0026/g, "&")
    .replace(/\\u003d/g, "=");

function meta(html: string, prop: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:property|itemprop|name)=["']${prop}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  const v = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return v ? decodificar(v).trim() || null : null;
}

/** "R. Boa Morte, 123 - Centro, Limeira - SP, 13480-000" → "Limeira". */
export function cidadeDoEndereco(endereco: string | null): string | null {
  if (!endereco) return null;
  const m = [...endereco.matchAll(/(?:^|,)\s*([^,\d][^,]*?)\s*-\s*[A-Z]{2}\b/g)].pop();
  return m?.[1]?.trim() || null;
}

/** Lê a página pública do Google Maps de um lugar. */
export function lerPaginaMaps(html: string): Omit<FichaGoogle, "mapsUrl" | "linkAvaliacao" | "placeId"> {
  const titulo = meta(html, "og:title") ?? html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? null;
  const [nomeBruto, ...resto] = (titulo ? decodificar(titulo) : "").split(" · ");
  const nome = nomeBruto?.replace(/\s*-\s*Google Maps\s*$/i, "").trim() || null;
  const endereco = resto.join(" · ").trim() || null;

  // "★★★★☆ · Pizzaria" ou "4,6 ★ (1.234) · Pizzaria"
  const desc = meta(html, "og:description") ?? meta(html, "description");
  let categoria: string | null = null;
  let rating: number | null = null;
  if (desc) {
    const partes = desc.split(" · ").map((p) => p.trim());
    categoria = partes.find((p) => p && !/[★☆]|^\d/.test(p)) ?? null;
    const estrelas = desc.match(/[★☆]{5}/)?.[0];
    if (estrelas) rating = [...estrelas].filter((c) => c === "★").length;
    const num = desc.match(/(\d[.,]\d)\s*(?:★|estrela)/i)?.[1];
    if (num) rating = Number(num.replace(",", "."));
  }

  const img = meta(html, "og:image");
  const fotoUrl = img && /googleusercontent\.com/i.test(img) && !/staticmap|\/maps\/api\//i.test(img) ? img.replace(/=w\d+-h\d+[^&"']*$/, "=w800-h600-k-no") : null;

  const telefone =
    html.match(/tel:\+?55\s?(\d{2})\s?(\d{4,5})-?(\d{4})/)?.slice(1).join("|").replace(/^(\d{2})\|(\d{4,5})\|(\d{4})$/, "($1) $2-$3") ??
    html.match(/\(\d{2}\)\s?\d{4,5}-\d{4}/)?.[0] ??
    null;

  // Nota e total ficam no estado da página: [null,null,null,null,null,null,null,4.6,1234] etc. Tentamos padrões simples.
  const total =
    html.match(/(\d[\d.]*)\s*(?:avaliações|avaliacoes|reviews|comentários)/i)?.[1]?.replace(/\./g, "") ?? null;
  if (rating == null) {
    const r = html.match(/\\"(\d\.\d)\\",\s*\\"?\d/)?.[1];
    if (r) rating = Number(r);
  }

  return {
    nome,
    endereco,
    cidade: cidadeDoEndereco(endereco),
    categoria,
    telefone,
    rating,
    totalAvaliacoes: total ? Number(total) : null,
    fotoUrl,
  };
}

const NAVEGADOR = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Accept: "text/html,application/xhtml+xml",
};

/** Segue os redirecionamentos do link (curto, g.page, share.google) sem sair do Google. */
async function seguir(url: string): Promise<string[]> {
  const vistos = [url];
  let atual = url;
  for (let i = 0; i < 6; i++) {
    const res = await fetch(atual, { redirect: "manual", headers: NAVEGADOR, cache: "no-store", signal: AbortSignal.timeout(6000) });
    const destino = res.headers.get("location");
    if (!destino) break;
    const proximo = new URL(destino, atual).toString();
    if (!hostGoogle(proximo)) break;
    vistos.push(proximo);
    atual = proximo;
  }
  return vistos;
}

export async function puxarFichaGoogle(texto: string, debug = false): Promise<FichaGoogle & { debug?: unknown }> {
  const url = urlDoTexto(texto);
  if (!url || !hostGoogle(url)) throw new Error("Cole um link do Google Maps ou do Perfil da Empresa no Google.");

  const caminho = await seguir(url);
  const todos = caminho.map((u) => {
    try {
      return decodeURIComponent(u);
    } catch {
      return u;
    }
  });
  const junto = todos.join(" ");
  const placeId = junto.match(/place_?id[=:]([A-Za-z0-9_-]{20,})/i)?.[1] ?? null;
  const cid = junto.match(/[?&](?:cid|ludocid)=(\d+)/)?.[1] ?? null;
  const lugar = [...caminho].reverse().find((u) => /\/maps\/place\//.test(u)) ?? null;

  const pagina = placeId
    ? `https://www.google.com/maps/place/?q=place_id:${placeId}&hl=pt-BR`
    : lugar
      ? lugar + (lugar.includes("?") ? "&" : "?") + "hl=pt-BR"
      : cid
        ? `https://maps.google.com/?cid=${cid}&hl=pt-BR`
        : caminho[caminho.length - 1];

  const res = await fetch(pagina, { headers: NAVEGADOR, cache: "no-store", signal: AbortSignal.timeout(8000) });
  const html = await res.text();
  const lido = lerPaginaMaps(html);

  // Nome do próprio link quando a página não diz.
  const nomeDoLink = lugar?.match(/\/maps\/place\/([^/@?]+)/)?.[1];
  const nome = lido.nome && !/^google maps$/i.test(lido.nome) ? lido.nome : nomeDoLink ? decodeURIComponent(nomeDoLink.replace(/\+/g, " ")) : null;

  const linkAvaliacao = ehLinkAvaliacao(url)
    ? url
    : placeId
      ? `https://search.google.com/local/writereview?placeid=${placeId}`
      : null;

  return {
    ...lido,
    nome,
    mapsUrl: lugar ?? (cid ? `https://maps.google.com/?cid=${cid}` : url),
    linkAvaliacao,
    placeId,
    ...(debug
      ? {
          debug: {
            caminho,
            pagina,
            status: res.status,
            tamanho: html.length,
            metas: html.match(/<meta[^>]*>/gi)?.slice(0, 30),
            titulo: html.match(/<title>[^<]*<\/title>/i)?.[0],
            amostrasNota: [...html.matchAll(/.{0,80}(?:avalia|reviews).{0,80}/gi)].slice(0, 8).map((m) => m[0]),
            amostrasTel: [...html.matchAll(/.{0,60}\(\d{2}\)\s?\d{4,5}-\d{4}.{0,40}/g)].slice(0, 4).map((m) => m[0]),
            amostrasNumero: [...html.matchAll(/.{0,120}\b[1-5]\.\d,\s?\d{1,6}\b.{0,40}/g)].slice(0, 6).map((m) => m[0]),
          },
        }
      : {}),
  };
}
