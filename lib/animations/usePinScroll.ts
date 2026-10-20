'use client';

import { RefObject } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { mq } from './tokens';

type Build = (tl: gsap.core.Timeline, el: HTMLElement) => void;

/**
 * Seção pinada com timeline em scrub. Só roda no desktop e sem reduced motion
 * (no mobile/reduced o conteúdo fica estático e acessível).
 */
export function usePinScroll(
  ref: RefObject<HTMLElement | null>,
  build: Build,
  { end = '+=100%', media = `${mq.desktop} and ${mq.motion}`, pinSpacing = true } = {},
) {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(media, () => {
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: el, start: 'top top', end, pin: true, scrub: true, pinSpacing, invalidateOnRefresh: true },
        });
        build(tl, el);
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
}
