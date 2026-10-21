'use client';

import { useRef } from 'react';
import { about, phrases, site } from '@/data/site';
import { useParallax } from '@/lib/animations';
import { Media } from '@/components/ui/Media';
import { PageHeader } from '@/components/ui/PageHeader';
import { PillLink } from '@/components/ui/Buttons';
import { RevealImage, RevealText } from '@/components/ui/Reveal';
import { LogoSymbol } from '@/components/ui/Logo';

const facts = [
  { n: `Desde ${site.since}`, l: 'empresa familiar' },
  { n: site.instagram.followers, l: `seguidores em ${site.instagram.handle}` },
  { n: '1 ano', l: 'de garantia em todas as peças' },
  { n: 'Brasil', l: 'envio rápido para todo o país' },
];

export function AboutView() {
  const par = useRef<HTMLDivElement>(null);
  const par2 = useRef<HTMLDivElement>(null);
  useParallax(par, 8);
  useParallax(par2, 12);

  return (
    <>
      <PageHeader
        eyebrow="Sobre a VALUT"
        title={
          <>
            Semijoia que <span className="serif-italic">encanta.</span>
          </>
        }
      />

      <section className="mx-auto grid max-w-[1600px] gap-10 px-5 pb-24 md:px-8 lg:grid-cols-12">
        <RevealImage immediate className="relative aspect-[4/5] rounded-[var(--radius-card)] lg:col-span-6">
          <div data-reveal-media className="absolute inset-0">
            <div ref={par} className="absolute inset-[-10%]">
              <Media k="loja-letreiro" alt="Letreiro dourado VALUT com o símbolo de folhas" fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            </div>
          </div>
        </RevealImage>
        <div className="flex flex-col justify-end lg:col-span-5 lg:col-start-8">
          <LogoSymbol className="h-14 w-14 text-gold" aria-hidden />
          <RevealText as="p" className="mt-8 font-serif text-[clamp(1.8rem,3vw,2.8rem)] leading-tight">
            {phrases.chic}. {phrases.elegance}. Para todos os dias — e para os grandes dias.
          </RevealText>
          <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-ink/75">{about.intro}</p>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink/75">{about.trends}</p>
        </div>
      </section>

      <section className="bg-ink px-5 py-24 text-ivory md:px-8">
        <ul className="mx-auto grid max-w-[1600px] gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((f) => (
            <li key={f.l} className="border-t border-ivory/20 pt-6">
              <p className="font-serif text-[clamp(3rem,6vw,5.5rem)] leading-none text-gold">{f.n}</p>
              <p className="eyebrow mt-5 text-ivory/70">{f.l}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto grid max-w-[1600px] items-center gap-10 px-5 py-28 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow text-gold-deep">A loja física</p>
          <RevealText className="mt-4 font-serif text-[length:var(--text-title)] leading-[0.95]">
            Veludo, mármore e <span className="serif-italic">luz dourada</span>
          </RevealText>
          <p className="mt-6 max-w-md text-[15px] text-ink/70">
            {site.store.venue} — {site.store.street}, {site.store.district}, {site.store.city}/{site.store.state}.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <PillLink href="/contato" label="Como chegar" />
            <PillLink href="/colecao" label="Ver coleção" variant="outline" />
          </div>
        </div>
        <RevealImage className="relative aspect-[4/5] rounded-[var(--radius-card)] lg:col-span-6 lg:col-start-7">
          <div data-reveal-media className="absolute inset-0">
            <div ref={par2} className="absolute inset-[-12%]">
              <Media k="loja-interior" alt="Interior da loja VALUT com bustos azul-petróleo e lustre" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            </div>
          </div>
        </RevealImage>
      </section>
    </>
  );
}
