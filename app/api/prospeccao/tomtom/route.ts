import { NextResponse, type NextRequest } from "next/server";
import { regraDoNicho } from "@/lib/osm";
import { buscarTomTom, tomtomEnabled, TomTomError } from "@/lib/tomtom";

export const maxDuration = 30;

/** Lista de estabelecimentos pelo TomTom (a chave fica só no servidor). */
export async function POST(req: NextRequest) {
  if (!tomtomEnabled()) return NextResponse.json({ ok: false, error: "Sem a chave do TomTom (TOMTOM_API_KEY)." }, { status: 503 });
  const b = (await req.json().catch(() => null)) as {
    segmento?: string;
    local?: string;
    modo?: string;
    centro?: { lat: number; lng: number };
    raioKm?: number;
  } | null;
  const segmento = b?.segmento?.trim().slice(0, 80);
  if (!segmento) return NextResponse.json({ ok: false, error: "Diga o que procurar." }, { status: 400 });
  const modo = b?.modo === "perto" && b.centro ? "perto" : "cidade";
  try {
    const r = await buscarTomTom({
      segmento,
      modo,
      local: b?.local?.trim().slice(0, 80) || "Limeira, SP",
      centro: b?.centro,
      raioKm: Math.min(30, Math.max(1, Number(b?.raioKm) || 3)),
      categoria: regraDoNicho(segmento).rotulo,
    });
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    const msg = e instanceof TomTomError ? e.message : "O TomTom não respondeu agora.";
    if (!(e instanceof TomTomError)) console.error("tomtom", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
