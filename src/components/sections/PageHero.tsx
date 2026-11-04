import { SectionLabel } from "@/components/ui/SectionHead";

/** Cabeçalho das páginas internas. */
export function PageHero({ n, kicker, title, accent, intro, children }: { n: string; kicker: string; title: string; accent?: string; intro?: string; children?: React.ReactNode }) {
  return (
    <section className="relative bg-black pb-16 pt-[calc(var(--nav-h)+4rem)] md:pb-20 md:pt-[calc(var(--nav-h)+6rem)]">
      <div className="container-site">
        <SectionLabel n={n}>{kicker}</SectionLabel>
        <h1 className="display mt-6 text-hero">
          {title}
          {accent && (
            <>
              <br />
              <span className="text-red">{accent}</span>
            </>
          )}
        </h1>
        {intro && <p className="mt-8 max-w-2xl text-lg text-gray-300">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
