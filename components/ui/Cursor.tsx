'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';

/**
 * Cursor customizado (só desktop com ponteiro fino): ponto dourado de 10px com
 * mix-blend-mode: difference. Sobre [data-cursor] cresce para 80px e mostra o
 * texto do atributo ("Ver", "Arraste"…).
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!enabled || !dot.current) return;
    const el = dot.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const xTo = gsap.quickTo(el, 'x', { duration: reduced ? 0 : 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: reduced ? 0 : 0.35, ease: 'power3.out' });
    let current = '';
    let visible = false;

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (!visible) {
        visible = true;
        gsap.set(el, { x: e.clientX, y: e.clientY });
        gsap.to(el, { autoAlpha: 1, duration: 0.3 });
      }
      xTo(e.clientX);
      yTo(e.clientY);
      const target = (e.target as Element | null)?.closest?.('[data-cursor]');
      const next = target?.getAttribute('data-cursor') ?? '';
      const interactive = !next && (e.target as Element | null)?.closest?.('a, button, [role="button"], input, select, textarea, label');
      const mode = next || (interactive ? '·' : '');
      if (mode !== current) {
        current = mode;
        setLabel(next);
        gsap.to(el, {
          width: next ? 80 : interactive ? 36 : 10,
          height: next ? 80 : interactive ? 36 : 10,
          duration: 0.45,
          ease: 'expo.out',
          overwrite: 'auto',
        });
      }
    };
    const leave = () => {
      visible = false;
      gsap.to(el, { autoAlpha: 0, duration: 0.2 });
    };
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div
      ref={dot}
      aria-hidden
      className="custom-cursor pointer-events-none fixed top-0 left-0 z-[100] flex h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold opacity-0 mix-blend-difference"
    >
      <span className="text-[12px] font-medium tracking-wide text-ink transition-opacity duration-200" style={{ opacity: label ? 1 : 0 }}>
        {label}
      </span>
    </div>
  );
}
