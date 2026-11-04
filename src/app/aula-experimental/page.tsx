import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { AulaForm } from "@/components/forms/AulaForm";
import { OpenChip } from "@/components/layout/OpenChip";

export const metadata = pageMeta(
  "Aula experimental",
  "Agende sua aula experimental na Zero Um CT Americana. Preencha nome, objetivo e turno e fale com a gente pelo WhatsApp.",
  "/aula-experimental",
);

export default function AulaPage() {
  return (
    <>
      <PageHero n="01" kicker="Aula experimental" title="Primeira aula" accent="por nossa conta." />
      <section className="bg-black pb-24">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <ol className="space-y-6">
              {["Você preenche (leva 30 segundos)", "O WhatsApp abre com a mensagem pronta", "A gente confirma o melhor horário"].map((t, i) => (
                <li key={t} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 font-mono text-sm">0{i + 1}</span>
                  <span className="pt-2 font-semibold">{t}</span>
                </li>
              ))}
            </ol>
            <OpenChip withTime className="mt-10 inline-flex text-gray-300" />
          </aside>
          <div className="rounded-[var(--radius-card)] border border-white/10 p-6 md:p-10 lg:col-span-7 lg:col-start-6">
            <AulaForm />
          </div>
        </div>
      </section>
    </>
  );
}
