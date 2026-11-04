import Link from "next/link";
import { avaliacaoGoogle, falamDaEquipe, professores, zeroum } from "@/content/zeroum";
import { SectionLabel } from "@/components/ui/SectionHead";
import { Todo } from "@/components/ui/Todo";
import { ProfessoresCarousel } from "./Professores";

/**
 * 06 · PROFESSORES.
 * Com a equipe cadastrada em zeroum.ts → carrossel arrastável.
 * Enquanto não há dados → em vez de cards falsos, mostra o que os alunos dizem
 * da equipe nas avaliações reais do Google.
 */
export function Professores({ label = "06", grid = false }: { label?: string; grid?: boolean }) {
  const cadastrados = professores.some((p) => !p.pendente);
  if (cadastrados) return <ProfessoresCarousel label={label} grid={grid} />;

  return (
    <section aria-labelledby="prof-title" className="relative z-10 bg-black py-24 md:py-32">
      <div className="container-site grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionLabel n={label}>Professores</SectionLabel>
          <h2 id="prof-title" className="display mt-4 text-section">
            Quem te
            <br />
            acompanha
          </h2>
          <p className="mt-6 max-w-md text-gray-300">
            Professores no salão para montar seu treino, corrigir a execução e ajustar a carga. A apresentação da equipe chega em breve. Enquanto isso, veja o que dizem os alunos.
          </p>
          <p className="mt-6">
            <Todo>nome, foto, especialidade, CREF e turno de cada professor(a)</Todo>
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/aula-experimental" className="btn btn-red">
              Conhecer na aula experimental <span className="btn-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <ul className="grid gap-3 lg:col-span-6 lg:col-start-7" aria-label="O que os alunos dizem da equipe">
          {falamDaEquipe.map((f, i) => (
            <li key={f.id} className={`rounded-[var(--radius-card)] p-6 md:p-8 ${i === 0 ? "bg-red text-white" : "bg-carbon"}`}>
              <figure>
                <blockquote className="title text-[clamp(1.35rem,2.4vw,2rem)] font-semibold leading-tight">“{f.trecho}”</blockquote>
                <figcaption className={`label mt-5 ${i === 0 ? "text-white" : "text-gray-300"}`}>
                  {f.nome} · Avaliação no Google
                </figcaption>
              </figure>
            </li>
          ))}
          {avaliacaoGoogle && (
            <li className="label px-2 text-gray-300">
              {zeroum.nomeCurto} · nota {avaliacaoGoogle.nota.toLocaleString("pt-BR")} no Google · {avaliacaoGoogle.total} avaliações
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
