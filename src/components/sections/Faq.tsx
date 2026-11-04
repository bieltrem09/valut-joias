import { faq } from "@/content/zeroum";
import { SectionLabel } from "@/components/ui/SectionHead";
import { Value } from "@/components/ui/Todo";

/** 13 · FAQ — <details> nativo: acessível, sem JS. */
export function Faq({ label = "13" }: { label?: string }) {
  const answered = faq.filter((f) => typeof f.a === "string");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: answered.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a as string } })),
  };
  return (
    <section aria-labelledby="faq-title" className="surface-paper relative z-10 py-24 md:py-32">
      <div className="container-site grid gap-10 md:grid-cols-12">
        <div className="md:col-span-4">
          <SectionLabel n={label}>Dúvidas</SectionLabel>
          <h2 id="faq-title" className="display mt-4 text-section">
            Perguntas
            <br />
            frequentes
          </h2>
        </div>
        <div className="md:col-span-8">
          {faq.map((f) => (
            <details key={f.q} className="hairline border-b first:border-t">
              <summary className="flex min-h-16 items-center justify-between gap-6 py-5 text-lg font-semibold md:text-xl">
                {f.q}
                <span className="faq-icon grid size-10 shrink-0 place-items-center rounded-full border border-black/20 text-xl leading-none" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="max-w-2xl pb-6 text-gray-600">
                <Value v={f.a} />
              </div>
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
