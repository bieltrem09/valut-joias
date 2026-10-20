'use client';

import { useRef } from 'react';
import { getCollection } from '@/data/products';
import { phrases } from '@/data/site';
import { gsap, useGSAP } from '@/lib/gsap';
import { mq } from '@/lib/animations';
import { Media } from '@/components/ui/Media';
import { LazyVideo } from '@/components/ui/LazyVideo';
import { PillLink } from '@/components/ui/Buttons';
import { IconArrow } from '@/components/ui/Icons';
import { RevealImage, RevealText } from '@/components/ui/Reveal';
import { ProductCard } from '@/components/shop/ProductCard';

const IVORY = '#f4f1ea';
const INK = '#0e0d0b';
const RUBY_NIGHT = '#3d0912';

/**
 * Capítulo de cor Rubi Mood: a cor da página (--page-bg) é interpolada de
 * ivory para rubi escuro conforme a seção entra, e volta ao sair (scrub).
 * Texto sticky à esquerda; vídeo e foto empilhados com parallax diferente.
 */
export function RubiMood() {
  const root = useRef<HTMLElement>(null);
  const products = getCollection('rubi-mood');

  useGSAP(
    () => {
      const html = document.documentElement;
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add({ motion: mq.motion, reduced: mq.reduced }, (ctx) => {
        if (ctx.conditions?.reduced) {
          gsap.set(el, { backgroundColor: RUBY_NIGHT, color: IVORY });
          return;
        }
        gsap.fromTo(
          html,
          { '--page-bg': IVORY, '--page-fg': INK },
          { '--page-bg': RUBY_NIGHT, '--page-fg': IVORY, ease: 'none', scrollTrigger: { trigger: el, start: 'top 75%', end: 'top 25%', scrub: true } },
        );
        gsap.fromTo(
          html,
          { '--page-bg': RUBY_NIGHT, '--page-fg': IVORY },
          { '--page-bg': IVORY, '--page-fg': INK, ease: 'none', immediateRender: false, scrollTrigger: { trigger: el, start: 'bottom 55%', end: 'bottom 15%', scrub: true } },
        );
        gsap.fromTo('.rb-video', { yPercent: 8 }, { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.rb-media', start: 'top bottom', end: 'bottom top', scrub: true } });
        gsap.fromTo('.rb-photo', { yPercent: 18 }, { yPercent: -22, ease: 'none', scrollTrigger: { trigger: '.rb-media', start: 'top bottom', end: 'bottom top', scrub: true } });
        return () => gsap.set(html, { clearProps: '--page-bg,--page-fg' });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="rubi-mood" aria-labelledby="rubi-title" className="relative px-5 py-24 md:px-8 lg:py-36">
      <div className="mx-auto grid max-w-[1600px] gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
        <div className="lg:sticky lg:top-[18svh] lg:self-start">
          <p className="eyebrow text-[#e7b9c2]">Coleção · capítulo 02</p>
          <RevealText as="h2" id="rubi-title" className="mt-4 font-serif text-[clamp(3.5rem,9vw,9rem)] leading-[0.86]">
            Rubi <span className="serif-italic">Mood</span>
          </RevealText>
          <RevealText as="p" className="mt-8 max-w-md text-lg leading-relaxed opacity-85" delay={0.15}>
            {phrases.elegance}. Vermelho profundo, halo cravejado e um brilho que não pede licença — do coração ao bracelete.
          </RevealText>
          <div className="mt-10">
            <PillLink href="/colecao?colecao=rubi-mood" label="Ver Rubi Mood" variant="light" icon={<IconArrow width={16} />} transitionLabel="Rubi Mood" />
          </div>
        </div>

        <div className="rb-media relative grid grid-cols-12 items-start gap-4 lg:min-h-[120svh]">
          <div className="rb-video col-span-7 col-start-1 lg:col-span-6 lg:col-start-2">
            <RevealImage className="aspect-[9/16] rounded-[var(--radius-card)] bg-black/30">
              <div data-reveal-media className="h-full w-full">
                <LazyVideo name="video-rubi-mood" label="Vídeo: brincos coração rubi e bracelete cravejado, Rubi Mood" />
              </div>
            </RevealImage>
          </div>
          <div className="rb-photo col-span-6 col-start-7 mt-[30%] lg:col-span-5 lg:col-start-8 lg:mt-[45%]">
            <RevealImage className="relative aspect-[9/14] rounded-[var(--radius-card)]" delay={0.2}>
              <div data-reveal-media className="absolute inset-0">
                <Media k="conjunto-rubi-expositor" alt="Conjunto de colar e brincos rubi retangulares em expositor verde" fill sizes="(min-width:1024px) 22vw, 50vw" className="object-cover" />
              </div>
            </RevealImage>
            <p className="serif-italic mt-4 text-xl opacity-80">“{phrases.elegance}.”</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-24 max-w-[1600px]">
        <div className="flex items-end justify-between">
          <h3 className="font-serif text-3xl md:text-4xl">Peças da coleção</h3>
          <p className="eyebrow opacity-70">Arraste →</p>
        </div>
        <div className="no-scrollbar -mx-5 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 md:-mx-8 md:px-8" data-cursor="Arraste" tabIndex={0} role="region" aria-label="Carrossel de produtos Rubi Mood">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} tone="dark" className="w-[70vw] shrink-0 snap-start sm:w-[40vw] lg:w-[calc((100%-3*1.25rem)/4)]" sizes="(min-width:1024px) 22vw, 70vw" />
          ))}
        </div>
      </div>
    </section>
  );
}
