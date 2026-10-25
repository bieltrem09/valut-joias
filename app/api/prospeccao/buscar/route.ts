import { NextResponse, type NextRequest } from "next/server";
import { db, ready, schema as s } from "@/lib/db";
import { buscarLugares, GoogleApiError, googleEnabled, localizarCidade, type LeadPlace } from "@/lib/google/places";
import { distanciaKm, ordenar, qualificar, type Lead } from "@/lib/prospeccao";

// Até 3 páginas do Google em sequência: dá folga além do padrão da Vercel.
export const maxDuration = 30;

type Body = {
  segmento: string;
  local: string;
  modo: "cidade" | "perto";
  centro?: { lat: number; lng: number };
  raioKm?: number;
  soNaCidade?: boolean;
};

export type Limites = { south: number; west: number; north: number; east: number };
type Onde = { nome: string; centro: { lat: number; lng: number }; limites: Limites } | null;

/** O que a tela recebe de cada estabelecimento: tudo o que o Google tem dele. */
export type LeadGoogle = Lead & {
  fotos: string[];
  horario: string[] | null;
  abertoAgora: boolean | null;
  preco: number | null;
  jaCliente: boolean;
  noFunil: string | null;
};

const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const PRECO: Record<string, number> = { PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 };

/** Busca de estabelecimentos na Places API (New), na cidade inteira ou perto de você. */
export async function POST(req: NextRequest) {
  if (!googleEnabled()) {
    return NextResponse.json({ ok: false, error: "A lista com fotos precisa da chave do Google (GOOGLE_PLACES_API_KEY)." }, { status: 503 });
  }
  const b = (await req.json()) as Body;
  const segmento = b.segmento?.trim();
  if (!segmento) return NextResponse.json({ ok: false, error: "Diga o que procurar, como “restaurante”." }, { status: 400 });
  if (b.modo === "perto" && !b.centro) return NextResponse.json({ ok: false, error: "Não recebemos sua localização." }, { status: 400 });
  if (b.modo !== "perto" && !b.local?.trim()) return NextResponse.json({ ok: false, error: "Informe a cidade." }, { status: 400 });
  const raioKm = Math.min(50, Math.max(0.5, b.raioKm ?? 5));

  try {
    let lugares: LeadPlace[];
    let onde: Onde = null;
    if (b.modo === "perto") {
      lugares = await buscarLugares({
        query: segmento,
        vies: { centro: { latitude: b.centro!.lat, longitude: b.centro!.lng }, raioM: raioKm * 1000 },
        porDistancia: true,
      });
    } else {
      const cidade = await localizarCidade(b.local.trim());
      if (!cidade) return NextResponse.json({ ok: false, error: `Não achamos “${b.local}”. Tente “Limeira, SP”.` }, { status: 404 });
      const v = cidade.viewport;
      onde = {
        nome: cidade.nome,
        centro: { lat: cidade.centro.latitude, lng: cidade.centro.longitude },
        limites: { south: v.low.latitude, west: v.low.longitude, north: v.high.latitude, east: v.high.longitude },
      };
      lugares = await buscarLugares({ query: segmento, restricao: v });
      // O retângulo da cidade pega pedaços das vizinhas: por padrão, fica só quem tem endereço nela.
      if (b.soNaCidade !== false) lugares = lugares.filter((l) => !l.formattedAddress || norm(l.formattedAddress).includes(norm(cidade.nome)));
    }

    const ref = b.centro ?? onde?.centro ?? null;
    let leads = lugares
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
        return {
          ...bruto,
          ...qualificar(bruto),
          distanciaKm: ref && bruto.lat != null && bruto.lng != null ? distanciaKm(ref, { lat: bruto.lat, lng: bruto.lng }) : null,
          fotos: (l.photos ?? []).slice(0, 4).map((f) => f.name),
          horario: l.regularOpeningHours?.weekdayDescriptions ?? null,
          abertoAgora: l.currentOpeningHours?.openNow ?? null,
          preco: l.priceLevel ? (PRECO[l.priceLevel] ?? null) : null,
        };
      });
    if (b.modo === "perto") leads = leads.filter((l) => l.distanciaKm == null || l.distanciaKm <= raioKm);
    leads = ordenar(leads, "score") as typeof leads;

    await ready();
    const [clientes, funil] = await Promise.all([
      db.select({ placeId: s.empresas.placeId }).from(s.empresas),
      db.select({ placeId: s.leads.placeId, status: s.leads.status }).from(s.leads),
    ]);
    const jaClientes = new Set(clientes.map((c) => c.placeId).filter(Boolean));
    const noFunil = new Map(funil.map((f) => [f.placeId, f.status]));

    await db.insert(s.buscas).values({
      segmento,
      local: b.modo === "perto" ? "Perto de você" : (onde?.nome ?? b.local),
      modo: b.modo === "perto" ? "perto" : "cidade",
      raioKm: b.modo === "perto" ? raioKm : null,
      total: leads.length,
      criadaEm: new Date().toISOString(),
    });

    const resposta: LeadGoogle[] = leads.map((l) => ({ ...l, jaCliente: jaClientes.has(l.placeId), noFunil: noFunil.get(l.placeId) ?? null }));
    return NextResponse.json({ ok: true, onde, leads: resposta });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e instanceof GoogleApiError ? e.motivo : "O Google não respondeu. Tente de novo em instantes." },
      { status: e instanceof GoogleApiError && e.status === 429 ? 429 : 502 },
    );
  }
}
