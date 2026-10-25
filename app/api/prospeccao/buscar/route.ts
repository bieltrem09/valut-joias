import { NextResponse, type NextRequest } from "next/server";
import { db, ready, schema as s } from "@/lib/db";
import { buscarLugares, GoogleApiError, googleEnabled, localizarCidade, type Viewport } from "@/lib/google/places";
import { buscarAberto, localizar, OsmError, type Limites } from "@/lib/osm-server";
import { distanciaKm, ordenar, qualificar, qualificarAberto, type Lead, type LugarBruto } from "@/lib/prospeccao";
import { urlBuscaMaps } from "@/lib/maps-link";
import type { Escopo } from "@/lib/osm";

type Body = {
  segmento: string;
  local: string;
  modo: "cidade" | "perto" | "area";
  centro?: { lat: number; lng: number };
  raioKm?: number;
  area?: Limites;
  soNaCidade?: boolean;
};

type Onde = { nome: string; centro: { lat: number; lng: number }; limites: Limites } | null;
type Encontrado = LugarBruto & { instagram?: string | null; horario?: string | null };

const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Busca de leads. Com GOOGLE_PLACES_API_KEY usa a Places API (com nota e avaliações);
 * sem ela, o OpenStreetMap (grátis): mesma resposta, `fonte` diz de onde veio.
 */
export async function POST(req: NextRequest) {
  const b = (await req.json()) as Body;
  const segmento = b.segmento?.trim();
  if (!segmento) return NextResponse.json({ ok: false, error: "Diga o que procurar, como “hamburgueria”." }, { status: 400 });
  if (b.modo === "perto" && !b.centro) return NextResponse.json({ ok: false, error: "Não recebemos sua localização." }, { status: 400 });
  if (b.modo === "area" && !b.area) return NextResponse.json({ ok: false, error: "Mova o mapa até a área que quer varrer." }, { status: 400 });
  if (b.modo === "cidade" && !b.local?.trim()) return NextResponse.json({ ok: false, error: "Informe a cidade." }, { status: 400 });
  const raioKm = Math.min(50, Math.max(0.5, b.raioKm ?? 5));
  const fonte = googleEnabled() ? "google" : "osm";

  try {
    let encontrados: Encontrado[];
    let onde: Onde = null;

    if (fonte === "google") {
      if (b.modo === "perto") {
        encontrados = await buscarLugares({
          query: segmento,
          vies: { centro: { latitude: b.centro!.lat, longitude: b.centro!.lng }, raioM: raioKm * 1000 },
          porDistancia: true,
        }).then((ls) => ls.map(doGoogle));
      } else if (b.modo === "area") {
        const v: Viewport = { low: { latitude: b.area!.south, longitude: b.area!.west }, high: { latitude: b.area!.north, longitude: b.area!.east } };
        encontrados = await buscarLugares({ query: segmento, restricao: v }).then((ls) => ls.map(doGoogle));
      } else {
        const cidade = await localizarCidade(b.local.trim());
        if (!cidade) return NextResponse.json({ ok: false, error: `Não achamos “${b.local}”. Tente “Limeira, SP”.` }, { status: 404 });
        const v = cidade.viewport;
        onde = {
          nome: cidade.nome,
          centro: { lat: cidade.centro.latitude, lng: cidade.centro.longitude },
          limites: { south: v.low.latitude, west: v.low.longitude, north: v.high.latitude, east: v.high.longitude },
        };
        let ls = await buscarLugares({ query: segmento, restricao: v });
        // O retângulo da cidade pega pedaços das vizinhas: por padrão, fica só quem tem endereço nela.
        if (b.soNaCidade !== false) ls = ls.filter((l) => !l.formattedAddress || norm(l.formattedAddress).includes(norm(cidade.nome)));
        encontrados = ls.map(doGoogle);
      }
    } else {
      let escopo: Escopo;
      if (b.modo === "perto") escopo = { tipo: "raio", lat: b.centro!.lat, lng: b.centro!.lng, metros: raioKm * 1000 };
      else if (b.modo === "area") escopo = { tipo: "caixa", ...b.area! };
      else {
        const lugar = await localizar(b.local.trim());
        if (!lugar) return NextResponse.json({ ok: false, error: `Não achamos “${b.local}”. Tente “Limeira, SP”.` }, { status: 404 });
        onde = { nome: lugar.nome, centro: lugar.centro, limites: lugar.limites };
        escopo = lugar.escopo;
      }
      const cidade = onde?.nome ?? undefined;
      encontrados = (await buscarAberto(segmento, escopo, cidade)).map((l) => ({
        ...l,
        // "Ver no Google": abre a ficha pelo nome e endereço, para conferir nota e avaliações.
        mapsUrl: urlBuscaMaps({ segmento: l.nome, local: l.endereco ?? cidade ?? b.local }),
      }));
    }

    const ref = b.centro ?? onde?.centro ?? null;
    let leads: (Lead & { instagram?: string | null; horario?: string | null })[] = encontrados
      .filter((l) => l.status !== "CLOSED_PERMANENTLY")
      .map((l) => ({
        ...l,
        ...(fonte === "google" ? qualificar(l) : qualificarAberto(l)),
        distanciaKm: ref && l.lat != null && l.lng != null ? distanciaKm(ref, { lat: l.lat, lng: l.lng }) : null,
      }));
    if (b.modo === "perto") leads = leads.filter((l) => l.distanciaKm == null || l.distanciaKm <= raioKm);
    leads = ordenar(leads, "score");

    await ready();
    const [clientes, funil] = await Promise.all([
      db.select({ placeId: s.empresas.placeId }).from(s.empresas),
      db.select({ placeId: s.leads.placeId, status: s.leads.status }).from(s.leads),
    ]);
    const jaClientes = new Set(clientes.map((c) => c.placeId).filter(Boolean));
    const noFunil = new Map(funil.map((f) => [f.placeId, f.status]));

    await db.insert(s.buscas).values({
      segmento,
      local: b.modo === "cidade" ? (onde?.nome ?? b.local) : b.modo === "perto" ? "Perto de você" : "Área do mapa",
      modo: b.modo,
      raioKm: b.modo === "perto" ? raioKm : null,
      total: leads.length,
      criadaEm: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      fonte,
      onde,
      leads: leads.map((l) => ({ ...l, jaCliente: jaClientes.has(l.placeId), noFunil: noFunil.get(l.placeId) ?? null })),
    });
  } catch (e) {
    console.error(e);
    const error =
      e instanceof GoogleApiError
        ? e.motivo
        : e instanceof OsmError || fonte === "osm"
          ? "O mapa aberto está ocupado agora. Tente de novo em alguns segundos."
          : "O Google não respondeu. Tente de novo em instantes.";
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }
}

function doGoogle(l: Awaited<ReturnType<typeof buscarLugares>>[number]): Encontrado {
  return {
    placeId: l.id,
    nome: l.displayName?.text ?? "Sem nome",
    categoria: l.primaryTypeDisplayName?.text ?? null,
    endereco: l.formattedAddress ?? null,
    lat: l.location?.latitude ?? null,
    lng: l.location?.longitude ?? null,
    telefone: l.nationalPhoneNumber ?? null,
    website: l.websiteUri ?? null,
    mapsUrl: l.googleMapsUri ?? null,
    rating: l.rating ?? null,
    totalAvaliacoes: l.userRatingCount ?? null,
    status: l.businessStatus ?? null,
  };
}
