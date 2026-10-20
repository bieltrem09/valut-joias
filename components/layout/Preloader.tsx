'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, prefersReducedMotion } from '@/lib/gsap';
import { setScrollLock } from '@/lib/lenis';
import { isCovered, markPreloaded, setCovered } from '@/lib/reveal';
import { symbolPaths, wordmarkPaths } from '@/components/ui/logo-paths';

/**
 * Preloader (só na 1ª visita da sessão, ≤ 2,4s):
 * o símbolo de folhas desenha o próprio traço e preenche em dourado, contador
 * 000 → 100, o wordmark sobe letra a letra e se divide para cima, e a cortina
 * sobe (clip-path) revelando o hero — cuja entrada começa durante a saída.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isCovered()) {
      setDone(true);
      return;
    }
    const el = root.current!;
    setScrollLock('preloader', true);
    window.scrollTo(0, 0);
    const finish = () => {
      markPreloaded();
      setScrollLock('preloader', false);
      setDone(true);
    };

    if (prefersReducedMotion()) {
      const tl = gsap.timeline({ onComplete: finish });
      tl.set(el.querySelectorAll('.pl-blade'), { strokeDashoffset: 0, fillOpacity: 1 })
        .set(el.querySelectorAll('.pl-letter'), { y: 0 })
        .to(el, { autoAlpha: 0, duration: 0.4, delay: 0.5 })
        .call(() => setCovered(false), [], 0.5);
      return () => {
        tl.kill();
      };
    }

    const counter = { v: 0 };
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(el.querySelectorAll('.pl-blade'), { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.06 }, 0)
      .to(counter, { v: 100, duration: 1.75, ease: 'power2.inOut', onUpdate: () => count.current && (count.current.textContent = String(Math.round(counter.v)).padStart(3, '0')) }, 0)
      .to(el.querySelectorAll('.pl-blade'), { fillOpacity: 1, strokeOpacity: 0, duration: 0.5, ease: 'power2.out' }, 0.9)
      .fromTo(el.querySelectorAll('.pl-letter'), { y: 140 }, { y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05 }, 0.95)
      .to(el.querySelectorAll('.pl-letter'), { y: -140, duration: 0.45, ease: 'power3.in', stagger: 0.035 }, 1.6)
      .to(el.querySelector('.pl-symbol'), { yPercent: -30, autoAlpha: 0, duration: 0.45, ease: 'power3.in' }, 1.62)
      .to(el.querySelector('.pl-count'), { autoAlpha: 0, duration: 0.3 }, 1.7)
      .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.62, ease: 'curtain' }, 1.78)
      .call(() => setCovered(false), [], 1.82);
    return () => {
      tl.kill();
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={root}
      className="preloader fixed inset-0 z-[120] flex items-center justify-center bg-ink text-gold"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      role="status"
      aria-label="Carregando VALUT Semijoias"
    >
      <div className="flex flex-col items-center gap-8">
        <svg viewBox="0 0 200 200" className="pl-symbol h-28 w-28 md:h-36 md:w-36" aria-hidden>
          {symbolPaths.map((d, i) => (
            <path
              key={i}
              d={d}
              pathLength={1}
              className="pl-blade"
              fill="currentColor"
              fillOpacity={0}
              stroke="currentColor"
              strokeWidth={1.2}
              strokeDasharray={1}
              strokeDashoffset={1}
            />
          ))}
        </svg>
        <svg viewBox="0 10 454 124" className="h-10 w-auto md:h-14" aria-hidden>
          <defs>
            <clipPath id="pl-clip">
              <rect x="-10" y="12" width="474" height="118" />
            </clipPath>
          </defs>
          <g clipPath="url(#pl-clip)" fill="currentColor">
            {wordmarkPaths.map((d, i) => (
              <path key={i} d={d} className="pl-letter" transform="translate(0 140)" />
            ))}
          </g>
        </svg>
      </div>
      <span ref={count} className="pl-count absolute right-6 bottom-6 font-sans text-sm font-light tracking-[0.3em] text-ivory/70 tabular-nums md:right-10 md:bottom-10">
        000
      </span>
      <span className="pl-count eyebrow absolute bottom-6 left-6 text-ivory/50 md:bottom-10 md:left-10">Semijoia que encanta</span>
    </div>
  );
}
