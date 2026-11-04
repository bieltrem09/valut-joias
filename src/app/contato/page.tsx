import { zeroum } from "@/content/zeroum";
import { pageMeta } from "@/lib/seo";
import { WA_GERAL } from "@/lib/whatsapp";
import { PageHero } from "@/components/sections/PageHero";
import { Localizacao } from "@/components/sections/Localizacao";
import { Faq } from "@/components/sections/Faq";

export const metadata = pageMeta(
  "Contato e localização",
  "Fale com a Zero Um CT Americana pelo WhatsApp (19) 99620-9541 ou Instagram @zeroumct.americana. Veja como chegar.",
  "/contato",
);

const canais = [
  { k: "WhatsApp", v: zeroum.whatsapp, href: WA_GERAL, cta: "Chamar agora" },
  { k: "Instagram", v: zeroum.instagram, href: zeroum.instagramLink, cta: "Seguir" },
  { k: "Como chegar", v: "Google Maps", href: zeroum.mapa, cta: "Traçar rota" },
];

export default function ContatoPage() {
  return (
    <>
      <PageHero n="01" kicker="Contato" title="Fala com" accent="a gente.">
        <ul className="mt-12 grid gap-3 md:grid-cols-3">
          {canais.map((c) => (
            <li key={c.k}>
              <a href={c.href} target="_blank" rel="noopener noreferrer" className="group flex h-full flex-col justify-between gap-10 rounded-[var(--radius-card)] bg-carbon p-6 transition-colors duration-200 hover:bg-steel md:p-8">
                <span className="label text-gray-300">{c.k}</span>
                <span>
                  <span className="title block text-2xl tnum md:text-3xl">{c.v}</span>
                  <span className="mt-4 inline-flex items-center gap-3 font-semibold">
                    {c.cta}
                    <span className="btn-circle !size-10" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </PageHero>
      <Localizacao label="02" />
      <Faq label="03" />
    </>
  );
}
