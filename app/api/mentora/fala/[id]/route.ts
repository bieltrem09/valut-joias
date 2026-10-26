import { eq } from "drizzle-orm";
import { db, ready, schema as s, one } from "@/lib/db";

/** Áudio gerado pela voz de IA. O id muda quando o texto muda, então o cache pode ser longo. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return new Response("Not found", { status: 404 });
  await ready();
  const f = await db
    .select({ mime: s.falasIa.mime, bytes: s.falasIa.bytes })
    .from(s.falasIa)
    .where(eq(s.falasIa.id, Number(id)))
    .then(one);
  if (!f) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(f.bytes), { headers: { "Content-Type": f.mime, "Cache-Control": "private, max-age=31536000, immutable" } });
}
