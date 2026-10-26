import { NextResponse, type NextRequest } from "next/server";
import { falaComEmocao, vozIaEnabled, VozError } from "@/lib/elevenlabs";
import type { Tom } from "@/lib/mentora";

export const maxDuration = 30;

/** Gera (ou reaproveita) a fala com a voz de IA e devolve o id do áudio. */
export async function POST(req: NextRequest) {
  if (!vozIaEnabled()) return NextResponse.json({ ok: false, error: "Sem a chave da voz de IA." }, { status: 503 });
  const b = (await req.json().catch(() => null)) as { texto?: string; tom?: string } | null;
  const tom: Tom = b?.tom === "curioso" || b?.tom === "direto" ? b.tom : "leve";
  try {
    const id = await falaComEmocao(String(b?.texto ?? ""), tom);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    if (!(e instanceof VozError)) console.error("voz-ia", e);
    return NextResponse.json({ ok: false, error: e instanceof VozError ? e.message : "A voz de IA não respondeu agora." }, { status: 502 });
  }
}
