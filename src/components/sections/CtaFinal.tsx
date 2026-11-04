import Link from "next/link";
import { zeroum } from "@/content/zeroum";
import { Media } from "@/components/ui/Media";
import { WA_AULA } from "@/lib/whatsapp";

/** 11 · CTA FINAL — card com borda entalhada (clip-path) + painel vermelho de números. */
export function CtaFinal() {
  const numeros = [
    { v: "24h", l: "aberta" },
    { v: "2.500", l: "m² de estrutura" },
    { v: String(zeroum.maquinas), l: `máquinas de ${zeroum.marcas} marcas` },
  ];
  return (
    <section aria-labelledby="cta-title" className="relative z-10 bg-black py-12 md:py-20">
      <div className="container-site grid gap-3 lg:grid-cols-12">
        <div
          className="relative overflow-hidden rounded-[var(--radius-photo)] lg:col-span-8"
          style={{ clipPath: "polygon(0 0, calc(100% - 64px) 0, 100% 64px, 100% 100%, 0 100%)" }}
        >
          <Media slot="cta" rounded={false} keepRatio={false} className="absolute inset-0 h-full w-full" sizes="(min-width:1024px) 66vw, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/10" aria-hidden="true" />
          <div className="relative flex min-h-[460px] flex-col justify-end p-6 md:p-12">
            <h2 id="cta-title" className="display max-w-3xl text-[clamp(3rem,7vw,6.5rem)]">
              Sua primeira aula é por nossa conta.
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/aula-experimental" className="btn btn-red">
                Agendar aula experimental <span className="btn-arrow" aria-hidden="true">→</span>
              </Link>
              <a href={WA_AULA} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                Chamar no WhatsApp
              </a>
            </div>
          </div>
        </div>
        <ul className="grid rounded-[var(--radius-photo)] bg-red p-6 text-white sm:grid-cols-3 lg:col-span-4 lg:grid-cols-1 lg:p-10" aria-label={`${zeroum.nomeCurto} em números`}>
          {numeros.map((n, i) => (
            <li key={n.l} className={`flex flex-col justify-center py-6 ${i ? "border-t border-white/30 sm:border-l sm:border-t-0 sm:pl-6 lg:border-l-0 lg:border-t lg:pl-0" : ""}`}>
              <span className="display text-[clamp(3.5rem,6vw,5.5rem)] leading-none">{n.v}</span>
              <span className="label mt-2 text-white">{n.l}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
