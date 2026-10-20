'use client';

import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { mq } from '@/lib/animations';
import { MediaKey } from '@/data/media.generated';
import { cn } from '@/lib/format';
import { Media } from '@/components/ui/Media';
import { LazyVideo } from '@/components/ui/LazyVideo';
import { PillLink } from '@/components/ui/Buttons';
import { IconArrow, IconArrowLeft } from '@/components/ui/Icons';
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
 * Galeria curva (ref. Exotica).
 *
 * A rolagem é NATIVA (overflow-x + scroll-snap): o navegador decide sozinho se
 * o gesto é horizontal ou vertical, faz a inércia e o encaixe — nada de "brigar"
 * com o dedo. O arco 3D é só visual: a cada frame de scroll, cada foto recebe
 * rotação/escala/brilho conforme a distância até o centro (no elemento interno,
 * então o layout e o snap não mudam).
 *
 * Desktop: a seção é pinada e o scroll vertical da página percorre a galeria.
 */
export function CurvedGallery() {
  const root = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  // Aplica o arco conforme a posição de cada card em relação ao centro.
  const paint = useCallback(() => {
    const sc = scroller.current;
    if (!sc) return;
    const box = sc.getBoundingClientRect();
    const center = box.left + box.width / 2;
    let best = 0;
    let bestDist = Infinity;
    sc.querySelectorAll<HTMLElement>('[data-arc-item]').forEach((item, i) => {
      const r = item.getBoundingClientRect();
      const d = (r.left + r.width / 2 - center) / (box.width / 2); // -1 … 1 na borda
      const t = Math.min(1, Math.abs(d));
      if (Math.abs(d) < bestDist) {
        bestDist = Math.abs(d);
        best = i;
      }
      const inner = item.firstElementChild as HTMLElement;
      // puxa os vizinhos um pouco para o centro, para que "espiem" nas bordas
      const pull = -Math.sign(d) * Math.min(Math.abs(d), 1.6) * r.width * 0.2;
      inner.style.transform = `perspective(1000px) translateX(${pull}px) translateY(${t * t * 40}px) rotateY(${-Math.max(-1.4, Math.min(1.4, d)) * 30}deg) scale(${1 - t * 0.16})`;
      inner.style.filter = `brightness(${1 - t * 0.55})`;
    });
    if (best !== activeRef.current) {
      activeRef.current = best;
      setActive(best);
    }
  }, []);

  useEffect(() => {
    const sc = scroller.current!;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paint);
    };
    // começa centralizado na 1ª foto
    paint();
    sc.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      sc.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [paint]);

  // Mouse (desktop sem pin, ex.: tablet com mouse): arrastar para os lados
  useEffect(() => {
    const sc = scroller.current!;
    let down = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || window.matchMedia(mq.desktop).matches) return;
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = sc.scrollLeft;
      sc.style.scrollSnapType = 'none';
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) moved = true;
      sc.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      sc.style.scrollSnapType = '';
    };
    const onClick = (e: globalThis.MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };
    sc.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    sc.addEventListener('click', onClick, true);
    return () => {
      sc.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      sc.removeEventListener('click', onClick, true);
    };
  }, []);

  useGSAP(
    () => {
      const sc = scroller.current!;
      const mm = gsap.matchMedia();
      // Entrada: as fotos sobem do centro para fora
      mm.add(mq.motion, () => {
        gsap.from('[data-arc-item]', {
          autoAlpha: 0,
          yPercent: 30,
          duration: 1.2,
          ease: 'expo.out',
          stagger: { each: 0.06, from: 'start' },
          scrollTrigger: { trigger: sc, start: 'top 80%', once: true },
        });
      });
      // Desktop: seção pinada; o scroll vertical percorre a galeria
      mm.add(`${mq.desktop} and ${mq.motion}`, () => {
        const max = () => sc.scrollWidth - sc.clientWidth;
        const st = gsap.to(sc, {
          scrollLeft: () => max(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${Math.max(600, max())}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        return () => {
          st.scrollTrigger?.kill();
          sc.scrollLeft = 0;
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const go = (dir: 1 | -1) => {
    const sc = scroller.current!;
    const item = sc.querySelectorAll<HTMLElement>('[data-arc-item]')[Math.max(0, Math.min(items.length - 1, activeRef.current + dir))];
    item?.scrollIntoView({ behavior: window.matchMedia(mq.reduced).matches ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
  };

  const onCardClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const img = e.currentTarget.querySelector<HTMLElement>('[data-vt]');
    if (img) img.style.viewTransitionName = productVtName(e.currentTarget.dataset.slug!);
  };

  return (
    <section ref={root} aria-labelledby="gallery-title" className="silk relative flex min-h-[100svh] flex-col overflow-hidden text-ivory">
      <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 h-[70%] w-[min(60vw,420px)] -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[2px]">
        <LazyVideo name="video-flores-cravejadas" label="" className="rounded-[200px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 pt-24 text-center md:px-8 lg:pt-[9svh]">
        <p className="eyebrow text-gold">Galeria VALUT</p>
        <RevealText as="h2" id="gallery-title" className="mx-auto mt-4 max-w-4xl font-serif text-[clamp(2.2rem,4.6vw,4.75rem)] leading-[0.98] uppercase">
          Adorne sua história com <span className="serif-italic normal-case text-gold">elegância</span>
        </RevealText>
      </div>

      <div
        ref={scroller}
        role="region"
        aria-roledescription="carrossel"
        aria-label="Galeria de peças"
        tabIndex={0}
        data-cursor="Arraste"
        className="arc-scroller no-scrollbar relative z-10 my-auto flex snap-x snap-mandatory items-center overflow-x-auto overscroll-x-contain py-14 select-none lg:snap-none lg:overflow-hidden lg:py-[3svh]"
      >
        {/* espaçadores para a 1ª e a última foto poderem ficar no centro */}
        <div aria-hidden className="shrink-0" style={{ width: 'calc(50% - var(--arc-w) / 2)' }} />
        {items.map((it, i) => (
          <TransitionLink
            key={it.slug}
            href={`/produto/${it.slug}`}
            viewTransition
            data-slug={it.slug}
            data-arc-item
            onClick={onCardClick}
            draggable={false}
            aria-label={`${it.label} — foto ${i + 1} de ${items.length}`}
            className="group block shrink-0 snap-center px-[2.5vw] lg:px-[1.2vw]"
            style={{ width: 'var(--arc-w)' }}
          >
            <div className="will-change-transform" style={{ transformOrigin: '50% 50%' }}>
              <div data-vt className="relative aspect-[3/4] overflow-hidden rounded-[18px] bg-white/5 shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)]">
                <Media
                  k={it.key}
                  alt={it.alt}
                  fill
                  sizes="(min-width:1024px) 18vw, 64vw"
                  draggable={false}
                  className="object-cover transition-transform duration-700 ease-[var(--ease-expo)] group-hover:scale-105"
                />
              </div>
              <p className={cn('eyebrow mt-4 text-center transition-opacity duration-500', active === i ? 'text-gold opacity-100' : 'opacity-0')}>{it.label}</p>
            </div>
          </TransitionLink>
        ))}
        <div aria-hidden className="shrink-0" style={{ width: 'calc(50% - var(--arc-w) / 2)' }} />
      </div>

      {/* Navegação: setas (mobile/tablet), contador e barra de progresso */}
      <div className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between gap-4 px-6 pb-6 lg:pb-4">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={active === 0}
          className="grid h-11 w-11 place-items-center rounded-full border border-ivory/30 transition-[opacity,background-color] hover:bg-ivory hover:text-ink disabled:opacity-25 lg:invisible"
          aria-label="Foto anterior"
        >
          <IconArrowLeft width={18} />
        </button>
        <div className="flex flex-1 flex-col items-center gap-2" aria-live="polite">
          <span className="text-[12px] tracking-[0.2em] tabular-nums text-gold">
            {String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </span>
          <span aria-hidden className="relative block h-px w-full max-w-[160px] bg-ivory/20">
            <span className="absolute inset-y-0 left-0 bg-gold transition-[width] duration-500 ease-[var(--ease-expo)]" style={{ width: `${((active + 1) / items.length) * 100}%` }} />
          </span>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={active === items.length - 1}
          className="grid h-11 w-11 place-items-center rounded-full border border-ivory/30 transition-[opacity,background-color] hover:bg-ivory hover:text-ink disabled:opacity-25 lg:invisible"
          aria-label="Próxima foto"
        >
          <IconArrow width={18} />
        </button>
      </div>
      <div className="relative z-10 flex justify-center pb-16 lg:pb-[5svh]">
        <PillLink href="/colecao" label="Ver coleção completa" variant="light" />
      </div>
    </section>
  );
}
