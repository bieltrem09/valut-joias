import type { Metadata } from "next";
import { after } from "next/server";
import { listEmpresas } from "@/lib/data/empresas";
import { googleEnabled, refreshStale } from "@/lib/google/places";
import { ClientesView } from "@/components/clientes/clientes-view";
import { PageIntro } from "@/components/shell/page-intro";
import { todaySP } from "@/lib/dates";

export const metadata: Metadata = { title: "Clientes" };

export default function ClientesPage() {
  const empresas = listEmpresas();
  const enabled = googleEnabled();
  // Cache do Google vale 24h; vencidos são atualizados depois da resposta.
  if (enabled) after(() => refreshStale());

  const comPlaca = empresas.filter((e) => e.deltaAvaliacoes != null);
  const ganho = comPlaca.reduce((a, e) => a + (e.deltaAvaliacoes ?? 0), 0);

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
        ) : (
          <>
            {empresas.length} {empresas.length === 1 ? "empresa" : "empresas"} <span className="text-muted-foreground">compram de você.</span>
          </>
        )}
      </PageIntro>
      <ClientesView empresas={empresas} today={todaySP()} googleEnabled={enabled} />
    </div>
  );
}
