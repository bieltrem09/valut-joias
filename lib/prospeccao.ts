/**
 * Qualificação de leads para a placa de avaliação Google.
 *
 * Quem mais ganha com a placa: negócio com clientes satisfeitos (nota boa)
 * e POUCAS avaliações para o movimento que tem — a placa transforma
 * satisfação em avaliação. Telefone permite abordar; sem site, a ficha do
 * Google é a vitrine principal. Cada ponto vem com o motivo, nada é caixa-preta.
 */

export type LugarBruto = {
  placeId: string;
  nome: string;
  categoria: string | null;
  endereco: string | null;
  lat: number | null;
  lng: number | null;
  telefone: string | null;
  website: string | null;
  mapsUrl: string | null;
  rating: number | null;
  totalAvaliacoes: number | null;
  status: string | null; // OPERATIONAL | CLOSED_TEMPORARILY | CLOSED_PERMANENTLY
};

export type Motivo = { texto: string; pontos: number };
export type Prioridade = "maxima" | "alta" | "media" | "baixa";

export type Lead = LugarBruto & {
  score: number;
  prioridade: Prioridade;
  motivos: Motivo[];
  distanciaKm: number | null;
};

export function qualificar(l: LugarBruto): { score: number; prioridade: Prioridade; motivos: Motivo[] } {
  const motivos: Motivo[] = [];
  const n = l.totalAvaliacoes ?? 0;

  if (n < 50) motivos.push({ texto: n === 0 ? "Nenhuma avaliação no Google" : `Só ${n} avaliações: muito espaço para crescer`, pontos: 35 });
  else if (n < 150) motivos.push({ texto: `${n} avaliações: ainda pouco para o segmento`, pontos: 28 });
  else if (n < 400) motivos.push({ texto: `${n} avaliações: dá para acelerar`, pontos: 18 });
  else if (n < 1000) motivos.push({ texto: `${n} avaliações: já é forte`, pontos: 8 });
  else motivos.push({ texto: `${n.toLocaleString("pt-BR")} avaliações: referência no Google`, pontos: 3 });

  const r = l.rating;
  if (r == null) motivos.push({ texto: "Sem nota ainda", pontos: 10 });
  else if (r >= 4.6) motivos.push({ texto: `Nota ${fmt(r)}: clientes satisfeitos avaliam bem`, pontos: 25 });
  else if (r >= 4.2) motivos.push({ texto: `Nota ${fmt(r)}: boa base para subir`, pontos: 18 });
  else if (r >= 3.8) motivos.push({ texto: `Nota ${fmt(r)}: mais avaliações ajudam a diluir as ruins`, pontos: 12 });
  else motivos.push({ texto: `Nota ${fmt(r)}: risco de expor insatisfação`, pontos: 4 });

  if (l.telefone)
    motivos.push({ texto: celular(l.telefone) ? "Celular público: dá para chamar no WhatsApp" : "Telefone público", pontos: celular(l.telefone) ? 20 : 15 });
  else motivos.push({ texto: "Sem telefone no Google", pontos: 0 });

  if (!l.website) motivos.push({ texto: "Sem site: a ficha do Google é a vitrine", pontos: 15 });
  else motivos.push({ texto: "Tem site próprio", pontos: 6 });

  if (l.status === "CLOSED_TEMPORARILY") motivos.push({ texto: "Fechado temporariamente", pontos: -40 });

  const score = Math.max(0, Math.min(100, motivos.reduce((a, m) => a + m.pontos, 0) + 5));
  const prioridade: Prioridade = score >= 85 ? "maxima" : score >= 70 ? "alta" : score >= 50 ? "media" : "baixa";
  return { score, prioridade, motivos };
}

const fmt = (r: number) => r.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Celular no Brasil: DDD + 9 dígitos começando com 9. */
export function celular(tel: string): boolean {
  const d = tel.replace(/\D/g, "").replace(/^55/, "");
  return d.length === 11 && d[2] === "9";
}

export function whatsappUrl(tel: string, texto?: string): string | null {
  if (!celular(tel)) return null;
  const d = tel.replace(/\D/g, "").replace(/^55/, "");
  return `https://wa.me/55${d}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

/** Distância em km entre dois pontos (haversine). */
export function distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function ordenar(leads: Lead[], por: "score" | "distancia" | "avaliacoes"): Lead[] {
  return [...leads].sort((a, b) => {
    if (por === "distancia") return (a.distanciaKm ?? Infinity) - (b.distanciaKm ?? Infinity);
    if (por === "avaliacoes") return (a.totalAvaliacoes ?? 0) - (b.totalAvaliacoes ?? 0);
    return b.score - a.score || (b.rating ?? 0) - (a.rating ?? 0);
  });
}

/**
 * Pontuação sem nota/avaliações (mapa aberto, OpenStreetMap): mede só o que dá
 * para saber sem o Google — se dá para abordar e se o perfil do Google é a vitrine.
 * Quando a pessoa confere e anota a nota, vale o `qualificar` completo.
 */
export function qualificarAberto(l: LugarBruto & { instagram?: string | null; horario?: string | null }): {
  score: number;
  prioridade: Prioridade;
  motivos: Motivo[];
} {
  const motivos: Motivo[] = [];
  if (l.telefone && celular(l.telefone)) motivos.push({ texto: "Celular público: dá para chamar no WhatsApp", pontos: 35 });
  else if (l.telefone) motivos.push({ texto: "Telefone público", pontos: 22 });
  else motivos.push({ texto: "Sem telefone no mapa: procure no Google ou Instagram", pontos: 0 });

  if (!l.website) motivos.push({ texto: "Sem site: a ficha do Google é a vitrine", pontos: 30 });
  else motivos.push({ texto: "Tem site próprio", pontos: 8 });

  if (l.instagram) motivos.push({ texto: "Ativo no Instagram: liga para reputação online", pontos: 10 });
  if (l.endereco) motivos.push({ texto: "Endereço completo: dá para visitar", pontos: 10 });
  if (l.horario) motivos.push({ texto: "Horário informado: negócio em atividade", pontos: 5 });
  motivos.push({ texto: "Nota e avaliações: confira no Google para a pontuação completa", pontos: 0 });

  const score = Math.max(0, Math.min(100, motivos.reduce((a, m) => a + m.pontos, 0) + 10));
  const prioridade: Prioridade = score >= 85 ? "maxima" : score >= 70 ? "alta" : score >= 50 ? "media" : "baixa";
  return { score, prioridade, motivos };
}
