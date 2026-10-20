'use client';

import { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';
import { ease, mq } from '@/lib/animations';
import { onReveal } from '@/lib/reveal';
import { Media } from '@/components/ui/Media';
import { PillLink } from '@/components/ui/Buttons';
import { IconArrow } from '@/components/ui/Icons';
import { TransitionLink } from '@/components/ui/TransitionLink';
import { RotatingWords } from '@/components/ui/RotatingWords';
import { RotatingBadge } from '@/components/ui/RotatingBadge';

const WORD = ['V', 'Λ', 'L', 'U', 'T'];
// brilhos em % da caixa da joia
const GLINTS = [
  { x: 18, y: 30, s: 1 },
  { x: 74, y: 12, s: 0.8 },
  { x: 88, y: 46, s: 0.6 },
  { x: 30, y: 78, s: 0.7 },
  { x: 58, y: 40, s: 0.5 },
  { x: 8, y: 62, s: 0.45 },
];

/**
 * Hero editorial (ref. Velora): "VΛLUT" gigante atrás da joia recortada,
 * legendas finas com linha-guia, fotos pequenas nos cantos e "valut / 01".
 *
 * Camadas (cada uma com o seu wrapper para os transforms não brigarem):
 *   [data-scroll] → scrub do pin   ·   [data-mouse] → parallax do cursor   ·   elemento → entrada
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();

      // ——— Entrada ———
      mm.add({ motion: mq.motion, reduced: mq.reduced }, (ctx) => {
        const reduced = ctx.conditions?.reduced;
        gsap.set(q('[data-hero-hide]'), { autoAlpha: 0 });
        let split: SplitText | undefined;
        let serif: SplitText | undefined;
        const loops: gsap.core.Animation[] = [];

        const play = () => {
          if (reduced) {
            gsap.to(q('[data-hero-hide]'), { autoAlpha: 1, duration: 0.5, stagger: 0.04 });
            return;
          }
          gsap.set(q('[data-hero-hide]'), { autoAlpha: 1 });
          split = SplitText.create(q('.hero-lede'), { type: 'lines', mask: 'lines' });
          serif = SplitText.create(q('.hero-serif'), { type: 'chars' });
          const tl = gsap.timeline({ defaults: { ease: ease.out } });
          tl.from(q('.hero-letter'), { yPercent: 105, duration: 1.3, stagger: 0.07 }, 0)
            .from(serif.chars, { yPercent: 115, rotationX: -90, rotation: 12, transformOrigin: '50% 100%', duration: 1.1, stagger: 0.045 }, 0.4)
            .from(q('.hero-jewel'), { y: () => -window.innerHeight * 0.65, rotation: -14, scale: 1.08, duration: 1.5, ease: ease.land }, 0.15)
            .from(q('.hero-shadow'), { scaleX: 0.2, autoAlpha: 0, duration: 1.2 }, 0.75)
            .fromTo(q('.hero-photo'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'curtain', stagger: 0.12 }, 0.45)
            .from(q('.hero-photo img'), { scale: 1.2, duration: 1.6, stagger: 0.12 }, 0.45)
            .fromTo(q('.hero-line'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0.9)
            .from(q('.hero-note'), { autoAlpha: 0, y: 10, duration: 0.8, stagger: 0.08 }, 1.0)
            .from(split.lines, { yPercent: 110, duration: 1, stagger: 0.06 }, 0.7)
            .from(q('.hero-fade'), { autoAlpha: 0, y: 16, duration: 0.9, stagger: 0.07 }, 0.85)
            .from(q('.hero-badge'), { scale: 0, rotation: -120, duration: 1.2, ease: 'back.out(1.6)' }, 1.0)
            // a joia passa a "levitar" depois de pousar
            .add(() => {
              loops.push(gsap.to(q('[data-float]'), { y: -14, rotation: 1.6, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
              loops.push(gsap.to(q('.hero-shadow'), { scaleX: 0.86, opacity: 0.7, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
              q('.hero-glint').forEach((g, i) => {
                loops.push(
                  gsap.fromTo(
                    g,
                    { scale: 0, rotation: 0, autoAlpha: 0 },
                    { scale: 1, rotation: 90, autoAlpha: 1, duration: 0.55, ease: 'power2.out', yoyo: true, repeat: -1, repeatDelay: 1.4 + (i % 3) * 0.7, delay: i * 0.45 },
                  ),
                );
              });
            }, 1.7);
        };
        const off = onReveal(play);
        return () => {
          off();
          loops.forEach((l) => l.kill());
          split?.revert();
          serif?.revert();
        };
      });

      // ——— Parallax do mouse em 3 camadas + leve rotação 3D da joia ———
      mm.add(`${mq.finePointer} and ${mq.motion}`, () => {
        const layer = (sel: string, depth: number) => ({
          x: gsap.quickTo(q(sel), 'x', { duration: 1.1, ease: 'power3.out' }),
          y: gsap.quickTo(q(sel), 'y', { duration: 1.1, ease: 'power3.out' }),
          depth,
        });
        const layers = [layer('[data-mouse="text"]', -12), layer('[data-mouse="jewel"]', 28), layer('[data-mouse="photos"]', 18)];
        gsap.set(q('[data-mouse="jewel"]'), { transformPerspective: 900 });
        const rotY = gsap.quickTo(q('[data-mouse="jewel"]'), 'rotationY', { duration: 1.2, ease: 'power3.out' });
        const rotX = gsap.quickTo(q('[data-mouse="jewel"]'), 'rotationX', { duration: 1.2, ease: 'power3.out' });
        const move = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          layers.forEach((l) => {
            l.x(nx * l.depth);
            l.y(ny * l.depth);
          });
          rotY(nx * 16);
          rotX(-ny * 12);
        };
        el.addEventListener('pointermove', move);

        // as letras do VΛLUT "levantam" em onda perto do cursor
        const letters = q('.hero-letter');
        const lift = letters.map((l) => gsap.quickTo(l, 'y', { duration: 0.8, ease: 'power3.out' }));
        const wave = (e: PointerEvent) => {
          letters.forEach((l, i) => {
            const r = l.getBoundingClientRect();
            const d = Math.abs(e.clientX - (r.left + r.width / 2));
            lift[i](-Math.max(0, 1 - d / (window.innerWidth * 0.22)) * window.innerWidth * 0.018);
          });
        };
        const calm = () => lift.forEach((f) => f(0));
        el.addEventListener('pointermove', wave);
        el.addEventListener('pointerleave', calm);
        return () => {
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointermove', wave);
          el.removeEventListener('pointerleave', calm);
        };
      });

      // ——— Mobile: sem pin, mas o scroll ainda mexe na cena ———
      mm.add(`${mq.mobile} and ${mq.motion}`, () => {
        const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 0.6 } });
        tl.to(q('[data-scroll="word"]'), { yPercent: -35, autoAlpha: 0.2 }, 0)
          .to(q('[data-scroll="jewel"]'), { rotation: 35, scale: 0.8, yPercent: -18 }, 0)
          .to(q('.hero-badge-wrap'), { rotation: 160, yPercent: -40 }, 0)
          .to(q('[data-scroll="ui"]'), { yPercent: 12, autoAlpha: 0 }, 0);
      });

      // ——— Scroll: pin de ~100vh; a próxima seção sobe por cima ———
      mm.add(`${mq.desktop} and ${mq.motion}`, () => {
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: el, start: 'top top', end: '+=100%', pin: true, pinSpacing: false, scrub: true },
        });
        tl.to(q('[data-scroll="word"]'), { scale: 0.6, autoAlpha: 0.15, yPercent: -10 }, 0)
          .to(q('[data-scroll="jewel"]'), { rotation: 180, scale: 0.45, yPercent: -12 }, 0)
          .to(q('[data-scroll="photos"]'), { yPercent: -30, autoAlpha: 0 }, 0)
          .to(q('[data-scroll="ui"]'), { autoAlpha: 0, y: -40 }, 0)
          .to(q('.hero-badge-wrap'), { rotation: 200, yPercent: -60, autoAlpha: 0 }, 0)
          .to(q('.hero-dim'), { autoAlpha: 0.55 }, 0);
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="hero-title" className="relative h-[100svh] min-h-[640px] overflow-hidden bg-ivory text-ink">
      <h1 id="hero-title" className="sr-only">
        VALUT Semijoias — Semijoia que encanta.
      </h1>

      {/* VΛLUT gigante (atrás) */}
      <div data-scroll="word" className="absolute inset-x-0 top-[17svh] origin-[50%_30%] lg:top-[12svh]">
        <div data-mouse="text">
          <p aria-hidden className="font-display flex justify-center overflow-hidden px-[2vw] pt-[1vw] text-[29.5vw] select-none">
            {WORD.map((l, i) => (
              <span key={i} data-hero-hide className="hero-letter inline-block">
                {l}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* "semijoias" em serif itálico, parcialmente atrás da joia */}
      <div data-scroll="word" className="absolute top-[33svh] right-[5vw] z-10 lg:top-[53svh] lg:right-[4vw]">
        <div data-mouse="text" className="overflow-hidden">
          <p aria-hidden data-hero-hide className="hero-serif serif-italic text-[13.5vw] lg:text-[8.4vw] leading-[1.08] pr-[0.1em] select-none">
            semijoias
          </p>
        </div>
      </div>

      {/* Joia recortada + sombra no chão */}
      <div data-scroll="jewel" className="absolute top-[57.5svh] left-1/2 z-20 w-[min(54vw,330px)] -translate-x-1/2 -translate-y-1/2 lg:top-[54svh] lg:w-[min(31vw,600px)]">
        <div data-mouse="jewel">
          <div data-float>
          <div data-hero-hide className="hero-jewel relative">
            <Media
              k="joia-rubi-recorte"
              alt="Par de brincos coração com pedra rubi e halo cravejado, coleção Rubi Mood"
              priority
              sizes="(min-width: 1024px) 31vw, 60vw"
              className="relative z-10 h-auto w-full drop-shadow-[0_30px_35px_rgba(14,13,11,0.28)]"
            />
            <div aria-hidden className="jewel-shine absolute inset-0 z-20 overflow-hidden" />
            {GLINTS.map((g, i) => (
              <svg
                key={i}
                aria-hidden
                viewBox="0 0 24 24"
                className="hero-glint pointer-events-none invisible absolute z-30 text-white drop-shadow-[0_0_6px_rgba(255,236,190,0.9)]"
                style={{ left: `${g.x}%`, top: `${g.y}%`, width: `${g.s * 9}%`, translate: '-50% -50%' }}
              >
                <path fill="currentColor" d="M12 0c.7 7.5 2.4 10.6 12 12-9.6 1.4-11.3 4.5-12 12-.7-7.5-2.4-10.6-12-12 9.6-1.4 11.3-4.5 12-12Z" />
              </svg>
            ))}
          </div>
          </div>
          <div aria-hidden data-hero-hide className="hero-shadow absolute -bottom-[6%] left-[12%] h-[9%] w-[76%] rounded-[50%] bg-ink/30 blur-2xl" />
        </div>
      </div>

      {/* Selo giratório */}
      <div className="hero-badge-wrap absolute top-[59svh] right-[4vw] z-30 w-[88px] lg:top-[27svh] lg:right-auto lg:left-[30vw] lg:w-[128px]">
        <div data-mouse="photos">
          <div data-hero-hide className="hero-badge">
            <RotatingBadge text="Coleção Rubi Mood ✦ Semijoia que encanta ✦" className="w-full" />
          </div>
        </div>
      </div>

      {/* Fotos pequenas nos cantos */}
      <div data-scroll="photos" className="absolute inset-0 z-10" aria-hidden={false}>
        <div data-mouse="photos" className="absolute inset-0">
          <div data-hero-hide className="hero-photo absolute hidden aspect-[4/3] overflow-hidden rounded-sm lg:top-[70svh] lg:right-[4vw] lg:block lg:w-[11vw]">
            <Media k="editorial-flores-cravejadas" alt="Modelo com brinco de flores cravejadas" fill sizes="(min-width:1024px) 12vw, 30vw" className="object-cover object-[50%_35%]" />
          </div>
          <div data-hero-hide className="hero-photo absolute bottom-[12svh] left-[4vw] hidden aspect-[3/4] w-[9.5vw] overflow-hidden rounded-sm lg:block">
            <Media k="editorial-pulseiras-rosa" alt="Pulseiras douradas sobre blazer rosa" fill sizes="10vw" className="object-cover" />
          </div>
        </div>
      </div>

      {/* Interface editorial */}
      <div data-scroll="ui" className="absolute inset-0 z-30">
        <div data-mouse="text" className="absolute inset-0">
          {/* Legenda técnica com linha-guia até a joia */}
          <div className="absolute top-[74svh] right-[19vw] hidden lg:block">
            <svg aria-hidden className="absolute right-full bottom-[0.55em] mr-3 h-[13svh] w-[9vw] overflow-visible text-ink/70" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path className="hero-line" d="M100 100 H45 L0 0" fill="none" stroke="currentColor" strokeWidth="0.8" vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray={1} strokeDashoffset={1} />
            </svg>
            <p data-hero-hide className="hero-note eyebrow whitespace-nowrap leading-none text-ink/80">
              Coleção Rubi Mood
            </p>
            <p data-hero-hide className="hero-note mt-2 text-[12px] text-ink/55">Brinco Coração Rubi</p>
          </div>

          {/* Tagline à esquerda */}
          <p data-hero-hide className="hero-note eyebrow absolute top-[47svh] left-[4vw] hidden max-w-[12rem] leading-[1.5] lg:block">
            Semijoia
            <br />
            que encanta.
          </p>

          {/* Texto + CTAs */}
          <div className="absolute inset-x-5 bottom-[4svh] lg:inset-x-auto lg:bottom-auto lg:top-[56svh] lg:left-[15vw] lg:w-[17.5vw]">
            <p data-hero-hide className="hero-fade mb-3 font-serif text-[22px] leading-tight lg:text-[26px]">
              <RotatingWords prefix="Para" words={['os dias comuns.', 'os grandes dias.', 'você brilhar.', 'quem revende.']} className="text-ink" />
            </p>
            <p data-hero-hide className="hero-lede max-w-[21rem] text-[14px] leading-[1.55] text-ink/75 lg:text-[14px] lg:leading-relaxed">
              <strong className="font-medium text-ink">Atacado & Varejo</strong>, com a <span className="serif-italic text-[1.1em] text-ink">elegância</span> que exala em cada detalhe<span className="lg:hidden">.</span>
              <span className="hidden lg:inline"> — peças pensadas para acompanhar a sua história.</span>
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-5 lg:mt-6">
              <div data-hero-hide className="hero-fade">
                <PillLink href="/colecao" label="Explorar coleção" icon={<IconArrow width={16} />} />
              </div>
              <div data-hero-hide className="hero-fade">
                <TransitionLink href="/atacado" className="link-draw text-sm font-medium">
                  Atacado & Varejo
                </TransitionLink>
              </div>
            </div>
          </div>

          {/* Rodapé do hero */}
          <div data-hero-hide className="hero-fade absolute right-[4vw] bottom-[7svh] hidden items-center gap-10 text-[13px] lg:flex">
            <span className="tabular-nums text-ink/70">valut / 01</span>
            <TransitionLink href="/colecao" className="border-b border-ink pb-1 tracking-[0.12em] uppercase text-[12px] font-medium">
              Explorar coleção
            </TransitionLink>
          </div>
          <div data-hero-hide className="hero-fade absolute bottom-[3svh] left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex" aria-hidden>
            <span className="eyebrow text-[10px] text-ink/60">Role</span>
            <span className="relative block h-10 w-px overflow-hidden bg-ink/15">
              <span className="scroll-cue absolute inset-0 bg-ink" />
            </span>
          </div>
          <span data-hero-hide className="hero-fade absolute top-[12svh] left-5 text-[12px] tabular-nums text-ink/60 lg:hidden">valut / 01</span>
          <span data-hero-hide className="hero-fade eyebrow absolute top-[12svh] right-5 text-[10px] text-ink/60 lg:hidden">Semijoia que encanta</span>
        </div>
      </div>

      <div aria-hidden className="hero-dim pointer-events-none absolute inset-0 z-40 bg-ink opacity-0" />
    </section>
  );
}
