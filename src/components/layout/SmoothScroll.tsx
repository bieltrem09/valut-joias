"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Lenis dirigido pelo ticker do GSAP (um único loop) + ScrollTrigger.update a cada scroll.
 * Carregado sob demanda (idle) para não pesar no JS crítico. Desligado em reduced-motion.
 * Receita: web-animation-skills:gsap-web → references/scrolltrigger-lenis.md
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cleanup = () => {};
    let cancelled = false;
    const start = async () => {
      const [{ default: LenisCtor }, { gsap }, { ScrollTrigger }] = await Promise.all([import("lenis"), import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new LenisCtor({ lerp: 0.1, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      const update = (t: number) => lenis.raf(t * 1000);
      gsap.ticker.add(update);
      gsap.ticker.lagSmoothing(0);
      cleanup = () => {
        gsap.ticker.remove(update);
        lenis.destroy();
        window.__lenis = undefined;
      };
    };
    const id = "requestIdleCallback" in window ? window.requestIdleCallback(() => void start(), { timeout: 1500 }) : setTimeout(() => void start(), 200);
    return () => {
      cancelled = true;
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(id as number);
      cleanup();
    };
  }, []);

  useEffect(() => {
    window.__lenis?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
