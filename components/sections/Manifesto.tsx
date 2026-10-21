'use client';

import { Fragment, useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { mq } from '@/lib/animations';
import { MediaKey } from '@/data/media.generated';
import { Media } from '@/components/ui/Media';
import { site } from '@/data/site';

type Token = { w: string; italic?: boolean } | { img: MediaKey; alt: string };

const w = (text: string, italic = false): Token[] => text.split(' ').map((word) => ({ w: word, italic }));

const tokens: Token[] = [
  ...w('Coisas que nós achamos'), ...w('chique.', true),
  { img: 'detalhe-brinco-gota', alt: 'Brinco gota cravejado' },
  ...w('Um brilho que não pede licença, um tom que exala'),
  { img: 'aneis-coquetel', alt: 'Anéis coquetel coloridos' },
  ...w('elegância.', true),
  ...w('Peças que acompanham todos os dias'),
  { img: 'editorial-colar-gota', alt: 'Modelo com colar gota' },
  ...w('e brilham ainda mais nos'), ...w('grandes dias.', true),
  ...w('Porque o verdadeiro luxo'),
  { img: 'loja-perolas-busto', alt: 'Colares de pérolas em busto de veludo' },
  ...w('mora nos'), ...w('detalhes', true), ...w('— e em quem os veste.'),
];

/** Manifesto: revelação palavra por palavra ligada ao scroll (0.15 → 1), com fotos redondas que surgem entre as palavras. */
export function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(mq.motion, () => {
        const words = gsap.utils.toArray<HTMLElement>('.mf-word', root.current);
        const imgs = gsap.utils.toArray<HTMLElement>('.mf-img', root.current);
        gsap.set(words, { opacity: 0.15 });
        gsap.set(imgs, { scale: 0 });
        const tl = gsap.timeline({ scrollTrigger: { trigger: '.mf-text', start: 'top 80%', end: 'bottom 45%', scrub: true } });
        root.current!.querySelectorAll<HTMLElement>('.mf-token').forEach((t, i) => {
          if (t.classList.contains('mf-word')) tl.to(t, { opacity: 1, duration: 1, ease: 'none' }, i * 0.5);
          else tl.to(t, { scale: 1, duration: 1.2, ease: 'back.out(2.2)' }, i * 0.5);
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-label="Manifesto" className="relative px-4 py-[14svh] md:px-8 md:py-[18svh]">
      <p className="eyebrow mb-10 text-center text-gold-deep">Manifesto</p>
      <p className="mf-text mx-auto max-w-[1200px] text-center font-serif text-[2.4rem] leading-[1.08] sm:text-[3rem] md:text-[clamp(2rem,5.2vw,5rem)] md:leading-[1.12] tracking-[-0.01em]">
        {tokens.map((t, i) => (
          <Fragment key={i}>
            {'w' in t ? (
              <span className={`mf-token mf-word inline-block ${t.italic ? 'serif-italic text-gold-deep' : ''}`}>{t.w}</span>
            ) : (
              <span className="mf-token mf-img relative mx-[0.1em] inline-block h-[0.82em] w-[1.5em] translate-y-[0.1em] overflow-hidden rounded-full align-baseline">
                <Media k={t.img} alt={t.alt} fill sizes="120px" className="object-cover" />
              </span>
            )}{' '}
          </Fragment>
        ))}
      </p>
      <p className="eyebrow mt-12 flex items-center justify-center gap-3 text-ink/55">
        <span className="h-px w-8 bg-gold" aria-hidden /> VALUT · desde {site.since} <span className="h-px w-8 bg-gold" aria-hidden />
      </p>
    </section>
  );
}
