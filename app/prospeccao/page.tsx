import type { Metadata } from "next";
import { googleEnabled } from "@/lib/google/places";
import { listBuscas, listLeads } from "@/lib/data/leads";
import { PageIntro } from "@/components/shell/page-intro";
import { ProspeccaoView } from "@/components/prospeccao/prospeccao-view";
import { ProspeccaoGuiada } from "@/components/prospeccao/prospeccao-guiada";
import { Funil } from "@/components/prospeccao/funil";

export const metadata: Metadata = { title: "Prospecção" };

export default async function ProspeccaoPage() {
  // Com a chave da Places API, a busca é automática; sem ela, guiada pelo Google Maps comum (grátis).
  const automatica = googleEnabled();
  const [leads, buscas] = await Promise.all([listLeads(), listBuscas()]);
  const abertos = leads.filter((l) => l.status !== "fechado" && l.status !== "perdido").length;
  const fechados = leads.filter((l) => l.status === "fechado").length;

  return (
    <div className="grid gap-6 md:gap-8">
      <PageIntro eyebrow="Prospecção">
        {leads.length === 0 ? (
          <>
            Ache quem mais precisa de avaliações.{" "}
            <span className="text-muted-foreground">
              {automatica ? "Busque um nicho na sua cidade e veja no mapa." : "Busque no Google Maps e mande os melhores para o funil."}
            </span>
          </>
        ) : (
          <>
            {abertos} {abertos === 1 ? "oportunidade aberta" : "oportunidades abertas"}
            <span className="text-muted-foreground">{fechados ? `, ${fechados} ${fechados === 1 ? "fechada" : "fechadas"} até agora.` : " no seu funil."}</span>
          </>
        )}
      </PageIntro>

      {automatica ? <ProspeccaoView buscas={buscas} /> : <ProspeccaoGuiada />}

      <section aria-labelledby="funil" className="grid gap-4">
        <div className="flex items-baseline justify-between">
          <h2 id="funil" className="text-16 font-semibold tracking-[-0.01em]">
            Funil de prospecção
          </h2>
          <span className="text-13 text-muted-foreground">
            <span className="font-mono tabular">{leads.length}</span> {leads.length === 1 ? "lead" : "leads"}
          </span>
        </div>
        <Funil leads={leads} />
      </section>
    </div>
  );
}
