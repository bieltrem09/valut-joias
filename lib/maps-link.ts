/**
 * Prospecção guiada: o dono busca no Google Maps comum (grátis) e cola aqui o
 * que o botão "Compartilhar" do Maps gera. Nada de API paga.
 *
 * O "Compartilhar" do celular costuma colar algo como:
 *   "Smash Burger Limeira\nR. Boa Morte, 123 - Centro, Limeira - SP\nhttps://maps.app.goo.gl/AbC123"
 * No computador, o link da barra de endereço traz nome e coordenadas:
 *   https://www.google.com/maps/place/Smash+Burger/@-22.56,-47.40,17z/data=!…!1s0x94c8…:0x5b0…!…!3d-22.5642!4d-47.4045
 */

export type LinkMaps = {
  url: string | null;
  nome: string | null;
  endereco: string | null;
  lat: number | null;
  lng: number | null;
  /** Identificador estável do lugar no Google (o "0x…:0x…" do link completo). */
  chave: string | null;
  /** Link curto (maps.app.goo.gl): o servidor pode abrir para achar nome e coordenadas. */
  curto: boolean;
};

const URL_RE = /https?:\/\/[^\s<>"]+/i;
const HOSTS = /^(?:www\.)?(?:google\.[a-z.]+|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl|g\.co)$/i;

export function hostDoMaps(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && HOSTS.test(u.hostname) && (u.hostname.endsWith("goo.gl") || u.hostname === "g.co" || u.pathname.startsWith("/maps"));
  } catch {
    return false;
  }
}

export function lerLinkMaps(texto: string): LinkMaps {
  const bruto = texto.trim();
  const url = bruto.match(URL_RE)?.[0]?.replace(/[).,;]+$/, "") ?? null;
  const valida = url && hostDoMaps(url) ? url : null;

  // Linhas de texto antes do link: nome e, às vezes, endereço.
  const linhas = bruto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !URL_RE.test(l));
  let nome: string | null = linhas[0] ?? null;
  let endereco: string | null = linhas[1] ?? null;

  let lat: number | null = null;
  let lng: number | null = null;
  let chave: string | null = null;

  if (valida) {
    let u = valida.replace(/\+/g, " ");
    try {
      u = decodeURIComponent(u);
    } catch {}
    nome ??= u.match(/\/maps\/place\/([^/@?]+)/)?.[1]?.trim() || null;
    if (!nome) {
      try {
        nome = new URL(valida).searchParams.get("q")?.split(",")[0]?.trim() || null;
      } catch {}
    }
    chave = u.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i)?.[1]?.toLowerCase() ?? null;
    // !3d!4d é o ponto do lugar; @lat,lng é o centro da tela (serve de reserva).
    const ponto = u.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ?? u.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (ponto) {
      lat = Number(ponto[1]);
      lng = Number(ponto[2]);
    }
  }
  if (nome && nome.length > 120) nome = nome.slice(0, 120);
  if (endereco && endereco.length > 200) endereco = endereco.slice(0, 200);
  // Endereço só se parecer endereço (tem número ou vírgula), não uma frase qualquer.
  if (endereco && !/\d|,/.test(endereco)) endereco = null;

  return { url: valida, nome, endereco, lat, lng, chave, curto: !!valida && /goo\.gl|g\.co/i.test(new URL(valida).hostname) };
}

/** Busca no Google Maps comum. Com coordenadas, abre centrado em você. */
export function urlBuscaMaps(o: { segmento: string; local?: string; perto?: { lat: number; lng: number } }): string {
  const q = o.segmento.trim();
  if (o.perto) return `https://www.google.com/maps/search/${encodeURIComponent(q)}/@${o.perto.lat.toFixed(5)},${o.perto.lng.toFixed(5)},15z`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([q, o.local?.trim()].filter(Boolean).join(" em "))}`;
}

/** Chave do lead no funil: a do Google quando o link traz, senão o nome normalizado. */
export function chaveLead(l: { chave: string | null; nome: string; endereco?: string | null }): string {
  if (l.chave) return `maps:${l.chave}`;
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `manual:${norm(l.nome)}${l.endereco ? `:${norm(l.endereco).slice(0, 40)}` : ""}`;
}

export const leadManual = (placeId: string) => placeId.startsWith("manual:") || placeId.startsWith("maps:");

/** Raio da busca "perto de mim" → zoom do mapa (quanto menor o raio, mais perto). */
export const zoomDoRaio = (km: number) => (km <= 1 ? 16 : km <= 3 ? 15 : km <= 5 ? 14 : km <= 10 ? 13 : 12);

/**
 * Mapa do Google embutido no painel, sem chave e sem custo (o embed público do Maps).
 * Mostra os pinos da busca; tocando num pino aparece a ficha com nota e avaliações.
 */
export function urlEmbedMaps(o: { segmento?: string; local?: string; perto?: { lat: number; lng: number }; raioKm?: number }): string {
  const q = o.segmento?.trim() ?? "";
  const p = new URLSearchParams({ hl: "pt-BR", output: "embed" });
  if (o.perto) {
    const ll = `${o.perto.lat.toFixed(5)},${o.perto.lng.toFixed(5)}`;
    p.set("q", q ? `${q} near ${ll}` : ll);
    p.set("ll", ll);
    p.set("z", String(zoomDoRaio(o.raioKm ?? 3)));
  } else {
    p.set("q", [q, o.local?.trim()].filter(Boolean).join(" em ") || "Limeira, SP");
    p.set("z", q ? "14" : "13");
  }
  return `https://maps.google.com/maps?${p.toString()}`;
}
