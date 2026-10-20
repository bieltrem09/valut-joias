'use client';

import { useRef } from 'react';
import { categories } from '@/data/categories';
import { gsap, useGSAP } from '@/lib/gsap';
import { mq } from '@/lib/animations';
import { Media } from '@/components/ui/Media';
import { RevealText } from '@/components/ui/Reveal';
import { TransitionLink } from '@/components/ui/TransitionLink';
import { IconArrow } from '@/components/ui/Icons';

/**
 * Categorias (ref. Sparkle): cards grandes arredondados com sombra difusa.
 * Desktop: scroll horizontal pinado. Mobile: carrossel com scroll-snap nativo.
 */
export function Categories() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${mq.desktop} and ${mq.motion}`, () => {
        const distance = () => track.current!.scrollWidth - window.innerWidth;
        const tween = gsap.to(track.current, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
        gsap.utils.toArray<HTMLElement>('.cat-img', root.current).forEach((img) => {
          gsap.fromTo(img, { xPercent: -8 }, { xPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
        });
        gsap.to('.cat-progress', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${distance()}`, scrub: true } });
      });
      mm.add(mq.motion, () => {
        gsap.from('.cat-card', { y: 80, autoAlpha: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: root.current, start: 'top 75%', once: true } });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="cat-title" className="relative overflow-hidden bg-ivory py-20 lg:flex lg:h-[100svh] lg:flex-col lg:justify-center lg:py-0">
      <div className="mx-auto flex w-full max-w-[1600px] items-end justify-between gap-6 px-5 md:px-8">
        <div>
          <p className="eyebrow text-gold-deep">Categorias</p>
          <RevealText as="h2" id="cat-title" className="mt-3 font-serif text-[length:var(--text-title)] leading-[0.95]">
            Encontre a sua <span className="serif-italic">peça</span>
          </RevealText>
        </div>
        <div className="hidden w-40 lg:block" aria-hidden>
          <div className="h-px bg-ink/15">
            <div className="cat-progress h-px origin-left scale-x-0 bg-ink" />
          </div>
        </div>
      </div>

      <div
        ref={track}
        className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-8 md:px-8 lg:mt-14 lg:w-max lg:snap-none lg:gap-7 lg:overflow-visible lg:pr-[8vw] lg:pl-[max(2rem,calc((100vw-1600px)/2+2rem))]"
      >
        {categories.map((c, i) => (
          <TransitionLink
            key={c.slug}
            href={`/colecao?categoria=${c.slug}`}
            transitionLabel={c.name}
            data-cursor="Ver"
            className="cat-card group relative block aspect-[3/4] w-[74vw] shrink-0 snap-start overflow-hidden rounded-[var(--radius-card)] bg-marble shadow-[0_30px_60px_-30px_rgba(14,13,11,0.35)] sm:w-[44vw] lg:aspect-[4/5] lg:h-[58svh] lg:w-auto"
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="cat-img absolute inset-[-8%]">
                <Media k={c.image} alt={c.alt} fill sizes="(min-width:1024px) 34vw, 74vw" className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-expo)] group-hover:scale-[1.08]" />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/0 to-ink/0" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 text-ivory lg:p-7">
              <div>
                <p className="eyebrow text-ivory/75">
                  Categoria <span className="tabular-nums">0{i + 1}</span>
                </p>
                <h3 className="mt-1 font-serif text-[clamp(2rem,3.2vw,3rem)] leading-none">{c.name}</h3>
                <p className="mt-3 flex items-center gap-2 overflow-hidden text-sm">
                  <span className="translate-y-full transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-y-0 group-focus-visible:translate-y-0 max-lg:translate-y-0">Ver peças</span>
                  <IconArrow width={16} className="-translate-x-4 opacity-0 transition-all duration-500 ease-[var(--ease-expo)] group-hover:translate-x-0 group-hover:opacity-100 max-lg:translate-x-0 max-lg:opacity-100" />
                </p>
              </div>
            </div>
          </TransitionLink>
        ))}
      </div>
    </section>
  );
}
