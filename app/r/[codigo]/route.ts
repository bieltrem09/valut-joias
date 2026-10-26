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
  if (!placa) return aviso("Placa não encontrada", "Confira se o link está completo.", 404);
  // Ainda não entregue: leva ao destino (dá para testar a gravação) sem contar o toque.
  if (placa.status === "Pendente de envio") return destino(placa.destinoUrl);
  if (placa.status !== "Ativa") return aviso("Esta placa está pausada", "Fale com o estabelecimento para reativar.", 410);

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

  return destino(placa.destinoUrl);
}

const destino = (url: string) => NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "no-store" } });

/** Quem toca a placa é cliente do estabelecimento: uma página simples em vez de texto cru. */
function aviso(titulo: string, texto: string, status: number) {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo}</title>
<style>body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#0c0a18;color:#ece9f5;font-family:system-ui,-apple-system,sans-serif;padding:24px}
main{max-width:340px;text-align:center}h1{font-size:20px;margin:16px 0 8px}p{margin:0;color:#a59fbd;font-size:15px;line-height:1.5}
.i{width:56px;height:56px;margin:auto;border-radius:16px;background:linear-gradient(180deg,#1a1336,#5b34d6);display:grid;place-items:center;font-size:26px}</style></head>
<body><main><div class="i">⏸</div><h1>${titulo}</h1><p>${texto}</p></main></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
