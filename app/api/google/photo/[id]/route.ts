import { eq } from "drizzle-orm";
import { db, ready, schema as s, one } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return new Response("Not found", { status: 404 });
  await ready();
  const foto = await db
    .select()
    .from(s.fotos)
    .where(eq(s.fotos.empresaId, Number(id)))
    .then(one);
  if (!foto) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(foto.bytes), {
    headers: { "Content-Type": foto.mime, "Cache-Control": "private, max-age=86400" },
  });
}
