import { Logo, Wordmark } from "@/components/brand/Logo";
import { Todo } from "@/components/ui/Todo";
import { PillLink, CircleLink } from "@/components/ui/Buttons";
import { SectionLabel } from "@/components/ui/SectionHead";
import { Media } from "@/components/ui/Media";

export const metadata = { title: "Styleguide", robots: { index: false, follow: false } };

const cores = [
  ["--black", "#0B0B0B", "bg-black", "Fundo dominante"],
  ["--carbon", "#141414", "bg-carbon", "Cards escuros"],
  ["--steel", "#1E1E1E", "bg-steel", "Superfícies elevadas"],
  ["--red", "#E3182D", "bg-red", "CTA · texto grande · 4.16:1 no preto"],
  ["--red-bright", "#FF3B4E", "bg-red-bright", "Texto pequeno no preto · 5.61:1"],
  ["--red-ink", "#CC1429", "bg-red-ink", "Texto pequeno no paper · 5.03:1"],
  ["--red-deep", "#9E0F1F", "bg-red-deep", "Hover / pressed"],
  ["--paper", "#F2F1EE", "bg-paper", "Seções claras de respiro"],
  ["--gray-300", "#A3A3A3", "bg-gray-300", "Secundário no preto · 7.8:1"],
  ["--gray-600", "#55534F", "bg-gray-600", "Secundário no paper · 6.79:1"],
];

export default function Styleguide() {
  return (
    <div className="pt-[calc(var(--nav-h)+3rem)]">
      <div className="container-site space-y-20 pb-24">
        <header>
          <SectionLabel n="00">Styleguide</SectionLabel>
          <h1 className="display mt-4 text-hero">Zero Um CT</h1>
        </header>

        <section>
          <h2 className="label text-gray-300">Logo</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="grid place-items-center rounded-[var(--radius-card)] bg-black p-12 ring-1 ring-white/10"><Logo className="w-72" /></div>
            <div className="grid place-items-center rounded-[var(--radius-card)] bg-paper p-12"><Logo variant="black-red" className="w-72" /></div>
            <div className="grid place-items-center rounded-[var(--radius-card)] bg-carbon p-12"><Logo variant="mono-white" className="w-72" /></div>
            <div className="grid place-items-center rounded-[var(--radius-card)] bg-white p-12"><Logo variant="mono-black" className="w-72" /></div>
          </div>
          <Wordmark className="mt-6 w-full text-white" />
        </section>

        <section>
          <h2 className="label text-gray-300">Cores (proporção ~70 preto / 20 branco / 10 vermelho)</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {cores.map(([t, h, c, d]) => (
              <li key={t} className="overflow-hidden rounded-[var(--radius-chip)] ring-1 ring-white/10">
                <div className={`h-24 ${c}`} />
                <div className="bg-carbon p-3">
                  <p className="label">{t}</p>
                  <p className="font-mono text-sm text-gray-300">{h}</p>
                  <p className="mt-1 text-xs text-gray-300">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-6">
          <h2 className="label text-gray-300">Tipografia</h2>
          <p className="display text-hero">Anton · display</p>
          <p className="title text-5xl">Manrope 700 · títulos e UI</p>
          <p className="max-w-xl text-lg">Manrope 400 · corpo de texto com 16px+ e line-height 1.55 para leitura confortável.</p>
          <p className="label">Geist Mono · rótulos · 03:12 · 2.500 m²</p>
        </section>

        <section>
          <h2 className="label text-gray-300">Componentes</h2>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <PillLink href="#">Primário</PillLink>
            <PillLink href="#" tone="white">Branco</PillLink>
            <PillLink href="#" tone="outline">Outline</PillLink>
            <CircleLink href="#" label="Exemplo" />
            <span className="pill bg-red text-white">Tag</span>
            <span className="glass label inline-flex h-10 items-center rounded-[var(--radius-chip)] px-3">Chip de vidro</span>
            <Todo>exemplo de conteúdo pendente</Todo>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Media slot="prof-01" />
            <Media slot="estrutura-cardio" />
            <Media slot="estrutura-recovery" />
          </div>
        </section>

        <section className="surface-paper rounded-[var(--radius-card)] p-8">
          <SectionLabel n="05">Seção clara</SectionLabel>
          <p className="display mt-4 text-section">Paper <span className="text-red">#F2F1EE</span></p>
          <p className="mt-4 text-gray-600">Texto secundário em gray-600. Vermelho pequeno usa <span className="font-semibold text-red-ink">red-ink</span>.</p>
          <div className="mt-6 flex gap-3"><PillLink href="#" tone="black">Botão preto</PillLink><PillLink href="#" tone="outline">Outline</PillLink></div>
        </section>
      </div>
    </div>
  );
}
