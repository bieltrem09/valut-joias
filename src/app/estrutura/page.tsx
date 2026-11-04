import { ambientes, zeroum } from "@/content/zeroum";
import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { Media } from "@/components/ui/Media";
import { Todo } from "@/components/ui/Todo";
import { CtaFinal } from "@/components/sections/CtaFinal";

export const metadata = pageMeta(
  "Estrutura de 2.500 m²",
  "Tour pela Zero Um CT em Americana: peso livre, máquinas de musculação, cardio, Sala Recovery, máquina de gelo e vestiários. 2.500 m² abertos 24 horas.",
  "/estrutura",
);

export default function EstruturaPage() {
  return (
    <>
      <PageHero n="01" kicker="Estrutura" title="2.500 m²." accent="Ambiente por ambiente." intro={`Tudo o que você encontra na ${zeroum.nomeCurto}, aberto 24 horas.`} />
      <section className="bg-black pb-24">
        <div className="container-site">
          <Media slot="estrutura-drone" priority sizes="(min-width:1440px) 1392px, 100vw" />
          <ol className="mt-20 space-y-20 md:space-y-28">
            {ambientes.map((a, i) => (
              <li key={a.id} id={a.id} className="grid scroll-mt-28 gap-8 md:grid-cols-12 md:items-center">
                <div className={`md:col-span-7 ${i % 2 ? "md:order-2 md:col-start-6" : ""}`}>
                  <Media slot={a.foto} sizes="(min-width:768px) 58vw, 100vw" />
                </div>
                <div className={`md:col-span-4 ${i % 2 ? "md:order-1 md:col-start-1" : "md:col-start-9"}`}>
                  <p className="label text-red-bright">{String(i + 1).padStart(2, "0")}</p>
                  <h2 className="display mt-3 text-[clamp(2.5rem,5vw,4.5rem)]">{a.nome}</h2>
                  <p className="mt-4 text-lg">{a.resumo}</p>
                  <p className="mt-4 text-gray-300">{a.detalhe.replace(/\s*TODO:.*$/, "")}</p>
                  {(a.detalhe.includes("TODO") || !a.confirmado) && (
                    <p className="mt-4">
                      <Todo>{a.confirmado ? a.detalhe.split("TODO:")[1]?.trim() : "confirmar se este ambiente existe"}</Todo>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <CtaFinal />
    </>
  );
}
