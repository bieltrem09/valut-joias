import { dias, movimento } from "@/content/zeroum";
import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { Horarios24 } from "@/components/sections/Horarios24";
import { Media } from "@/components/ui/Media";
import { CtaFinal } from "@/components/sections/CtaFinal";

export const metadata = pageMeta(
  "Horários · aberta 24 horas",
  "A Zero Um CT funciona 24 horas em Americana/SP. Veja os professores no salão por turno e os horários de avaliação física.",
  "/horarios",
);

export default function HorariosPage() {
  const temMovimento = Object.keys(movimento).length > 0;
  return (
    <>
      <PageHero n="01" kicker="Horários" title="Aberta" accent="24 horas." intro="Madrugada, manhã, tarde ou noite. Confira quem está no salão em cada turno." />
      <Horarios24 full label="02" />
      <section className="bg-black pb-24">
        <div className="container-site">
          <div className="relative">
            <Media slot="madrugada" sizes="(min-width:1440px) 1392px, 100vw" />
            <p className="display absolute bottom-6 left-6 text-[clamp(2rem,5vw,4.5rem)] md:bottom-10 md:left-10">
              03:00.
              <br />
              <span className="text-red">Porta aberta.</span>
            </p>
          </div>
          {/* Mapa de calor "melhor horário pra treinar vazio": oculto até o dono fornecer os dados reais (src/content/zeroum.ts → movimento). */}
          {temMovimento && (
            <div className="mt-20">
              <h2 className="display text-[clamp(2.25rem,4vw,3.5rem)]">Melhor horário pra treinar vazio</h2>
              <div className="mt-8 overflow-hidden">
                <table className="w-full table-fixed border-separate border-spacing-[3px] text-[0px]">
                  <caption className="label mb-4 text-left text-gray-300">Movimento médio por hora (0 = vazio, 4 = cheio)</caption>
                  <thead>
                    <tr>
                      <th className="w-10" />
                      {Array.from({ length: 24 }, (_, h) => (
                        <th key={h} scope="col" className="label text-[10px] font-normal text-gray-300">
                          {h % 3 === 0 ? String(h).padStart(2, "0") : <span className="sr-only">{h}h</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dias.map((d) => (
                      <tr key={d}>
                        <th scope="row" className="label text-left text-[11px] font-normal text-gray-300">{d}</th>
                        {(movimento[d] ?? Array(24).fill(0)).map((v, h) => (
                          <td key={h} className="h-6 rounded-[4px]" style={{ background: `rgb(227 24 45 / ${0.08 + v * 0.22})` }}>
                            <span className="sr-only">{d} {h}h: nível {v}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
      <CtaFinal />
    </>
  );
}
