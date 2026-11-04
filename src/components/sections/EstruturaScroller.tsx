import Link from "next/link";
import { ambientes } from "@/content/zeroum";
import { Media } from "@/components/ui/Media";
import { SectionLabel } from "@/components/ui/SectionHead";

const alturas = ["lg:h-[62vh]", "lg:h-[48vh]", "lg:h-[56vh]", "lg:h-[66vh]", "lg:h-[44vh]", "lg:h-[58vh]", "lg:h-[50vh]", "lg:h-[46vh]"];

/**
 * 03 · ESTRUTURA — foto aérea (data-fx="clip-in") + pin com scroll horizontal
 * (data-fx="hscroll", só ≥1024px sem reduced-motion). Mobile: carrossel nativo com scroll-snap.
 */
export function EstruturaScroller() {
  const lista = ambientes.filter((a) => a.confirmado);

  return (
    <section aria-labelledby="estrutura-title" className="relative z-10 bg-black pt-24 md:pt-32">
      <div className="container-site grid gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <SectionLabel n="03">Estrutura</SectionLabel>
          <h2 id="estrutura-title" className="display mt-4 text-section">
            2.500 m².
            <br />
            <span className="text-red">Anda com a gente.</span>
          </h2>
        </div>
        <p className="max-w-md text-gray-300 md:col-span-4 md:col-start-9">
          A maior academia de Americana: 230 máquinas de 10 marcas, peso livre, cardio, Sala Recovery e máquina de gelo. Um tour pelo que você encontra quando passa pela catraca.
        </p>
      </div>

      <div className="container-site mt-12">
        <div data-fx="clip-in">
          <Media slot="estrutura-drone" sizes="(min-width:1440px) 1392px, 100vw" />
        </div>
      </div>

      <div data-fx="hscroll" className="estrutura-pin mt-16 lg:flex lg:h-screen lg:items-center lg:overflow-hidden">
        <ul
          data-fx-track
          className="no-scrollbar flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-4 overflow-x-auto px-[var(--gutter)] pb-4 lg:snap-none lg:items-end lg:gap-6 lg:overflow-visible lg:pb-0"
          aria-label="Ambientes da academia"
        >
          {lista.map((a, i) => (
            <li key={a.id} className={`w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw] lg:max-w-[440px] ${i % 2 ? "lg:self-start" : ""}`}>
              <figure>
                <div className={`relative aspect-[3/4] overflow-hidden rounded-[var(--radius-photo)] lg:aspect-auto ${alturas[i % alturas.length]}`}>
                  <Media slot={a.foto} keepRatio={false} className="h-full w-full" sizes="(min-width:1024px) 30vw, 78vw" />
                  <span className="pill absolute left-3 top-3 bg-black/80 text-white backdrop-blur-sm">
                    <span className="label text-red-bright">{String(i + 1).padStart(2, "0")}</span>
                    {a.nome}
                  </span>
                </div>
                <figcaption className="mt-3 text-sm text-gray-300">{a.resumo}</figcaption>
              </figure>
            </li>
          ))}
          <li className="flex w-[60vw] shrink-0 snap-start items-center sm:w-[30vw] lg:w-[22vw]">
            <Link href="/estrutura" className="group flex items-center gap-4 text-xl font-bold">
              Ver estrutura completa
              <span className="btn-circle" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
