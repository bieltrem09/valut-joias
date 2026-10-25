import type { Metadata } from "next";
import { after } from "next/server";
import { crescimentoGeral, listEmpresas } from "@/lib/data/empresas";
import { CrescimentoGeral } from "@/components/clientes/crescimento-geral";
import { googleEnabled, refreshStale } from "@/lib/google/places";
import { ClientesView } from "@/components/clientes/clientes-view";
import { PageIntro } from "@/components/shell/page-intro";
import { todaySP } from "@/lib/dates";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage() {
  const empresas = await listEmpresas();
  const enabled = googleEnabled();
  // Cache do Google vale 24h; vencidos são atualizados depois da resposta.
  if (enabled) after(() => refreshStale());

  const comPlaca = empresas.filter((e) => e.crescimento.ganho != null);
  const ganho = comPlaca.reduce((a, e) => a + (e.crescimento.ganho ?? 0), 0);
  const serie = crescimentoGeral(empresas);

  return (
    <div className="grid gap-6 md:gap-8">
      <PageIntro eyebrow="Clientes">
        {comPlaca.length > 0 ? (
          <>
            Suas placas de avaliação já renderam <span className="text-foreground">{ganho.toLocaleString("pt-BR")} avaliações</span>
            <span className="text-muted-foreground">
              {" "}
              no Google para {comPlaca.length} {comPlaca.length === 1 ? "cliente" : "clientes"}.
            </span>
          </>
        ) : empresas.length === 0 ? (
          <>
            Nenhum cliente ainda. <span className="text-muted-foreground">Comece cadastrando a primeira empresa.</span>
          </>
        ) : (
          <>
            {empresas.length} {empresas.length === 1 ? "empresa compra" : "empresas compram"} <span className="text-muted-foreground">de você.</span>
          </>
        )}
      </PageIntro>
      {empresas.length > 0 && <CrescimentoGeral serie={serie} empresas={empresas} googleEnabled={enabled} />}
      <ClientesView empresas={empresas} today={todaySP()} googleEnabled={enabled} />
    </div>
  );
}
