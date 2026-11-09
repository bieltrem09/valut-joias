import { NextResponse, type NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db, ready } from "@/lib/db";
import { refreshStale } from "@/lib/google/places";

/**
 * Medição diária das avaliações (Vercel Cron, ver vercel.json).
 * Também mantém o banco acordado: o Supabase grátis pausa o projeto após 7 dias sem uso.
 * Com CRON_SECRET definido, a Vercel manda "Authorization: Bearer <segredo>" e só ela passa.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  await ready();
  await db.execute(sql`select 1`);
  const r = await refreshStale();
  return NextResponse.json({ ok: true, ...r });
}
