import { pilares } from "@/content/zeroum";
import { SectionLabel } from "@/components/ui/SectionHead";

/**
 * 02 · MANIFESTO — seção clara que entra como folha por cima do hero (momento #3).
 * Motion (ScrollFx): cor por palavra cinza→preto acompanhando a leitura (data-fx="words");
 * pilares entram com rise + stagger 80ms. Server Component: zero hidratação.
 */
export function Manifesto() {
  return (
    <section
      aria-labelledby="sobre-title"
      className="surface-paper relative z-10 rounded-t-[36px] pb-24 pt-16 shadow-[0_-30px_60px_rgb(0_0_0/0.35)] md:rounded-t-[48px] md:pb-32 md:pt-24"
    >
      <div className="container-site">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-3">
            <SectionLabel n="02">Manifesto</SectionLabel>
            <h2 id="sobre-title" className="display mt-4 text-section">
              Sobre
            </h2>
          </div>
          <p data-fx="words" className="manifesto-text display text-left md:text-justify text-[clamp(2rem,4.6vw,4.4rem)] leading-[1.02] [hyphens:none] md:col-span-9">
            Estrutura pra treinar pesado. Gente pra te acompanhar. E a porta aberta a qualquer hora.
          </p>
        </div>

        <ul data-fx="rise" className="pilares hairline mt-16 grid border-t md:mt-24 md:grid-cols-3">
          {pilares.map((p, i) => (
            <li key={p.nome} data-fx-item className="pilar hairline border-b py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0">
              <p className="label text-gray-600">
                0{i + 1} · {p.nome}
              </p>
              <p className="mt-6 font-mono text-[clamp(2.5rem,4vw,3.75rem)] font-medium leading-none tracking-tight tnum">{p.dado}</p>
              <p className="mt-4 max-w-xs text-gray-600">{p.frase}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
