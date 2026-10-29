import { puxarFichaGoogle } from "@/lib/ficha-google";

/** Lê o link do Google colado no cadastro do cliente e devolve a ficha para preencher o formulário. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const link = sp.get("link") ?? "";
  try {
    return Response.json(await puxarFichaGoogle(link, sp.get("debug") === "1"));
  } catch (e) {
    console.error("ficha google", e);
    const msg = e instanceof Error && /Cole um link/.test(e.message) ? e.message : "Não deu para ler esse link agora. Confira o link e tente de novo.";
    return Response.json({ erro: msg }, { status: 400 });
  }
}
