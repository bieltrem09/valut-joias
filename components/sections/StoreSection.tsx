'use client';

import { useRef } from 'react';
import { site } from '@/data/site';
import { MediaKey } from '@/data/media.generated';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';
import { mq } from '@/lib/animations';
import { cn } from '@/lib/format';
import { Media } from '@/components/ui/Media';
import { PillLink } from '@/components/ui/Buttons';
import { IconPin } from '@/components/ui/Icons';

type Anim = 'arch' | 'iris' | 'blinds' | 'split' | 'diagonal';
const gallery: { k: MediaKey; alt: string; grid: string; aspect: string; speed: number; anim: Anim; label: string }[] = [
  { k: 'loja-letreiro', alt: 'Letreiro dourado VALUT com o símbolo de folhas na parede branca', grid: 'col-span-5 lg:col-span-3', aspect: 'aspect-[3/4]', speed: -8, anim: 'arch', label: 'Assinatura' },
  { k: 'loja-perolas-busto', alt: 'Colares de pérolas em busto de veludo azul-petróleo', grid: 'col-span-7 lg:col-span-4 lg:col-start-5 mt-16', aspect: 'aspect-[4/5]', speed: 10, anim: 'iris', label: 'Veludo' },
  { k: 'aneis-coquetel', alt: 'Bandeja de anéis coquetel com pedras coloridas', grid: 'col-span-7 lg:col-span-3 lg:col-start-10 lg:mt-40', aspect: 'aspect-[3/4]', speed: -14, anim: 'blinds', label: 'Cor' },
  { k: 'loja-rivieras-letreiro', alt: 'Rivieras amarelas e anel cravejado com o letreiro VALUT ao fundo', grid: 'col-span-5 lg:col-span-3 lg:col-start-2 -mt-6 lg:-mt-24', aspect: 'aspect-[3/4]', speed: 12, anim: 'split', label: 'Brilho' },
  { k: 'loja-logo-marmore', alt: 'Logo VALUT dourado em parede de mármore', grid: 'col-span-12 lg:col-span-5 lg:col-start-6 lg:mt-10', aspect: 'aspect-[4/3]', speed: -6, anim: 'diagonal', label: 'Mármore' },
];

