import type { Metadata } from "next";
import { googleEnabled } from "@/lib/google/places";
import { listBuscas, listLeads } from "@/lib/data/leads";
import { Radar } from "@/components/prospeccao/radar";
import { AnotarLead } from "@/components/prospeccao/anotar-lead";
import { Funil } from "@/components/prospeccao/funil";

export const metadata: Metadata = { title: "Prospecção" };

export default async function ProspeccaoPage() {
  // Com a chave da Places API, a busca traz nota e avaliações; sem ela, usa o mapa aberto (grátis).
  const fonte = googleEnabled() ? "google" : "osm";
  const [leads, buscas] = await Promise.all([listLeads(), listBuscas()]);
  const abertos = leads.filter((l) => l.status !== "fechado" && l.status !== "perdido").length;

  return (
    <div className="grid gap-6 md:gap-8">
      <Radar buscas={buscas} fonte={fonte} />

      <details className="surface group p-0 [&[open]_.seta]:rotate-180">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
          <span>
            <span className="block text-16 font-semibold tracking-[-0.01em]">Não achou no mapa? Anote à mão</span>
            <span className="block text-13 text-muted-foreground">
              Cole o link do Google Maps (Compartilhar → Copiar) ou digite o nome, a nota e as avaliações.
            </span>
          </span>
          <span aria-hidden className="seta grid size-8 shrink-0 place-items-center rounded-full ring-1 ring-border transition-transform duration-200">
            ▾
          </span>
        </summary>
        <div className="border-t border-border p-5">
          <AnotarLead segmento="" noFunil={leads.map((l) => ({ placeId: l.placeId, nome: l.nome }))} />
        </div>
      </details>

      <section aria-labelledby="funil" className="grid gap-4">
        <div className="flex items-baseline justify-between">
          <h2 id="funil" className="text-16 font-semibold tracking-[-0.01em]">
            Funil de prospecção
          </h2>
          <span className="text-13 text-muted-foreground">
            <span className="font-mono tabular">{abertos}</span> {abertos === 1 ? "aberto" : "abertos"} ·{" "}
            <span className="font-mono tabular">{leads.length}</span> {leads.length === 1 ? "lead" : "leads"}
          </span>
        </div>
        <Funil leads={leads} />
      </section>
    </div>
  );
}
