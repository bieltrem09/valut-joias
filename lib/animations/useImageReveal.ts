'use client';

import { RefObject } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { onReveal } from '@/lib/reveal';
import { dur, ease, mq } from './tokens';

/**
 * Revelação padrão de imagem: clip-path inset(100% 0 0 0) → inset(0)
 * + a mídia interna (primeiro filho com [data-reveal-media]) vai de scale 1.15 → 1.
 */
export function useImageReveal(
  ref: RefObject<HTMLElement | null>,
  { delay = 0, start = 'top 88%', immediate = false, from = 'bottom' as 'bottom' | 'top' | 'left' } = {},
) {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const media = el.querySelector('[data-reveal-media]');
      const mm = gsap.matchMedia();
      const scrollTrigger = immediate ? undefined : { trigger: el, start, once: true };
      const hidden = from === 'top' ? 'inset(0% 0% 100% 0%)' : from === 'left' ? 'inset(0% 100% 0% 0%)' : 'inset(100% 0% 0% 0%)';

      mm.add({ motion: mq.motion, reduced: mq.reduced }, (ctx) => {
        if (ctx.conditions?.reduced) {
          const tw = gsap.from(el, { autoAlpha: 0, duration: dur.sm, delay, scrollTrigger, paused: immediate });
          return immediate ? onReveal(() => tw.play()) : undefined;
        }
        const tl = gsap.timeline({ delay, scrollTrigger, paused: immediate });
        tl.fromTo(el, { clipPath: hidden }, { clipPath: 'inset(0% 0% 0% 0%)', duration: dur.lg, ease: 'curtain' });
        if (media) tl.fromTo(media, { scale: 1.15 }, { scale: 1, duration: dur.xl, ease: ease.out }, 0);
        if (immediate) return onReveal(() => tl.play());
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
}
