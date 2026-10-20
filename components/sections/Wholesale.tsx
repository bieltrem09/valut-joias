'use client';

import { useRef } from 'react';
import { site, whatsappLink } from '@/data/site';
import { gsap, useGSAP } from '@/lib/gsap';
import { mq } from '@/lib/animations';
import { PillLink } from '@/components/ui/Buttons';
import { IconArrow } from '@/components/ui/Icons';
import { RevealText } from '@/components/ui/Reveal';

// [CONFIRMAR] benefícios reais do programa de revenda
const benefits = [
  { title: '[CONFIRMAR] Pedido mínimo', text: 'Condições de atacado a definir com a VALUT.' },
  { title: '[CONFIRMAR] Catálogo exclusivo', text: 'Lançamentos e reposições para revendedoras.' },
  { title: 'Enviamos para todo o Brasil', text: 'Receba a sua coleção onde estiver.' },
];

/** Bloco de conversão de atacado: veludo azul-petróleo, count-up só com dados reais (seguidores do Instagram). */
export function Wholesale({ standalone = false }: { standalone?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const num = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(mq.motion, () => {
        const counter = { v: 0 };
        gsap.to(counter, {
          v: 54,
          duration: 2,
          ease: 'power3.out',
          scrollTrigger: { trigger: num.current, start: 'top 85%', once: true },
          onUpdate: () => num.current && (num.current.textContent = String(Math.round(counter.v))),
        });
        gsap.from('.ws-benefit', { y: 50, autoAlpha: 0, stagger: 0.1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.ws-benefits', start: 'top 85%', once: true } });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="ws-title" className={`velvet relative overflow-hidden px-5 text-ivory md:px-8 ${standalone ? 'pt-40 pb-28' : 'py-28 lg:py-36'}`}>
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow text-gold">Revenda VALUT</p>
            <RevealText as={standalone ? 'h1' : 'h2'} id="ws-title" className="mt-4 font-serif text-[clamp(2.8rem,7vw,7rem)] leading-[0.9]">
              Atacado <span className="serif-italic text-gold">&</span> Varejo
            </RevealText>
            <p className="mt-6 max-w-lg text-lg text-ivory/80">Leve a VALUT para as suas clientes. Semijoia que encanta, agora no seu negócio.</p>
          </div>
          <div className="lg:text-right">
            <p className="font-display text-[clamp(5rem,12vw,11rem)] text-gold">
              <span ref={num}>54</span>
              <span className="ml-[0.08em] text-[0.42em] tracking-[-0.01em]">mil+</span>
            </p>
            <p className="eyebrow mt-5 text-ivory/70">seguidores no Instagram {site.instagram.handle}</p>
          </div>
        </div>

        <ul className="ws-benefits mt-16 grid gap-px overflow-hidden rounded-[var(--radius-card)] bg-ivory/15 md:grid-cols-3">
          {benefits.map((b, i) => (
            <li key={i} className="ws-benefit bg-teal/95 p-8">
              <span className="font-serif text-4xl text-gold italic">0{i + 1}</span>
              <h3 className="mt-6 font-serif text-2xl">{b.title}</h3>
              <p className="mt-2 text-sm text-ivory/70">{b.text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap items-center gap-6">
          <PillLink href={whatsappLink('Olá, VALUT! Quero revender as semijoias. Como funciona o atacado?')} external label="Quero revender" variant="gold" size="lg" icon={<IconArrow width={16} />} />
          <p className="text-sm text-ivory/60">WhatsApp {site.whatsapp.label}</p>
        </div>
      </div>
    </section>
  );
}
