/**
 * Voz de IA com emoção (ElevenLabs), feita no servidor. O plano grátis dá
 * 10.000 caracteres por mês, sem cartão: o painel guarda cada fala gerada
 * (ouvir de novo não gasta) e para antes do limite do mês.
 */
import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, ready, schema as s, one } from "@/lib/db";
import { todaySP } from "@/lib/dates";
import { limparFala } from "@/lib/fala-expressiva";
import type { Tom } from "@/lib/mentora";

const BASE = process.env.ELEVENLABS_BASE_URL ?? "https://api.elevenlabs.io";
const MODELO = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
/** Voz pronta da biblioteca; troque por uma brasileira em ELEVENLABS_VOICE_ID. */
const VOZ = process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";
export const LIMITE_MES = Number(process.env.ELEVENLABS_LIMITE) || 9500;
const MAX_FALA = 700;

export const vozIaEnabled = () => !!process.env.ELEVENLABS_API_KEY;

/** Menos estabilidade + mais estilo = mais emoção. Cada tom do roteiro pede uma dose. */
const AJUSTE: Record<Tom, { stability: number; style: number }> = {
  leve: { stability: 0.4, style: 0.45 },
  curioso: { stability: 0.32, style: 0.55 },
  direto: { stability: 0.5, style: 0.35 },
};

export class VozError extends Error {}

const mesAtual = () => todaySP().slice(0, 7);

export async function usoVozDoMes(): Promise<{ caracteres: number; limite: number }> {
  await ready();
  const r = await db.select().from(s.usoVoz).where(eq(s.usoVoz.mes, mesAtual())).then(one);
  return { caracteres: r?.caracteres ?? 0, limite: LIMITE_MES };
}

/** Devolve o id da fala guardada (gera só se for a primeira vez). */
export async function falaComEmocao(textoBruto: string, tom: Tom): Promise<number> {
  const texto = limparFala(textoBruto).slice(0, MAX_FALA);
  if (!texto) throw new VozError("Não há o que falar.");
  const chave = createHash("sha256").update(`${MODELO}|${VOZ}|${tom}|${texto}`).digest("hex");
  await ready();
  const guardada = await db.select({ id: s.falasIa.id }).from(s.falasIa).where(eq(s.falasIa.chave, chave)).then(one);
  if (guardada) return guardada.id;

  const { caracteres } = await usoVozDoMes();
  if (caracteres + texto.length > LIMITE_MES) throw new VozError("A cota grátis de voz deste mês acabou. Até o dia 1º, o Ouvir usa a voz do aparelho.");

  const a = AJUSTE[tom];
  const res = await fetch(`${BASE}/v1/text-to-speech/${VOZ}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text: texto,
      model_id: MODELO,
      voice_settings: { stability: a.stability, similarity_boost: 0.8, style: a.style, use_speaker_boost: true },
    }),
    signal: AbortSignal.timeout(25000),
    cache: "no-store",
  });
  if (res.status === 401) throw new VozError("A chave da ElevenLabs foi recusada (confira a ELEVENLABS_API_KEY).");
  if (res.status === 429) throw new VozError("A ElevenLabs pediu uma pausa. Tente de novo em alguns segundos.");
  if (!res.ok) {
    const corpo = await res.text().catch(() => "");
    if (/quota|credits|limit/i.test(corpo)) throw new VozError("A cota grátis da ElevenLabs acabou neste mês.");
    throw new VozError(`A voz de IA não respondeu (${res.status}).`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  const mes = mesAtual();
  await db
    .insert(s.usoVoz)
    .values({ mes, caracteres: texto.length })
    .onConflictDoUpdate({ target: s.usoVoz.mes, set: { caracteres: sql`${s.usoVoz.caracteres} + ${texto.length}` } });
  const nova = await db
    .insert(s.falasIa)
    .values({ chave, mime: "audio/mpeg", bytes, caracteres: texto.length, criadaEm: new Date().toISOString() })
    .onConflictDoNothing()
    .returning({ id: s.falasIa.id })
    .then(one);
  if (nova) return nova.id;
  // Duas pessoas pediram a mesma fala ao mesmo tempo: fica a que entrou primeiro.
  return (await db.select({ id: s.falasIa.id }).from(s.falasIa).where(eq(s.falasIa.chave, chave)).then(one))!.id;
}
