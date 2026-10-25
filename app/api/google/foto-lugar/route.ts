import { NextResponse, type NextRequest } from "next/server";
import { googleEnabled, urlFoto } from "@/lib/google/places";

/** Foto de um lugar da prospecção. Redireciona para a imagem pública do Google (a chave fica no servidor). */
export async function GET(req: NextRequest) {
  const nome = req.nextUrl.searchParams.get("n") ?? "";
  const largura = Math.min(1200, Math.max(120, Number(req.nextUrl.searchParams.get("w")) || 480));
  if (!googleEnabled() || !/^places\/[\w-]+\/photos\/[\w-]+$/.test(nome)) return new NextResponse(null, { status: 404 });
  const url = await urlFoto(nome, largura);
  if (!url) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "private, max-age=86400" } });
}
