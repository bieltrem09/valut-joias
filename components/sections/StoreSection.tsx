'use client';

import { useRef } from 'react';
import { site } from '@/data/site';
import { MediaKey } from '@/data/media.generated';
import { gsap, useGSAP } from '@/lib/gsap';
import { mq } from '@/lib/animations';
import { cn } from '@/lib/format';
import { Media } from '@/components/ui/Media';
import { PillLink } from '@/components/ui/Buttons';
import { IconPin } from '@/components/ui/Icons';
import { RevealText } from '@/components/ui/Reveal';

const gallery: { k: MediaKey; alt: string; cls: string; speed: number }[] = [
  { k: 'loja-letreiro', alt: 'Letreiro dourado VALUT com o símbolo de folhas na parede branca', cls: 'col-span-5 lg:col-span-3 aspect-[3/4]', speed: -8 },
  { k: 'loja-perolas-busto', alt: 'Colares de pérolas em busto de veludo azul-petróleo', cls: 'col-span-7 lg:col-span-4 lg:col-start-5 aspect-[4/5] mt-16', speed: 10 },
  { k: 'aneis-coquetel', alt: 'Bandeja de anéis coquetel com pedras coloridas', cls: 'col-span-7 lg:col-span-3 lg:col-start-10 aspect-[3/4] lg:mt-40', speed: -14 },
  { k: 'loja-rivieras-letreiro', alt: 'Rivieras amarelas e anel cravejado com o letreiro VALUT ao fundo', cls: 'col-span-5 lg:col-span-3 lg:col-start-2 aspect-[3/4] -mt-6 lg:-mt-24', speed: 12 },
  { k: 'loja-logo-marmore', alt: 'Logo VALUT dourado em parede de mármore', cls: 'col-span-12 lg:col-span-5 lg:col-start-6 aspect-[4/3] lg:mt-10', speed: -6 },
];

/**
 * A Loja: foto do interior em tela cheia; a máscara abre de um retângulo
 * pequeno até a tela inteira enquanto a imagem faz zoom-out (1.3 → 1), em
 * scrub. Depois, mini-galeria assimétrica com parallax.
 */
export function StoreSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: mq.motion, desktop: mq.desktop }, (ctx) => {
        if (!ctx.conditions?.motion) return;
        const desktop = ctx.conditions.desktop;
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: desktop
            ? { trigger: '.st-stage', start: 'top top', end: '+=120%', pin: true, scrub: true }
            : { trigger: '.st-stage', start: 'top 85%', end: 'top 10%', scrub: true },
        });
        tl.fromTo('.st-mask', { clipPath: 'inset(24% 32% 24% 32% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1 })
          .fromTo('.st-img', { scale: 1.3 }, { scale: 1, duration: 1 }, 0)
          .fromTo('.st-copy > *', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.3 }, 0.75);
        gsap.utils.toArray<HTMLElement>('.st-par', root.current).forEach((el) => {
          const speed = Number(el.dataset.speed);
          gsap.fromTo(el, { yPercent: -speed }, { yPercent: speed, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="store-title" className="relative bg-ivory">
      <div className="st-stage relative h-[100svh] overflow-hidden">
        <div className="st-mask absolute inset-0 overflow-hidden">
          <div className="st-img absolute inset-0">
            <Media k="loja-interior" alt="Interior da loja VALUT com bustos de veludo azul-petróleo e lustre de cristal" fill sizes="100vw" className="object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/10" aria-hidden />
        </div>
        <div className="st-copy absolute inset-x-5 bottom-[8svh] text-ivory md:inset-x-8 lg:left-[max(2rem,calc((100vw-1600px)/2+2rem))] lg:max-w-xl">
          <p className="eyebrow text-gold">A Loja · Est. loja física</p>
          <h2 id="store-title" className="mt-4 font-serif text-[clamp(2.6rem,6vw,6rem)] leading-[0.92]">
            Visite a nossa <span className="serif-italic">loja</span>
          </h2>
          <address className="mt-6 flex items-start gap-3 text-[15px] not-italic text-ivory/85">
            <IconPin className="mt-1 shrink-0 text-gold" />
            <span>
              {site.store.street}
              <br />
              {site.store.district} · {site.store.city}/{site.store.state}
              <br />
              {site.store.hours.join(' · ')}
            </span>
          </address>
          <div className="mt-8">
            <PillLink href={site.store.mapsUrl} external label="Como chegar" variant="light" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-5 py-24 md:px-8 lg:py-36">
        <RevealText as="p" className="max-w-2xl font-serif text-[clamp(1.6rem,3vw,2.6rem)] leading-tight">
          Um espaço feito para experimentar com calma: veludo, mármore, luz dourada e <span className="serif-italic">aquele brilho</span> que só pessoalmente.
        </RevealText>
        <div className="mt-16 grid grid-cols-12 gap-4 lg:gap-6">
          {gallery.map((g) => (
            <div key={g.k} className={cn('relative overflow-hidden rounded-[22px]', g.cls)}>
              <div className="st-par absolute inset-[-12%]" data-speed={g.speed}>
                <Media k={g.k} alt={g.alt} fill sizes="(min-width:1024px) 30vw, 60vw" className="object-cover" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
