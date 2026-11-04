import Link from "next/link";
import { SectionLabel } from "@/components/ui/SectionHead";
import { CircleLink } from "@/components/ui/Buttons";
import { WA_AULA } from "@/lib/whatsapp";

const passos = [
  { n: "01", t: "Avaliação", d: "Você conta seu objetivo, histórico e rotina. A gente olha postura, mobilidade e ponto de partida." },
  { n: "02", t: "Treino montado pro seu objetivo", d: "Hipertrofia, emagrecimento ou saúde: o treino sai pensado para você, não copiado da internet." },
  { n: "03", t: "Acompanhamento no salão", d: "Professor por perto para corrigir execução, ajustar carga e tirar dúvida no meio da série." },
];

/** 07 · SEU PRIMEIRO TREINO — do zero ao um. A linha entre os passos se desenha no scroll (data-fx="line"). */
export function PrimeiroTreino() {
  return (
    <section aria-labelledby="primeiro-title" className="relative z-10 bg-black pb-24 md:pb-32">
      <div className="container-site">
        <div className="hairline grid gap-8 border-t pt-16 md:grid-cols-12">
          <div className="md:col-span-5">
            <SectionLabel n="07">Seu primeiro treino</SectionLabel>
            <h2 id="primeiro-title" className="display mt-4 text-section">
              Do zero
              <br />
              <span className="text-red">ao um.</span>
            </h2>
          </div>
          <p className="max-w-md self-end text-gray-300 md:col-span-5 md:col-start-8">
            Nunca treinou ou está voltando agora? Homem ou mulher, iniciante ou não, o começo é o mesmo: três passos.
          </p>
        </div>

        <div className="passos relative mt-14">
          <div className="absolute inset-x-0 top-6 hidden h-0.5 bg-white/12 md:block" aria-hidden="true">
            <div data-fx="line" className="passo-linha h-full origin-left bg-red" />
          </div>
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            {passos.map((p) => (
              <li key={p.n} className="md:pr-6">
                <span className="grid size-12 place-items-center rounded-full border border-white/20 bg-black font-mono text-sm tnum">{p.n}</span>
                <h3 className="title mt-6 text-2xl">{p.t}</h3>
                <p className="mt-3 max-w-sm text-gray-300">{p.d}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Card escuro de comunidade (ref. Velocity) */}
        <div className="mt-16 flex flex-col gap-6 rounded-[var(--radius-card)] bg-carbon p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="ph size-11 rounded-full border-2 border-carbon" />
              ))}
            </div>
            <p className="title text-lg sm:text-xl">
              Primeira aula por nossa conta.
              <span className="block text-base font-medium tracking-normal text-gray-300">Chama no WhatsApp ou agende pelo site.</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/aula-experimental" className="btn btn-white">
              Agendar
            </Link>
            <CircleLink href={WA_AULA} label="Agendar pelo WhatsApp" />
          </div>
        </div>
      </div>
    </section>
  );
}
