'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { mq } from '@/lib/animations';
import { Media } from '@/components/ui/Media';
import { PillLink } from '@/components/ui/Buttons';

/** 404 com a joia girando em 3D. */
export function NotFoundView() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(mq.motion, () => {
        gsap.set('.nf-jewel', { transformPerspective: 900 });
        gsap.to('.nf-jewel', { rotationY: 360, duration: 6, ease: 'none', repeat: -1 });
        gsap.to('.nf-float', { y: -18, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <section ref={root} className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pt-24 pb-16 text-center">
      <p aria-hidden className="font-display pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-[38vw] text-ink/[0.06] select-none">
        404
      </p>
      <div className="nf-float relative w-[min(60vw,300px)]">
        <div className="nf-jewel">
          <Media k="joia-rubi-recorte" alt="Brincos coração rubi girando" sizes="300px" className="h-auto w-full drop-shadow-[0_30px_30px_rgba(14,13,11,.25)]" />
        </div>
      </div>
      <h1 className="relative mt-10 font-serif text-[clamp(2.4rem,6vw,5rem)] leading-none">
        Essa peça <span className="serif-italic">se perdeu.</span>
      </h1>
      <p className="relative mt-4 text-ink/60">A página que você procura não existe ou mudou de lugar.</p>
      <div className="relative mt-8 flex flex-wrap justify-center gap-4">
        <PillLink href="/" label="Voltar ao início" />
        <PillLink href="/colecao" label="Ver coleção" variant="outline" />
      </div>
    </section>
  );
}
