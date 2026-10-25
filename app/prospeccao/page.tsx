import type { Metadata } from "next";
import { googleEnabled } from "@/lib/google/places";
import { listBuscas, listLeads } from "@/lib/data/leads";
import { Prospector } from "@/components/prospeccao/prospector";
import { usoDoMes } from "@/lib/google/uso";
import { AnotarLead } from "@/components/prospeccao/anotar-lead";
import { Funil } from "@/components/prospeccao/funil";

export const metadata: Metadata = { title: "Prospecção" };

export default async function ProspeccaoPage() {
  // Sem a chave, o mapa do Google funciona (embed grátis); com ela, vem a lista com fotos e tudo.
  const temGoogle = googleEnabled();
  const [leads, buscas, uso] = await Promise.all([listLeads(), listBuscas(), temGoogle ? usoDoMes() : null]);
  const abertos = leads.filter((l) => l.status !== "fechado" && l.status !== "perdido").length;

  return (
    <div className="grid gap-6 md:gap-8">
      <Prospector buscas={buscas} temGoogle={temGoogle} uso={uso} />

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
