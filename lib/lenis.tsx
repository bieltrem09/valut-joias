'use client';

import Lenis from 'lenis';
import { ReactNode, useEffect } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap';

let instance: Lenis | null = null;
export const getLenis = () => instance;

/** Scroll para o topo, com ou sem Lenis. */
export function scrollToTop(immediate = true) {
  if (instance) instance.scrollTo(0, { immediate, force: true });
  else window.scrollTo({ top: 0, behavior: immediate ? 'instant' : 'smooth' });
}

export function scrollToEl(target: string | HTMLElement, offset = 0) {
  if (instance) instance.scrollTo(target, { offset, duration: 1.4 });
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
  }
}

/**
 * Lenis sincronizado com o ScrollTrigger: o ticker do GSAP dirige o raf do
 * Lenis e cada scroll do Lenis atualiza o ScrollTrigger. Desligado em
 * prefers-reduced-motion (scroll nativo).
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lenis: Lenis | null = null;
    const tick = (time: number) => lenis?.raf(time * 1000);

    const start = () => {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, anchors: true });
      instance = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    };
    const stop = () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = instance = null;
    };
    const onChange = () => (media.matches ? stop() : !lenis && start());

    if (!media.matches) start();
    media.addEventListener('change', onChange);
    return () => {
      media.removeEventListener('change', onChange);
      stop();
    };
  }, []);

  return <>{children}</>;
}
