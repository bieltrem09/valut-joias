'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap';
import { scrollToTop, setScrollLock } from '@/lib/lenis';
import { setCovered } from '@/lib/reveal';

type NavigateOptions = { label?: string; viewTransition?: boolean };
type Ctx = { navigate: (href: string, opts?: NavigateOptions) => void; busy: boolean };

const TransitionContext = createContext<Ctx>({ navigate: () => {}, busy: false });
export const usePageTransition = () => useContext(TransitionContext);

const labelFor = (pathname: string) => {
  if (pathname === '/') return 'Início';
  if (pathname.startsWith('/colecao')) return 'Coleção';
  if (pathname.startsWith('/produto')) return 'Peça';
  if (pathname.startsWith('/sobre')) return 'Sobre';
  if (pathname.startsWith('/atacado')) return 'Atacado';
  if (pathname.startsWith('/contato')) return 'Contato';
  if (pathname.startsWith('/favoritos')) return 'Favoritos';
  return 'VALUT';
};

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/**
 * Transições entre páginas:
 * - padrão: cortina dourada → ivory de baixo para cima, com o nome da página em serif;
 * - card → produto: View Transitions API (elemento compartilhado), com fallback para a cortina;
 * - voltar/avançar do navegador: sem cortina, o navegador restaura o scroll.
 * Ao chegar: scroll ao topo, ScrollTrigger.refresh() (as instâncias antigas já
 * foram mortas pelos cleanups do useGSAP ao desmontar a página).
 */
export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState('');
  const arrived = useRef<(() => void) | null>(null);
  const gold = useRef<HTMLDivElement>(null);
  const ivory = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    arrived.current?.();
    arrived.current = null;
    // garante triggers corretos também após voltar/avançar
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  const waitArrival = () => new Promise<void>((resolve) => (arrived.current = resolve));

  const navigate = useCallback(
    async (href: string, opts: NavigateOptions = {}) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) {
        window.location.href = href;
        return;
      }
      if (url.pathname === window.location.pathname) {
        router.push(href, { scroll: false });
        return;
      }
      if (busy) return;
      setBusy(true);

      try {
        if (prefersReducedMotion()) {
          const done = waitArrival();
          router.push(href);
          await done;
          scrollToTop();
          return;
        }

        const doc = document as Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> } };
        if (opts.viewTransition && doc.startViewTransition) {
          const vt = doc.startViewTransition(async () => {
            const done = waitArrival();
            router.push(href, { scroll: false });
            await done;
            await nextFrame();
            scrollToTop();
          });
          await vt.finished.catch(() => {});
          ScrollTrigger.refresh();
          return;
        }

        setLabel(opts.label ?? labelFor(url.pathname));
        setCovered(true);
        setScrollLock('transition', true);
        const layers = [gold.current, ivory.current];
        await gsap
          .timeline()
          .set(layers, { clipPath: 'inset(100% 0% 0% 0%)', visibility: 'visible' })
          .to(layers, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'curtain', stagger: 0.12 })
          .fromTo(text.current, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: 'expo.out' }, 0.45)
          .then();

        const done = waitArrival();
        router.push(href, { scroll: false });
        await done;
        await nextFrame();
        scrollToTop();
        ScrollTrigger.refresh();
        setScrollLock('transition', false);

        const out = gsap.timeline();
        out
          .to(text.current, { yPercent: -110, duration: 0.5, ease: 'power3.in' })
          .to(layers.slice().reverse(), { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'curtain', stagger: 0.1 }, 0.25)
          .call(() => setCovered(false), [], 0.35)
          .set(layers, { visibility: 'hidden' });
        await out.then();
      } finally {
        setScrollLock('transition', false);
        setCovered(false);
        setBusy(false);
      }
    },
    [busy, router],
  );

  return (
    <TransitionContext.Provider value={{ navigate, busy }}>
      {children}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[90]">
        <div ref={gold} className="invisible absolute inset-0 bg-gold" />
        <div ref={ivory} className="invisible absolute inset-0 flex items-center justify-center bg-ivory">
          <span className="overflow-hidden">
            <span ref={text} className="serif-italic block text-[clamp(2.5rem,7vw,6rem)] leading-none text-ink">
              {label}
            </span>
          </span>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
