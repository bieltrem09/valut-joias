'use client';

import { MouseEvent, useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { mq } from '@/lib/animations';
import { MediaKey } from '@/data/media.generated';
import { Media } from '@/components/ui/Media';
import { LazyVideo } from '@/components/ui/LazyVideo';
import { PillLink } from '@/components/ui/Buttons';
import { RevealText } from '@/components/ui/Reveal';
import { TransitionLink } from '@/components/ui/TransitionLink';
import { productVtName } from '@/components/shop/ProductCard';

const items: { key: MediaKey; alt: string; slug: string; label: string }[] = [
  { key: 'detalhe-brinco-gota', alt: 'Brinco gota cravejado e anel', slug: 'brinco-gota-cravejado', label: 'Brinco Gota' },
  { key: 'editorial-pulseiras-rosa', alt: 'Bracelete e pulseiras douradas em blazer rosa', slug: 'bracelete-liso-dourado', label: 'Bracelete' },
  { key: 'editorial-flores-cravejadas', alt: 'Brinco de flores cravejadas', slug: 'brinco-flores-cravejadas', label: 'Flores' },
  { key: 'loja-perolas-busto', alt: 'Colares de pérolas em busto azul-petróleo', slug: 'colar-perolas', label: 'Pérolas' },
  { key: 'conjunto-rubi-expositor', alt: 'Conjunto rubi retangular em expositor verde', slug: 'conjunto-rubi-retangular', label: 'Rubi' },
  { key: 'aneis-coquetel', alt: 'Anéis coquetel com pedras coloridas', slug: 'anel-coquetel', label: 'Coquetel' },
  { key: 'editorial-colar-gota', alt: 'Modelo com colar gota dourado', slug: 'colar-gota-dourado', label: 'Gota' },
  { key: 'loja-conjunto-coral', alt: 'Conjunto coral em busto rosa', slug: 'conjunto-coral', label: 'Coral' },
  { key: 'editorial-perfil-brinco', alt: 'Modelo de perfil com brinco franja', slug: 'brinco-franja-dourado', label: 'Franja' },
  { key: 'loja-rivieras', alt: 'Colares riviera amarelos e brancos', slug: 'colar-riviera-amarela', label: 'Riviera' },
];

/**
 * Galeria curva (ref. Exotica): fotos dispostas num arco côncavo 3D (CSS
 * perspective + rotateY/translateZ). Seção pinada: o scroll gira o arco; também
 * aceita arrastar. Bordas mais escuras e menores. Ao entrar, o arco "desenrola"
 * do centro para fora. Clique → produto com elemento compartilhado.
 */
export function CurvedGallery() {
  const root = useRef<HTMLElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);

  useGSAP(
    () => {
      const el = root.current!;
      const cards = gsap.utils.toArray<HTMLElement>('.arc-card', ring.current);
      const n = cards.length;
      const state = { rot: 0, drag: 0, spread: 0, scroll: 0 };
      const mm = gsap.matchMedia();

      const layout = () => {
        const w = ring.current!.offsetWidth;
        const cardW = cards[0].offsetWidth;
        const R = Math.max(w * 0.62, 520);
        const step = ((cardW * 1.12) / R) * (180 / Math.PI) * state.spread;
        const span = step * n;
        const maxA = (step * n) / 2 || 1;
        cards.forEach((c, i) => {
          let a = (i - (n - 1) / 2) * step + state.rot + state.drag + state.scroll;
          if (span > 0) a = gsap.utils.wrap(-span / 2, span / 2, a);
          const t = Math.min(1, Math.abs(a) / maxA);
          gsap.set(c, {
            transform: `translate(-50%, -50%) translateZ(${R}px) rotateY(${a}deg) translateZ(${-R}px) scale(${1 - 0.22 * t})`,
            filter: `brightness(${1 - 0.6 * t})`,
            zIndex: Math.round(100 - t * 100),
          });
        });
      };

      // Arrastar (mouse e toque) com inércia e encaixe no card mais próximo.
      // No toque o ganho é maior: um gesto curto já gira várias fotos.
      const stepDeg = () => {
        const w = ring.current!.offsetWidth;
        const R = Math.max(w * 0.62, 520);
        return ((cards[0].offsetWidth * 1.12) / R) * (180 / Math.PI);
      };
      let startX = 0;
      let base = 0;
      let down = false;
      let gain = 0.1;
      let lastX = 0;
      let lastT = 0;
      let velocity = 0; // graus por ms
      const onDown = (e: PointerEvent) => {
        down = true;
        dragged.current = false;
        startX = lastX = e.clientX;
        lastT = performance.now();
        velocity = 0;
        base = state.drag;
        const step = stepDeg();
        // toque: ~1 card a cada 35% do card arrastado; mouse: 1 card por largura de card
        gain = (e.pointerType === 'mouse' ? 1 : 2.8) * (step / cards[0].offsetWidth);
        gsap.killTweensOf(state, 'drag');
      };
      const onMove = (e: PointerEvent) => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 6) dragged.current = true;
        const now = performance.now();
        const dt = Math.max(1, now - lastT);
        velocity = gsap.utils.interpolate(velocity, ((e.clientX - lastX) * gain) / dt, 0.4);
        lastX = e.clientX;
        lastT = now;
        state.drag = base + dx * gain;
        layout();
      };
      const onUp = () => {
        if (!down) return;
        down = false;
        const step = stepDeg();
        const projected = state.drag + velocity * 420; // inércia
        const offset = state.rot + state.scroll;
        const snapped = Math.round((projected + offset) / step) * step - offset;
        gsap.to(state, { drag: snapped, duration: 1.1, ease: 'expo.out', onUpdate: () => {
          layout();
          updateCounter();
        } });
      };
      const counter = el.querySelector<HTMLElement>('[data-arc-counter]');
      const updateCounter = () => {
        if (!counter) return;
        const step = stepDeg() || 1;
        const idx = gsap.utils.wrap(0, n, Math.round((n - 1) / 2 - (state.rot + state.drag + state.scroll) / step));
        counter.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
      };
      const stage = ring.current!;
      stage.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);

      mm.add({ motion: mq.motion, reduced: mq.reduced, desktop: mq.desktop }, (ctx) => {
        const { reduced, desktop } = ctx.conditions!;
        if (reduced) {
          state.spread = 1;
          layout();
          return;
        }
        // Desenrola do centro para fora
        gsap.fromTo(
          state,
          { spread: 0 },
          { spread: 1, duration: 1.8, ease: 'expo.out', onUpdate: layout, scrollTrigger: { trigger: el, start: 'top 65%', once: true } },
        );
        gsap.from(cards, { autoAlpha: 0, duration: 1, stagger: { each: 0.05, from: 'center' }, scrollTrigger: { trigger: el, start: 'top 65%', once: true } });
        if (desktop) {
          gsap.to(state, {
            scroll: -110,
            ease: 'none',
            onUpdate: () => (layout(), updateCounter()),
            scrollTrigger: { trigger: el, start: 'top top', end: '+=160%', pin: true, scrub: 1, invalidateOnRefresh: true },
          });
        } else {
          gsap.to(state, { scroll: -40, ease: 'none', onUpdate: () => (layout(), updateCounter()), scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 } });
        }
        layout();
        updateCounter();
      });

      window.addEventListener('resize', layout);
      return () => {
        mm.revert();
        stage.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        window.removeEventListener('resize', layout);
      };
    },
    { scope: root },
  );

  const onCardClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (dragged.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const img = e.currentTarget.querySelector<HTMLElement>('[data-vt]');
    const slug = e.currentTarget.dataset.slug!;
    if (img) img.style.viewTransitionName = productVtName(slug);
  };

  return (
    <section ref={root} aria-labelledby="gallery-title" className="silk relative flex min-h-[100svh] flex-col overflow-hidden text-ivory">
      <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 h-[70%] w-[min(60vw,420px)] -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[2px]">
        <LazyVideo name="video-flores-cravejadas" label="" className="rounded-[200px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 pt-24 text-center md:px-8 lg:pt-[12svh]">
        <p className="eyebrow text-gold">Galeria VALUT</p>
        <RevealText as="h2" id="gallery-title" className="mx-auto mt-4 max-w-4xl font-serif text-[clamp(2.2rem,5.4vw,5.5rem)] leading-[0.98] uppercase">
          Adorne sua história com <span className="serif-italic normal-case text-gold">elegância</span>
        </RevealText>
      </div>

      <div
        ref={ring}
        data-cursor="Arraste"
        className="relative z-10 mx-auto my-auto h-[58svh] w-full cursor-grab touch-pan-y select-none active:cursor-grabbing lg:h-[50svh]"
        style={{ perspective: '1400px', perspectiveOrigin: '50% 50%' }}
        role="group"
        aria-roledescription="carrossel"
        aria-label="Galeria de peças — arraste ou role para girar"
      >
        <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
          {items.map((it) => (
            <TransitionLink
              key={it.key + it.slug}
              href={`/produto/${it.slug}`}
              viewTransition
              data-slug={it.slug}
              onClick={onCardClick}
              draggable={false}
              className="arc-card group absolute top-1/2 left-1/2 block aspect-[3/4] w-[56vw] max-w-[300px] origin-center sm:w-[34vw] lg:w-[16vw]"
              aria-label={`Ver ${it.label}`}
            >
              <div data-vt className="relative h-full w-full overflow-hidden rounded-[18px] bg-white/5 shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)]">
                <Media k={it.key} alt={it.alt} fill sizes="(min-width:1024px) 16vw, 56vw" draggable={false} className="object-cover transition-transform duration-700 ease-[var(--ease-expo)] group-hover:scale-105" />
              </div>
              <span className="eyebrow absolute -bottom-7 left-0 text-ivory/60 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">{it.label}</span>
            </TransitionLink>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center gap-4 pb-6 text-[11px] tracking-[0.18em] text-ivory/60 uppercase lg:hidden" aria-hidden>
        <span>← Arraste</span>
        <span className="h-px w-10 bg-ivory/25" />
        <span data-arc-counter className="tabular-nums text-gold">01 / 10</span>
      </div>
      <div className="relative z-10 flex justify-center pb-16 lg:pb-[8svh]">
        <PillLink href="/colecao" label="Ver coleção completa" variant="light" />
      </div>
    </section>
  );
}
