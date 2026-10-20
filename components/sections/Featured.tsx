'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { products, Tag, tagLabels } from '@/data/products';
import { Flip, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { mq } from '@/lib/animations';
import { cn } from '@/lib/format';
import { PillLink } from '@/components/ui/Buttons';
import { RevealText } from '@/components/ui/Reveal';
import { ProductCard } from '@/components/shop/ProductCard';
import { FilterPills } from '@/components/shop/FilterPills';

const filters: Tag[] = ['novidade', 'mais-vendido', 'oferta'];

/** Produtos em destaque: grade 4/2 colunas, entrada em stagger por linha e troca de filtro animada com GSAP Flip. */
export function Featured() {
  const root = useRef<HTMLElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const [tag, setTag] = useState<Tag>('novidade');
  const visible = (t: Tag) => products.filter((p) => p.tags.includes(t)).slice(0, 8);
  const shown = new Set(visible(tag).map((p) => p.slug));
  // ordem: os visíveis primeiro, para a grade se reorganizar
  const ordered = [...products].sort((a, b) => Number(shown.has(b.slug)) - Number(shown.has(a.slug)));

  const change = (t: Tag) => {
    if (t === tag) return;
    flipState.current = Flip.getState(root.current!.querySelectorAll('.feat-item'));
    setTag(t);
  };

  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state) return;
    flipState.current = null;
    const reduced = window.matchMedia(mq.reduced).matches;
    Flip.from(state, {
      targets: root.current!.querySelectorAll('.feat-item'),
      duration: reduced ? 0 : 0.8,
      ease: 'expo.inOut',
      absolute: true,
      stagger: 0.03,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.6, delay: 0.2 }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.92, duration: 0.35 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }, [tag]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(mq.motion, () => {
        gsap.set('.feat-item:not(.hidden)', { autoAlpha: 0, y: 60 });
        ScrollTrigger.batch('.feat-item:not(.hidden)', {
          start: 'top 88%',
          once: true,
          onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: 'expo.out', overwrite: true }),
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="feat-title" className="relative bg-ivory px-5 py-24 md:px-8 lg:py-32">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow text-gold-deep">Em destaque</p>
            <RevealText as="h2" id="feat-title" className="mt-3 font-serif text-[length:var(--text-title)] leading-[0.95]">
              As queridinhas <span className="serif-italic">da vez</span>
            </RevealText>
          </div>
          <FilterPills label="Filtrar destaques" options={filters.map((f) => ({ value: f, label: tagLabels[f] }))} value={tag} onChange={change} />
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
          {ordered.map((p) => (
            <li key={p.slug} className={cn('feat-item', !shown.has(p.slug) && 'hidden')} data-flip-id={p.slug}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>

        <div className="mt-16 flex justify-center">
          <PillLink href="/colecao" label="Ver todas as peças" variant="outline" />
        </div>
      </div>
    </section>
  );
}
