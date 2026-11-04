import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { Professores } from "@/components/sections/ProfessoresSection";
import { PrimeiroTreino } from "@/components/sections/PrimeiroTreino";

export const metadata = pageMeta(
  "Professores",
  "Conheça a equipe da Zero Um CT Americana: especialidades, CREF e turno em que cada professor está no salão.",
  "/professores",
);

export default function ProfessoresPage() {
  return (
    <>
      <PageHero n="01" kicker="Equipe" title="Quem te" accent="acompanha." intro="Professores no salão para montar seu treino, corrigir a execução e ajustar a carga." />
      <Professores grid label="02" />
      <PrimeiroTreino />
    </>
  );
}
