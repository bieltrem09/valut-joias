import { NextResponse, type NextRequest } from "next/server";
import { db, ready, schema as s } from "@/lib/db";
import { buscarLugares, GoogleApiError, googleEnabled, localizarCidade, type Viewport } from "@/lib/google/places";
import { distanciaKm, ordenar, qualificar, type Lead } from "@/lib/prospeccao";

type Body = {
  segmento: string;
  local: string;
  modo: "cidade" | "perto" | "area";
  centro?: { lat: number; lng: number };
  raioKm?: number;
  area?: { south: number; west: number; north: number; east: number };
  soNaCidade?: boolean;
};

const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export async function POST(req: NextRequest) {
  if (!googleEnabled()) {
    return NextResponse.json({ ok: false, error: "Configure GOOGLE_PLACES_API_KEY para buscar empresas reais." }, { status: 503 });
  }
  const b = (await req.json()) as Body;
  const segmento = b.segmento?.trim();
  if (!segmento) return NextResponse.json({ ok: false, error: "Diga o que procurar, como “hamburgueria”." }, { status: 400 });

  try {
    let lugares;
    let cidade: Awaited<ReturnType<typeof localizarCidade>> = null;
    const centroRef = b.centro ?? null;

    if (b.modo === "perto") {
      if (!b.centro) return NextResponse.json({ ok: false, error: "Não recebemos sua localização." }, { status: 400 });
      const raioKm = Math.min(50, Math.max(0.5, b.raioKm ?? 5));
      lugares = await buscarLugares({
        query: segmento,
        vies: { centro: { latitude: b.centro.lat, longitude: b.centro.lng }, raioM: raioKm * 1000 },
        porDistancia: true,
      });
    } else if (b.modo === "area") {
      if (!b.area) return NextResponse.json({ ok: false, error: "Mova o mapa até a área que quer varrer." }, { status: 400 });
      const v: Viewport = { low: { latitude: b.area.south, longitude: b.area.west }, high: { latitude: b.area.north, longitude: b.area.east } };
      lugares = await buscarLugares({ query: segmento, restricao: v });
    } else {
      const local = b.local?.trim();
      if (!local) return NextResponse.json({ ok: false, error: "Informe a cidade." }, { status: 400 });
      cidade = await localizarCidade(local);
      if (!cidade) return NextResponse.json({ ok: false, error: `Não achamos a cidade “${local}”. Tente “Limeira, SP”.` }, { status: 404 });
      lugares = await buscarLugares({ query: segmento, restricao: cidade.viewport });
      // O retângulo da cidade pega pedaços das vizinhas: por padrão, fica só quem tem endereço nela.
      if (b.soNaCidade !== false) {
        const nomeCidade = norm(cidade.nome);
        lugares = lugares.filter((l) => !l.formattedAddress || norm(l.formattedAddress).includes(nomeCidade));
      }
    }

    let leads: Lead[] = lugares
      .filter((l) => l.businessStatus !== "CLOSED_PERMANENTLY")
      .map((l) => {
        const bruto = {
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
        const ref = centroRef ?? (cidade ? { lat: cidade.centro.latitude, lng: cidade.centro.longitude } : null);
        return {
          ...bruto,
          ...qualificar(bruto),
          distanciaKm: ref && bruto.lat != null && bruto.lng != null ? distanciaKm(ref, { lat: bruto.lat, lng: bruto.lng }) : null,
        };
      });

    if (b.modo === "perto") leads = leads.filter((l) => l.distanciaKm == null || l.distanciaKm <= (b.raioKm ?? 5));
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
      local: b.modo === "cidade" ? (cidade?.nome ?? b.local) : b.modo === "perto" ? "Perto de você" : "Área do mapa",
      modo: b.modo,
      raioKm: b.modo === "perto" ? (b.raioKm ?? 5) : null,
      total: leads.length,
      criadaEm: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      cidade: cidade ? { nome: cidade.nome, centro: { lat: cidade.centro.latitude, lng: cidade.centro.longitude }, viewport: cidade.viewport } : null,
      leads: leads.map((l) => ({ ...l, jaCliente: jaClientes.has(l.placeId), noFunil: noFunil.get(l.placeId) ?? null })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e instanceof GoogleApiError ? e.motivo : "O Google não respondeu. Tente de novo em instantes." },
      { status: 502 },
    );
  }
}
