/**
 * Para onde a placa leva quando ninguém colou um link: a avaliação no Google do
 * cliente (se ele foi cadastrado pela busca do Google) ou a página dele no Maps.
 */
export function destinoAutomatico(tipo: string, empresa: { placeId: string | null; mapsUrl: string | null } | null | undefined): string | null {
  if (!empresa) return null;
  const id = empresa.placeId?.trim();
  // Id de verdade do Google (ex.: ChIJ…); os do painel têm prefixo como "manual:" ou "osm:".
  const doGoogle = !!id && !id.includes(":") && /^[A-Za-z0-9_-]{16,}$/.test(id);
  if (tipo === "Avaliação Google" && doGoogle) return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(id!)}`;
  if (empresa.mapsUrl && /^https?:\/\//.test(empresa.mapsUrl)) return empresa.mapsUrl;
  return null;
}
