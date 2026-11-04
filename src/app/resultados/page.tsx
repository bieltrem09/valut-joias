import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { Resultados } from "@/components/sections/Resultados";
import { Depoimentos } from "@/components/sections/Depoimentos";
import { CtaFinal } from "@/components/sections/CtaFinal";

export const metadata = pageMeta(
  "Resultados e depoimentos",
  "Transformações, conquistas e avaliações reais de quem treina na Zero Um CT em Americana/SP.",
  "/resultados",
);

export default function ResultadosPage() {
  return (
    <>
      <PageHero n="01" kicker="Resultados" title="Aparecer." accent="Todo dia." intro="Transformações e conquistas de quem treina aqui. Só com autorização de cada aluno e aluna." />
      <Resultados full label="02" />
      <Depoimentos label="03" />
      <CtaFinal />
    </>
  );
}
