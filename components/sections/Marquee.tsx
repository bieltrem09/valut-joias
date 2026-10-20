'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { mq } from '@/lib/animations';
import { IconSpark } from '@/components/ui/Icons';

const ITEMS = ['Semijoia que encanta', 'Atacado & Varejo', 'Enviamos para todo o Brasil'];

/** Faixa ink em loop infinito; velocidade, direção e skew reagem à velocidade do scroll. */
export function Marquee() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(mq.motion, () => {
        const el = track.current!;
        let x = 0;
        let dir = 1;
        let velocity = 0;
        const skew = gsap.quickTo(el, 'skewX', { duration: 0.5, ease: 'power3.out' });
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            velocity = self.getVelocity();
            dir = self.direction;
          },
        });
        const tick = (_t: number, dt: number) => {
          const half = el.scrollWidth / 2;
          const speed = 0.06 * dt * (1 + Math.min(Math.abs(velocity) / 400, 8));
          x -= speed * dir;
          if (x <= -half) x += half;
          if (x > 0) x -= half;
          gsap.set(el, { x });
          skew(gsap.utils.clamp(-10, 10, velocity / -250));
          velocity *= 0.92;
        };
        gsap.ticker.add(tick);
        return () => {
          gsap.ticker.remove(tick);
          st.kill();
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const row = (
    <div className="flex shrink-0 items-center">
      {[...ITEMS, ...ITEMS].map((t, i) => (
        <span key={i} className="flex items-center gap-8 pr-8">
          <span className={i % 2 ? 'serif-italic text-gold' : ''}>{t}</span>
          <IconSpark className="text-gold" width={18} height={18} />
        </span>
      ))}
    </div>
  );

  return (
    <div ref={root} className="relative overflow-hidden bg-ink py-6 text-ivory md:py-8" role="region" aria-label={ITEMS.join(', ')}>
      <div ref={track} aria-hidden className="flex w-max text-[clamp(1.6rem,4vw,3.5rem)] leading-none font-light tracking-tight will-change-transform">
        {row}
        {row}
      </div>
    </div>
  );
}
