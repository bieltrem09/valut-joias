"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { avaliacaoGoogle, depoimentos, zeroum } from "@/content/zeroum";
import { SectionLabel } from "@/components/ui/SectionHead";
import { Todo } from "@/components/ui/Todo";
import { PillLink } from "@/components/ui/Buttons";

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${n} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={16} aria-hidden="true" className={i <= n ? "fill-red-bright text-red-bright" : "text-white/25"} />
      ))}
    </span>
  );
}

/** 09 · DEPOIMENTOS — só avaliações reais do Google. Sem auto-rotação. */
export function Depoimentos({ label = "09" }: { label?: string }) {
  const [i, setI] = useState(0);
  const d = depoimentos[i];
  const go = (dir: number) => setI((v) => (v + dir + depoimentos.length) % depoimentos.length);

  return (
    <section aria-labelledby="dep-title" className="relative z-10 bg-black py-24 md:py-32">
      <div className="container-site text-center">
        <SectionLabel n={label} className="justify-center">
          Depoimentos
        </SectionLabel>
        <h2 id="dep-title" className="sr-only">
          O que dizem os alunos
        </h2>

        {avaliacaoGoogle && (
          <p className="mt-6 inline-flex items-center gap-3">
            <Stars n={Math.round(avaliacaoGoogle.nota)} />
            <span className="label">
              {avaliacaoGoogle.nota.toLocaleString("pt-BR")} no Google · {avaliacaoGoogle.total} avaliações
            </span>
          </p>
        )}

        {d ? (
          <figure className="mx-auto mt-10 min-h-[18rem] max-w-4xl md:min-h-[16rem]" aria-live="polite">
            <blockquote className="title text-[clamp(1.6rem,3.4vw,3rem)] font-semibold leading-tight">“{d.texto}”</blockquote>
            <figcaption className="mt-8 flex flex-col items-center gap-3">
              <Stars n={d.nota} />
              <span className="pill bg-red text-white">
                {d.nome}
                {d.desde ? ` · aluno(a) desde ${d.desde}` : ""}
              </span>
              <span className="label text-gray-300">Avaliação no Google</span>
            </figcaption>
          </figure>
        ) : (
          <div className="mx-auto mt-10 max-w-3xl">
            <p className="title text-[clamp(1.6rem,3.4vw,3rem)] font-semibold leading-tight text-white/40">
              “Os depoimentos dos alunos entram aqui.”
            </p>
            <p className="mt-6">
              <Todo>copiar avaliações reais do Google (nome + texto + nota)</Todo>
            </p>
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {depoimentos.length > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} className="btn-circle !bg-steel" aria-label="Depoimento anterior">
                <ArrowLeft size={20} style={{ transform: "none" }} aria-hidden="true" />
              </button>
              <span className="label tnum text-gray-300">
                {String(i + 1).padStart(2, "0")}/{String(depoimentos.length).padStart(2, "0")}
              </span>
              <button type="button" onClick={() => go(1)} className="btn-circle" aria-label="Próximo depoimento">
                <ArrowRight size={20} style={{ transform: "none" }} aria-hidden="true" />
              </button>
            </>
          )}
          <PillLink href={zeroum.mapa} tone="outline" external>
            Ver avaliações no Google
          </PillLink>
        </div>
      </div>
    </section>
  );
}
