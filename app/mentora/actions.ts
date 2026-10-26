"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, ready, schema as s, one } from "@/lib/db";

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const MAX_BYTES = 3 * 1024 * 1024;
const ID = /^[a-z0-9-]{2,60}$/;

/** Guarda (ou troca) a gravação da sua voz para um roteiro. */
export async function salvarGravacao(fd: FormData): Promise<Result<{ id: number }>> {
  const roteiroId = String(fd.get("roteiroId") ?? "");
  const audio = fd.get("audio");
  const segundos = Number(fd.get("segundos")) || null;
  if (!ID.test(roteiroId)) return { ok: false, error: "Roteiro inválido." };
  if (!(audio instanceof File) || audio.size === 0) return { ok: false, error: "A gravação veio vazia. Tente de novo." };
  if (audio.size > MAX_BYTES) return { ok: false, error: "Gravação longa demais (máx. 3 MB, uns 3 minutos)." };
  if (!/^audio\//.test(audio.type)) return { ok: false, error: "Formato de áudio não reconhecido." };
  await ready();
  const bytes = Buffer.from(await audio.arrayBuffer());
  // Regravar troca o id: a URL muda e o navegador não toca a versão antiga do cache.
  await db.delete(s.gravacoes).where(eq(s.gravacoes.roteiroId, roteiroId));
  const nova = await db
    .insert(s.gravacoes)
    .values({ roteiroId, mime: audio.type.split(";")[0], bytes, segundos, criadaEm: new Date().toISOString() })
    .returning({ id: s.gravacoes.id })
    .then(one);
  revalidatePath("/mentora");
  return { ok: true, data: { id: nova!.id } };
}

export async function excluirGravacao(roteiroId: string): Promise<Result> {
  if (!ID.test(roteiroId)) return { ok: false, error: "Roteiro inválido." };
  await ready();
  await db.delete(s.gravacoes).where(eq(s.gravacoes.roteiroId, roteiroId));
  revalidatePath("/mentora");
  return { ok: true };
}