/** Clip-path inicial → final de cada tipo de entrada. */
const CLIPS: Partial<Record<Anim, [string, string]>> = {
  arch: ['inset(100% 0% 0% 0% round 50% 50% 0% 0%)', 'inset(0% 0% 0% 0% round 50% 50% 22px 22px)'],
  iris: ['circle(0% at 50% 55%)', 'circle(100% at 50% 55%)'],
  diagonal: ['polygon(0% 0%, 0% 0%, -40% 100%, -40% 100%)', 'polygon(0% 0%, 140% 0%, 100% 100%, -40% 100%)'],
};

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
          .fromTo('.st-img', { scale: 1.14 }, { scale: 1, duration: 1 }, 0)
          .fromTo('.st-copy > *', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.3 }, 0.75);
        gsap.utils.toArray<HTMLElement>('.st-par', root.current).forEach((el) => {
          const speed = Number(el.dataset.speed);
          gsap.fromTo(el, { yPercent: -speed }, { yPercent: speed, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
      });

      // ——— Texto: palavras sobem do desfoque; palavras-chave ganham sublinhado dourado ———
      const quote = root.current!.querySelector<HTMLElement>('.st-quote')!;
      mm.add({ motion: mq.motion, reduced: mq.reduced }, (ctx) => {
        gsap.set(quote, { visibility: 'visible' });
        if (ctx.conditions?.reduced) {
          gsap.set(quote.querySelectorAll('.st-kw'), { '--u': 1 });
          return;
        }
        const split = SplitText.create(quote, { type: 'lines,words', mask: 'lines', linesClass: 'split-line', wordsClass: 'split-word', autoSplit: true,
          onSplit(self) {
            // o gradiente do brilho vai em cada palavra (background-clip não atravessa os wrappers)
            quote.querySelectorAll('.st-shine .split-word, .st-shine > div').forEach((w) => w.classList.add('st-shine-txt'));
            const tl = gsap.timeline({ scrollTrigger: { trigger: quote, start: 'top 82%', once: true } });
            tl.from(self.words, { yPercent: 120, rotationX: -70, filter: 'blur(8px)', opacity: 0, transformOrigin: '50% 100%', duration: 1.1, ease: 'expo.out', stagger: 0.045 })
              .to(quote.querySelectorAll('.st-kw'), { '--u': 1, duration: 0.8, ease: 'power3.inOut', stagger: 0.18 }, 0.7)
              .add(() => quote.querySelectorAll('.st-shine-txt').forEach((w) => w.classList.add('is-on')), 1.1);
            return tl;
          },
        });
        return () => split.revert();
      });

      // ——— Fotos: cada uma entra de um jeito ———
      mm.add({ motion: mq.motion, fine: mq.finePointer }, (ctx) => {
        if (!ctx.conditions?.motion) return;
        const cleanups: (() => void)[] = [];
        gsap.utils.toArray<HTMLElement>('.st-item', root.current).forEach((item) => {
          const anim = item.dataset.anim as Anim;
          const frame = item.querySelector<HTMLElement>('.st-frame')!;
          const zoom = item.querySelector<HTMLElement>('.st-zoom')!;
          const cap = item.querySelector<HTMLElement>('.st-cap');
          const tl = gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 85%', once: true }, defaults: { ease: 'expo.out' } });
          const clip = CLIPS[anim];
          if (clip) tl.fromTo(frame, { clipPath: clip[0] }, { clipPath: clip[1], duration: 1.4, ease: 'curtain' }, 0);
          if (anim === 'blinds') tl.to(item.querySelectorAll('.st-blind'), { scaleY: 0, duration: 1, ease: 'power4.inOut', stagger: { each: 0.07, from: 'start' } }, 0);
          if (anim === 'split') tl.to(item.querySelectorAll('.st-door'), { scaleX: 0, duration: 1.2, ease: 'power4.inOut' }, 0);
          tl.fromTo(zoom, { scale: 1.3, rotation: anim === 'diagonal' ? -4 : anim === 'iris' ? 3 : 0 }, { scale: 1, rotation: 0, duration: 1.8 }, 0)
            .fromTo(item.querySelector('.st-ring'), { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 1.2 }, 0.6);
          if (cap) tl.from(cap.children, { yPercent: 100, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.7);

          // hover (desktop): inclinação 3D + reflexo de luz seguindo o cursor
          if (!ctx.conditions?.fine) return;
          gsap.set(frame, { transformPerspective: 900 });
          const rx = gsap.quickTo(frame, 'rotationX', { duration: 0.7, ease: 'power3.out' });
          const ry = gsap.quickTo(frame, 'rotationY', { duration: 0.7, ease: 'power3.out' });
          const glare = item.querySelector<HTMLElement>('.st-glare')!;
          const move = (e: PointerEvent) => {
            const r = frame.getBoundingClientRect();
            const nx = (e.clientX - r.left) / r.width - 0.5;
            const ny = (e.clientY - r.top) / r.height - 0.5;
            ry(nx * 9);
            rx(-ny * 9);
            glare.style.background = `radial-gradient(circle at ${(nx + 0.5) * 100}% ${(ny + 0.5) * 100}%, rgb(255 255 255 / .35), transparent 55%)`;
          };
          const enter = () => {
            gsap.to(glare, { opacity: 1, duration: 0.4 });
            gsap.to(zoom, { scale: 1.06, duration: 0.9, ease: 'power3.out', overwrite: 'auto' });
          };
          const leave = () => {
            rx(0);
            ry(0);
            gsap.to(glare, { opacity: 0, duration: 0.5 });
            gsap.to(zoom, { scale: 1, duration: 0.9, ease: 'power3.out', overwrite: 'auto' });
          };
          frame.addEventListener('pointermove', move);
          frame.addEventListener('pointerenter', enter);
          frame.addEventListener('pointerleave', leave);
          cleanups.push(() => {
            frame.removeEventListener('pointermove', move);
            frame.removeEventListener('pointerenter', enter);
            frame.removeEventListener('pointerleave', leave);
          });
        });
        return () => cleanups.forEach((c) => c());
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
            <Media k="loja-interior" alt="Interior da loja VALUT com bustos de veludo azul-petróleo e lustre de cristal" fill quality={90} sizes="100vw" className="object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/10" aria-hidden />
        </div>
        <div className="st-copy absolute inset-x-5 bottom-[8svh] text-ivory md:inset-x-8 lg:left-[max(2rem,calc((100vw-1600px)/2+2rem))] lg:max-w-xl">
          <p className="eyebrow text-gold">A Loja · Desde 2018</p>
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
        <p data-reveal className="st-quote max-w-3xl font-serif text-[clamp(1.75rem,3.4vw,3rem)] leading-[1.12] tracking-[-0.01em] [perspective:600px]">
          Um espaço feito para experimentar com calma: <span className="st-kw">veludo</span>, <span className="st-kw">mármore</span>, <span className="st-kw">luz dourada</span> e{' '}
          <span className="st-shine serif-italic">aquele brilho</span> que só pessoalmente.
        </p>
        <div className="mt-16 grid grid-cols-12 gap-x-4 gap-y-8 lg:gap-x-6">
          {gallery.map((g, i) => (
            <figure key={g.k} data-anim={g.anim} className={cn('st-item relative', g.grid)}>
              <div className={cn('st-frame relative overflow-hidden will-change-transform', g.aspect, g.anim === 'arch' ? 'rounded-t-[999px] rounded-b-[22px]' : 'rounded-[22px]')}>
                <div className="st-par absolute inset-[-12%]" data-speed={g.speed}>
                  <div className="st-zoom absolute inset-0">
                    <Media k={g.k} alt={g.alt} fill quality={90} sizes="(min-width:1024px) 34vw, 62vw" className="object-cover" />
                  </div>
                </div>
                {g.anim === 'blinds' && (
                  <div aria-hidden className="absolute inset-0 flex flex-col">
                    {[...Array(6)].map((_, b) => (
                      <span key={b} className="st-blind block flex-1 origin-top bg-ivory motion-reduce:hidden" />
                    ))}
                  </div>
                )}
                {g.anim === 'split' && (
                  <div aria-hidden className="absolute inset-0 flex">
                    <span className="st-door block flex-1 origin-left bg-ivory motion-reduce:hidden" />
                    <span className="st-door block flex-1 origin-right bg-ivory motion-reduce:hidden" />
                  </div>
                )}
                <span aria-hidden className="st-ring pointer-events-none absolute inset-2 rounded-[inherit] border border-ivory/50 opacity-0 motion-reduce:opacity-100" />
                <span aria-hidden className="st-glare pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light" />
              </div>
              <figcaption className="st-cap mt-3 flex items-baseline gap-3 overflow-hidden text-[11px] tracking-[0.2em] uppercase">
                <span className="tabular-nums text-gold-deep">0{i + 1}</span>
                <span className="text-ink/60">{g.label}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
