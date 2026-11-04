import { conquistas, transformacoes } from "@/content/zeroum";
import { Media } from "@/components/ui/Media";
import { BeforeAfter } from "@/components/ui/BeforeAfter";
import { SectionLabel } from "@/components/ui/SectionHead";
import { Todo } from "@/components/ui/Todo";

/**
 * 08 · RESULTADOS — momento de assinatura #4: "TODO DIA" gigante em vermelho vazando da foto (data-fx="drift").
 * Só números e fotos reais, com autorização por escrito.
 */
export function Resultados({ label = "08", full = false }: { label?: string; full?: boolean }) {
  const exemplo = transformacoes[0];

  return (
    <section aria-labelledby="res-title" className="relative z-10 overflow-hidden bg-black py-24 md:py-32">
      <div className="container-site">
        <SectionLabel n={label}>Resultados e conquistas</SectionLabel>
        <h2 id="res-title" className="title mt-4 max-w-2xl text-[clamp(1.75rem,3vw,2.5rem)]">
          Resultado não vem de um treino. Vem de aparecer.
        </h2>

        <div className="res-foto relative mt-12">
          <Media slot="resultados" sizes="(min-width:1440px) 1392px, 100vw" className="min-h-[320px]" />
          <p
            data-fx="drift" className="todo-dia display pointer-events-none absolute -bottom-[0.18em] left-1/2 w-max -translate-x-1/2 text-mega text-red [text-shadow:0_10px_40px_rgb(0_0_0/0.35)]"
            aria-hidden="true"
          >
            Todo dia
          </p>
        </div>

        <div className="mt-24 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h3 className="display text-[clamp(2.25rem,4vw,3.5rem)]">Antes e depois</h3>
            <p className="mt-4 max-w-md text-gray-300">
              Arraste ou use as setas do teclado para comparar. Publicamos só com autorização por escrito de quem treina aqui.
            </p>
            {!exemplo && (
              <p className="mt-6">
                <Todo>transformações reais com autorização por escrito (nome, tempo, dado concreto)</Todo>
              </p>
            )}
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <BeforeAfter antes={exemplo?.antes ?? "antes"} depois={exemplo?.depois ?? "depois"} label={exemplo?.nome ?? "exemplo"} />
            {exemplo && <p className="label mt-3 text-gray-300">{exemplo.nome} · {exemplo.dado}</p>}
          </div>
        </div>

        {(full || conquistas.length > 0) && (
          <div className="mt-20">
            <h3 className="display text-[clamp(2.25rem,4vw,3.5rem)]">Conquistas</h3>
            {conquistas.length === 0 ? (
              <p className="mt-6">
                <Todo>campeonatos, metas batidas e tempo de casa — só dados reais</Todo>
              </p>
            ) : (
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {conquistas.map((c) => (
                  <li key={c.id} className="rounded-[var(--radius-card)] bg-carbon p-6">
                    <p className="label text-red-bright">{c.data}</p>
                    <p className="title mt-3 text-xl">{c.titulo}</p>
                    <p className="mt-2 text-gray-300">{c.detalhe}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
