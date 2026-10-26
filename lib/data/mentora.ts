import { db, ready, schema as s } from "@/lib/db";

export type GravacaoInfo = { id: number; segundos: number | null };

/** Quais roteiros já têm a sua voz gravada (sem trazer o áudio). */
export async function listGravacoes(): Promise<Record<string, GravacaoInfo>> {
  await ready();
  const rows = await db.select({ id: s.gravacoes.id, roteiroId: s.gravacoes.roteiroId, segundos: s.gravacoes.segundos }).from(s.gravacoes);
  return Object.fromEntries(rows.map((r) => [r.roteiroId, { id: r.id, segundos: r.segundos }]));
}
