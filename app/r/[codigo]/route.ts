import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, ready, schema as s, one, emSerie } from "@/lib/db";
import { todaySP } from "@/lib/dates";

/**
 * Link gravado na placa: conta o toque (ou leitura do QR) e redireciona
 * para o destino atual. Assim as leituras são reais e o destino pode
 * mudar sem regravar a placa.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const codigo = decodeURIComponent((await params).codigo).toUpperCase();
  await ready();
  const placa = await db.select().from(s.placas).where(eq(s.placas.codigo, codigo)).then(one);
  if (!placa) return new NextResponse("Placa não encontrada.", { status: 404 });
  if (placa.status !== "Ativa") {
    return new NextResponse("Esta placa está pausada no momento.", { status: 410, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  const hoje = todaySP();
  await emSerie([
    db
      .update(s.placas)
      .set({ leituras: sql`${s.placas.leituras} + 1` })
      .where(eq(s.placas.id, placa.id)),
    db
      .insert(s.leituras)
      .values({ placaId: placa.id, data: hoje, total: 1 })
      .onConflictDoUpdate({ target: [s.leituras.placaId, s.leituras.data], set: { total: sql`${s.leituras.total} + 1` } }),
  ]);

  return NextResponse.redirect(placa.destinoUrl, { status: 302, headers: { "Cache-Control": "no-store" } });
}
