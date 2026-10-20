'use client';

import { RefObject } from 'react';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';
import { onReveal } from '@/lib/reveal';
import { dur, ease, mq, stagger as st } from './tokens';

type Options = {
  /** Atraso em segundos. */
  delay?: number;
  /** Início do ScrollTrigger. Ignorado quando `immediate`. */
  start?: string;
  /** Anima na montagem, sem esperar o scroll (ex.: títulos do topo da página). */
  immediate?: boolean;
  stagger?: number;
  duration?: number;
  type?: 'lines' | 'words';
};

/**
 * Título que entra por linhas mascaradas: cada linha sobe de yPercent 110
 * dentro de um overflow:clip. Re-divide sozinho quando a fonte carrega ou o
 * container muda de largura (autoSplit). Reduced motion: fade curto.
 * `immediate`: anima na entrada da página, sincronizado com a saída da cortina.
 */
export function useSplitReveal(ref: RefObject<HTMLElement | null>, opts: Options = {}) {
  const { delay = 0, start = 'top 85%', immediate = false, stagger = st.items, duration = dur.lg, type = 'lines' } = opts;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      const trigger = immediate ? undefined : { trigger: el, start, once: true };

      mm.add({ motion: mq.motion, reduced: mq.reduced }, (ctx) => {
        gsap.set(el, { visibility: 'visible' });
        if (ctx.conditions?.reduced) {
          const tw = gsap.from(el, { autoAlpha: 0, duration: dur.sm, delay, scrollTrigger: trigger, paused: immediate });
          return immediate ? onReveal(() => tw.play()) : undefined;
        }
        let off = () => {};
        const split = SplitText.create(el, {
          type: type === 'words' ? 'lines,words' : 'lines',
          mask: type,
          linesClass: 'split-line',
          autoSplit: true,
          onSplit(self) {
            const targets = type === 'words' ? self.words : self.lines;
            const tw = gsap.from(targets, { yPercent: 110, duration, stagger, delay, ease: ease.out, scrollTrigger: trigger, paused: immediate });
            // no topo da página, espera a cortina/preloader começar a sair
            if (immediate) {
              off();
              off = onReveal(() => tw.play());
            }
            return tw;
          },
        });
        return () => {
          off();
          split.revert();
        };
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [] },
  );
}
