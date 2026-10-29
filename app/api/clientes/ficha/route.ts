import { ErroFicha, puxarFichaGoogle, rastro } from "@/lib/ficha-google";

/** Lê o link do Google colado no cadastro do cliente e devolve a ficha para preencher o formulário. */
export async function GET(req: Request) {
  const link = new URL(req.url).searchParams.get("link") ?? "";
  try {
    return Response.json(await puxarFichaGoogle(link));
  } catch (e) {
    console.error("ficha google", e);
    const msg = e instanceof ErroFicha ? e.message : "Não deu para ler esse link agora. Confira o link e tente de novo.";
    return Response.json({ erro: msg, rastro }, { status: 400 });
  }
}
