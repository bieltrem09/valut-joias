import type { Metadata } from "next";
import { listLeads } from "@/lib/data/leads";
import { listGravacoes } from "@/lib/data/mentora";
import { PageIntro } from "@/components/shell/page-intro";
import { MentoraView } from "@/components/mentora/mentora-view";

export const metadata: Metadata = { title: "Mentora" };

export default async function MentoraPage() {
  const [leads, gravacoes] = await Promise.all([listLeads(), listGravacoes()]);
  return (
    <div className="grid gap-6 md:gap-8">
      <PageIntro eyebrow="Mentora de vendas">
        Fale como vizinho, não como vendedor. <span className="text-muted-foreground">Peça licença, mostre na mão e sempre deixe uma porta aberta.</span>
      </PageIntro>
      <MentoraView
        gravacoes={gravacoes}
        leads={leads
          .filter((l) => l.status !== "fechado" && l.status !== "perdido")
          .map((l) => ({ placeId: l.placeId, nome: l.nome, segmento: l.segmento ?? l.categoria, rating: l.rating, totalAvaliacoes: l.totalAvaliacoes }))}
      />
    </div>
  );
}
