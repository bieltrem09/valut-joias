import fs from "node:fs/promises";
import path from "node:path";
import { PHOTO_DIR } from "@/lib/google/places";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return new Response("Not found", { status: 404 });
  try {
    const buf = await fs.readFile(path.join(PHOTO_DIR, `${id}.jpg`));
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=86400" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
