'use client';

import { RefObject } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { mq } from './tokens';

/** Parallax sutil ligado ao scroll (yPercent ±amount, scrub). Desligado em reduced motion. */
export function useParallax(ref: RefObject<HTMLElement | null>, amount = 10, trigger?: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(mq.motion, () => {
        gsap.fromTo(
          el,
          { yPercent: -amount },
          {
            yPercent: amount,
            ease: 'none',
            scrollTrigger: { trigger: trigger?.current ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      });
      return () => mm.revert();
    },
    { dependencies: [amount] },
  );
}
