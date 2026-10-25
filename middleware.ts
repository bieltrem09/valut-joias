import { NextResponse, type NextRequest } from "next/server";

/**
 * Proteção mínima sem tela de login: HTTP Basic Auth.
 * Sem PANEL_USER/PANEL_PASS no .env, deixa passar (dev).
 */
export function middleware(req: NextRequest) {
  const user = process.env.PANEL_USER;
  const pass = process.env.PANEL_PASS;
  if (!user || !pass) return NextResponse.next();

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const [u, ...rest] = atob(header.slice(6)).split(":");
      if (safeEqual(u, user) && safeEqual(rest.join(":"), pass)) return NextResponse.next();
    } catch {
      /* cabeçalho malformado: cai no 401 */
    }
  }
  return new NextResponse("Acesso restrito.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Ecloura", charset="UTF-8"' },
  });
}

/** Comparação em tempo constante para não vazar tamanho/prefixo. */
function safeEqual(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export const config = {
  // /r/* é o link público das placas; /api/cron/* tem segredo próprio (CRON_SECRET).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|r/|api/cron/).*)"],
};
