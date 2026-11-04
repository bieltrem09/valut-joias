import { eventos, zeroum } from "@/content/zeroum";
import { Media } from "@/components/ui/Media";
import { SectionLabel } from "@/components/ui/SectionHead";
import { PillLink } from "@/components/ui/Buttons";

/** 10 · COMUNIDADE / EVENTOS — grade editorial com os eventos reais do Instagram. */
export function Comunidade() {
  return (
    <section aria-labelledby="com-title" className="relative z-10 bg-black py-24 md:py-32">
      <div className="container-site">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel n="10">Comunidade</SectionLabel>
            <h2 id="com-title" className="display mt-4 text-section">
              Fora da série
              <br />
              também tem treino.
            </h2>
          </div>
          <PillLink href={zeroum.instagramLink} tone="white" external>
            Seguir {zeroum.instagram}
          </PillLink>
        </div>

        <ul className="mt-12 grid gap-4 md:grid-cols-12">
          {eventos.map((e, i) => (
            <li key={e.id} className={i === 0 ? "md:col-span-6 md:row-span-2" : i === 1 ? "md:col-span-6" : "md:col-span-3"}>
              <a href={e.link} target="_blank" rel="noopener noreferrer" className="group block">
                <div className="relative overflow-hidden rounded-[var(--radius-photo)]">
                  <Media
                    slot={e.foto}
                    rounded={false}
                    keepRatio={i !== 0}
                    className={`transition-transform duration-500 ease-[var(--ease-out)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.03] ${i === 0 ? "aspect-[4/5] md:aspect-auto md:h-full md:min-h-[560px]" : ""}`}
                    sizes="(min-width:768px) 50vw, 100vw"
                  />
                  <span className="label pill absolute left-3 top-3 bg-black/80 text-white">{e.data.startsWith("TODO") ? "Data a confirmar" : e.data}</span>
                </div>
                <h3 className="title mt-4 text-xl group-hover:text-red-bright">{e.titulo}</h3>
                <p className="mt-1 text-sm text-gray-300">{e.resumo}</p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
