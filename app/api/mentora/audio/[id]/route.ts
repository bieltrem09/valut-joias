import { eq } from "drizzle-orm";
import { db, ready, schema as s, one } from "@/lib/db";

/** Gravação da sua voz. Cada regravação ganha id novo, então o cache pode ser longo. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return new Response("Not found", { status: 404 });
  await ready();
  const g = await db
    .select({ mime: s.gravacoes.mime, bytes: s.gravacoes.bytes })
    .from(s.gravacoes)
    .where(eq(s.gravacoes.id, Number(id)))
    .then(one);
  if (!g) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(g.bytes), {
    headers: { "Content-Type": g.mime, "Cache-Control": "private, max-age=31536000, immutable", "Accept-Ranges": "none" },
  });
}
