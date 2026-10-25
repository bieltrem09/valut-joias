import type { Metadata } from "next";
import { listProdutos } from "@/lib/data/estoque";
import { resumoEstoque } from "@/lib/estoque";
import { formatBRL, formatInt } from "@/lib/format";
import { PageIntro } from "@/components/shell/page-intro";
import { EstoqueView } from "@/components/estoque/estoque-view";

export const metadata: Metadata = { title: "Estoque" };

export default async function EstoquePage() {
  const produtos = await listProdutos();
  const r = resumoEstoque(produtos);
  const alertas = r.baixos + r.esgotados;

  return (
    <div className="grid gap-6 md:gap-8">
      <PageIntro eyebrow="Estoque">
        {produtos.length === 0 ? (
          <>
            Tudo que você tem para vender, <span className="text-muted-foreground">com foto, preço e quantidade.</span>
          </>
        ) : (
          <>
            {formatInt(r.unidades)} {r.unidades === 1 ? "unidade" : "unidades"} em mãos, valendo{" "}
            <span className="text-foreground">{formatBRL(r.valorVenda)}</span>
            <span className="text-muted-foreground">
              {alertas ? `. ${alertas} ${alertas === 1 ? "produto precisa" : "produtos precisam"} de reposição.` : ". Nada acabando."}
            </span>
          </>
        )}
      </PageIntro>
      <EstoqueView produtos={produtos} />
    </div>
  );
}
