import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { Planos } from "@/components/sections/Planos";
import { CtaFinal } from "@/components/sections/CtaFinal";

export const metadata = pageMeta(
  "Planos e preços",
  "Planos da Zero Um CT Americana: musculação 24 horas em 2.500 m². Aceitamos Wellhub Silver e TotalPass TP2.",
  "/planos",
);

export default function PlanosPage() {
  return (
    <>
      <PageHero n="01" kicker="Planos" title="Planos e" accent="preços." intro="Escolha o período que cabe na sua rotina. Usa Wellhub ou TotalPass? Só chegar com o app." />
      <Planos full label="02" />
      <CtaFinal />
    </>
  );
}
