/**
 * Erros que acontecem no navegador (que o celular não mostra) chegam aqui e vão
 * para os registros da Vercel. Só texto curto, sem dados pessoais.
 */
export async function POST(req: Request) {
  const corpo = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!corpo) return new Response(null, { status: 204 });
  const curto = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : undefined);
  console.error(
    "[erro-cliente]",
    JSON.stringify({
      pagina: curto(corpo.pagina, 200),
      mensagem: curto(corpo.mensagem, 500),
      pilha: curto(corpo.pilha, 1500),
      digest: curto(corpo.digest, 40),
      navegador: curto(req.headers.get("user-agent"), 200),
    }),
  );
  return new Response(null, { status: 204 });
}
