import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, ready, schema as s, one } from "@/lib/db";
import { todaySP } from "@/lib/dates";

/**
 * Trava de gasto: o Google dá uma cota grátis por mês para cada tipo de chamada
 * (cerca de 1.000 nas faixas que o painel usa). O painel conta cada chamada e
 * para um pouco antes, então a conta do Google não passa de zero.
 * Dá para mudar os limites por variável de ambiente.
 */
export type TipoUso = "buscas" | "detalhes" | "fotos";

const limite = (v: string | undefined, padrao: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : padrao;
};

export const LIMITES: Record<TipoUso, number> = {
  buscas: limite(process.env.GOOGLE_LIMITE_BUSCAS_MES, 900),
  detalhes: limite(process.env.GOOGLE_LIMITE_DETALHES_MES, 900),
  fotos: limite(process.env.GOOGLE_LIMITE_FOTOS_MES, 900),
};

const mesAtual = () => todaySP().slice(0, 7);

/** Reserva `n` chamadas do mês. Falso quando passaria do limite (aí não chama o Google). */
export async function consumir(tipo: TipoUso, n = 1): Promise<boolean> {
  await ready();
  const mes = mesAtual();
  await db.insert(s.usoGoogle).values({ mes }).onConflictDoNothing();
  const col = s.usoGoogle[tipo];
  const r = await db
    .update(s.usoGoogle)
    .set({ [tipo]: sql`${col} + ${n}` })
    .where(and(eq(s.usoGoogle.mes, mes), sql`${col} + ${n} <= ${LIMITES[tipo]}`))
    .returning({ v: col })
    .then(one);
  return !!r;
}

export async function usoDoMes() {
  await ready();
  const mes = mesAtual();
  const r = await db.select().from(s.usoGoogle).where(eq(s.usoGoogle.mes, mes)).then(one);
  return { mes, buscas: r?.buscas ?? 0, detalhes: r?.detalhes ?? 0, fotos: r?.fotos ?? 0, limites: LIMITES };
}
