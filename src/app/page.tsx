import { Hero } from "@/components/sections/Hero";
import { Manifesto } from "@/components/sections/Manifesto";
import { EstruturaScroller } from "@/components/sections/EstruturaScroller";
import { Horarios24 } from "@/components/sections/Horarios24";
import { Planos } from "@/components/sections/Planos";
import { Professores } from "@/components/sections/ProfessoresSection";
import { PrimeiroTreino } from "@/components/sections/PrimeiroTreino";
import { Resultados } from "@/components/sections/Resultados";
import { Depoimentos } from "@/components/sections/Depoimentos";
import { Comunidade } from "@/components/sections/Comunidade";
import { CtaFinal } from "@/components/sections/CtaFinal";
import { Localizacao } from "@/components/sections/Localizacao";
import { Faq } from "@/components/sections/Faq";

export default function Home() {
  return (
    <>
      <Hero />
      <Manifesto />
      <EstruturaScroller />
      <Horarios24 />
      <Planos />
      <Professores />
      <PrimeiroTreino />
      <Resultados />
      <Depoimentos />
      <Comunidade />
      <CtaFinal />
      <Localizacao />
      <Faq />
    </>
  );
}
