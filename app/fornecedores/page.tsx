import type { Metadata } from "next";
import { listFornecedores, listOfertas, listPedidos, listProdutosParaEntrada, precoMedioDeVenda } from "@/lib/data/fornecedores";
import { dono } from "@/lib/dono";
import { PageIntro } from "@/components/shell/page-intro";
import { FornecedoresView } from "@/components/fornecedores/fornecedores-view";

export const metadata: Metadata = { title: "Fornecedores" };

export default async function FornecedoresPage() {
  const [fornecedores, ofertas, pedidos, produtos, precoMedio] = await Promise.all([
    listFornecedores(),
    listOfertas(),
    listPedidos(),
    listProdutosParaEntrada(),
    precoMedioDeVenda(),
  ]);
  const aCaminho = pedidos.filter((p) => p.status === "pedido" || p.status === "enviado").length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:gap-8">
      <PageIntro eyebrow="Fornecedores">
        {ofertas.length === 0 ? (
          <>
            Onde comprar suas placas, <span className="text-muted-foreground">com foto, preço e o link direto para fechar a compra.</span>
          </>
        ) : (
          <>
            {ofertas.length} {ofertas.length === 1 ? "placa" : "placas"} de {fornecedores.length} {fornecedores.length === 1 ? "fornecedor" : "fornecedores"}
            <span className="text-muted-foreground">
              {aCaminho ? `. ${aCaminho} ${aCaminho === 1 ? "pedido a caminho" : "pedidos a caminho"}.` : ". Toque em Comprar e vá direto à loja."}
            </span>
          </>
        )}
      </PageIntro>
      <FornecedoresView fornecedores={fornecedores} ofertas={ofertas} pedidos={pedidos} produtos={produtos} precoMedio={precoMedio} nomeDono={dono().nome} />
    </div>
  );
}
