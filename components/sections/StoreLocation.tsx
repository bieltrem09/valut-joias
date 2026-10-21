'use client';

import { useRef, useState } from 'react';
import { site } from '@/data/site';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { mq } from '@/lib/animations';
import { cn } from '@/lib/format';
import { Media } from '@/components/ui/Media';
import { PillLink } from '@/components/ui/Buttons';
import { IconArrow, IconClose, IconPin } from '@/components/ui/Icons';
import { MAP_PIN_OFFSET, StoreMap } from '@/components/ui/StoreMap';

/**
 * "Onde estamos": transição contada pelo scroll antes do mapa.
 *   1. A fachada do Shopping Villa Real ocupa a tela, com o título.
 *   2. A foto encolhe até virar a miniatura do cartão (recorte + escala),
 *      enquanto o mapa se abre por trás num círculo a partir do ponto da loja.
 *   3. O alfinete dourado cai e o cartão com endereço e rotas entra.
 * Usa position: sticky (sem pin do ScrollTrigger) para ficar estável no mobile.
 * O mapa só recebe toque/scroll depois de "Explorar o mapa", para não prender a página.
 */
export function StoreLocation({ id = 'onde-estamos' }: { id?: string }) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [interactive, setInteractive] = useState(false);

  useGSAP(
    () => {
      const el = root.current!;
      const st = stage.current!;
      const q = gsap.utils.selector(el);
      const photo = q('.loc-photo')[0] as HTMLElement;
      const thumb = q('[data-loc-thumb]')[0] as HTMLElement;
      const mm = gsap.matchMedia();

      // Geometria: recorte com a proporção da miniatura, centrado, que depois é
      // escalado e levado exatamente para a posição da miniatura no cartão.
      const geo = () => {
        const s = st.getBoundingClientRect();
        const t = thumb.getBoundingClientRect();
        const W = s.width;
        const H = s.height;
        const x = t.left - s.left;
        const y = t.top - s.top;
        let cw = W;
        let ch = (W * t.height) / t.width;
        if (ch > H) {
          ch = H;
          cw = (H * t.width) / t.height;
        }
        const top = (H - ch) / 2;
        const left = (W - cw) / 2;
        const k = t.width / cw;
        return { W, H, top, left, k, tx: x - left * k, ty: y - top * k };
      };
      const pinY = () => st.getBoundingClientRect().height / 2 - MAP_PIN_OFFSET;

      mm.add({ motion: mq.motion, reduced: mq.reduced }, (ctx) => {
        if (ctx.conditions?.reduced) {
          // Sem animação: estado final direto
          gsap.set(photo, { autoAlpha: 0 });
          gsap.set(q('.loc-intro'), { autoAlpha: 0 });
          gsap.set(q('.loc-map'), { clipPath: 'none' });
          return;
        }

        gsap.set(photo, { transformOrigin: '0 0' });
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
            invalidateOnRefresh: true,
            onLeave: () => setInteractive(false),
            onLeaveBack: () => setInteractive(false),
          },
        });

        tl.fromTo(q('.loc-photo-img'), { scale: 1.14 }, { scale: 1, duration: 0.25 }, 0)
          .fromTo(q('.loc-intro > *'), { y: 0, autoAlpha: 1 }, { y: -40, autoAlpha: 0, stagger: 0.02, duration: 0.12 }, 0.18)
          // foto → miniatura
          .fromTo(
            photo,
            { clipPath: 'inset(0px 0px 0px 0px round 0px)', x: 0, y: 0, scale: 1 },
            {
              clipPath: () => {
                const g = geo();
                return `inset(${g.top}px ${g.left}px ${g.top}px ${g.left}px round ${14 / g.k}px)`;
              },
              x: () => geo().tx,
              y: () => geo().ty,
              scale: () => geo().k,
              duration: 0.35,
              ease: 'power2.inOut',
            },
            0.25,
          )
          .fromTo(q('.loc-veil'), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2 }, 0.3)
          // mapa abre em círculo a partir do ponto da loja
          .fromTo(
            q('.loc-map'),
            { clipPath: () => `circle(0% at 50% ${pinY()}px)` },
            { clipPath: () => `circle(150% at 50% ${pinY()}px)`, duration: 0.36, ease: 'power2.in' },
            0.3,
          )
          .fromTo(q('.loc-map-inner'), { scale: 1.25 }, { scale: 1, duration: 0.4, ease: 'power2.out' }, 0.3)
          // alfinete cai
          .fromTo(q('.loc-pin'), { y: -140, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, ease: 'bounce.out' }, 0.56)
          .fromTo(q('.loc-pulse'), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.08 }, 0.66)
          // cartão entra
          .fromTo(q('.loc-card'), { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.14, ease: 'power3.out' }, 0.6)
          // troca a foto animada pela miniatura real (estável em redimensionamentos)
          .fromTo(q('.loc-thumb-img'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.7)
          .to(photo, { autoAlpha: 0, duration: 0.04 }, 0.74)
          .fromTo(q('.loc-explore'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.78)
          .to({}, { duration: 0.18 });

        const onResize = () => ScrollTrigger.refresh();
        window.addEventListener('orientationchange', onResize);
        return () => window.removeEventListener('orientationchange', onResize);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id={id} aria-labelledby={`${id}-title`} className="relative h-[300svh] bg-ink motion-reduce:h-auto">
      <div ref={stage} className="sticky top-0 h-[100svh] min-h-[600px] overflow-hidden motion-reduce:relative">
        {/* Mapa (por trás) */}
        <div className="loc-map absolute inset-0" style={{ clipPath: 'circle(0% at 50% 50%)' }}>
          <div className="loc-map-inner absolute inset-0">
            <StoreMap interactive={interactive} />
          </div>
          {/* alfinete dourado no ponto da loja */}
          <div className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 -translate-y-full" style={{ top: `calc(50% - ${MAP_PIN_OFFSET}px)` }} aria-hidden>
            <span className="loc-pulse absolute bottom-0 left-1/2 block h-10 w-10 -translate-x-1/2 translate-y-1/2 rounded-full bg-gold/30">
              <span className="hotspot-pulse absolute inset-0 rounded-full" />
            </span>
            <svg className="loc-pin relative h-16 w-12 drop-shadow-[0_10px_14px_rgba(14,13,11,.35)]" viewBox="0 0 48 64">
              <path d="M24 0C10.7 0 0 10.6 0 23.8 0 41.6 24 64 24 64s24-22.4 24-40.2C48 10.6 37.3 0 24 0Z" fill="#B79342" />
              <path d="M24 0C10.7 0 0 10.6 0 23.8 0 41.6 24 64 24 64s24-22.4 24-40.2C48 10.6 37.3 0 24 0Z" fill="url(#pin-sheen)" />
              <circle cx="24" cy="23" r="13" fill="#F4F1EA" />
              <path d="M24 13.5l2.6 6.4 6.9.5-5.3 4.4 1.7 6.7L24 27.8l-5.9 3.7 1.7-6.7-5.3-4.4 6.9-.5Z" fill="#776B27" />
              <defs>
                <linearGradient id="pin-sheen" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity=".45" />
                  <stop offset=".5" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Foto da fachada (na frente) — encolhe até a miniatura do cartão */}
        <div className="loc-photo absolute inset-0 z-20 overflow-hidden will-change-transform motion-reduce:hidden">
          <div className="loc-photo-img absolute inset-0">
            <Media k="loja-fachada" alt={`Fachada do ${site.store.venue}, ${site.store.street}`} fill sizes="100vw" className="object-cover object-[50%_45%]" />
          </div>
          <div className="loc-veil absolute inset-0 bg-gradient-to-b from-ink/25 via-ink/5 via-45% to-ink/90" aria-hidden />
        </div>

        {/* Título sobre a fachada */}
        <div className="loc-intro pointer-events-none absolute inset-x-5 bottom-[9svh] z-30 text-ivory md:inset-x-8 lg:left-[max(2rem,calc((100vw-1600px)/2+2rem))] lg:max-w-3xl motion-reduce:hidden">
          <p className="eyebrow text-gold">Onde estamos</p>
          <h2 id={`${id}-title`} className="mt-4 font-serif text-[clamp(2.4rem,5.4vw,5.5rem)] leading-[0.95]">
            A VALUT te espera no <span className="serif-italic">{site.store.venue}</span>
          </h2>
          <p className="mt-5 flex items-center gap-2 text-[15px] text-ivory/85">
            <IconPin width={18} className="text-gold" /> {site.store.street}
          </p>
          <p className="mt-8 text-[11px] tracking-[0.2em] text-ivory/60 uppercase">Role para ver o mapa ↓</p>
        </div>

        {/* Cartão com endereço e rotas */}
        <div className="loc-card absolute inset-x-3 bottom-3 z-30 rounded-[24px] bg-ivory p-4 text-ink shadow-[0_30px_60px_-25px_rgba(14,13,11,.55)] sm:inset-x-auto sm:left-6 sm:w-[400px] md:bottom-8 md:left-8 md:p-6 lg:left-[max(2rem,calc((100vw-1600px)/2+2rem))]">
          <div className="flex gap-4">
            <div data-loc-thumb className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-[14px] bg-marble md:w-36">
              <Media k="loja-fachada" alt="" aria-hidden fill sizes="150px" className="loc-thumb-img object-cover object-[50%_45%] opacity-0 motion-reduce:opacity-100" />
            </div>
            <div className="min-w-0">
              <p className="eyebrow text-[10px] text-gold-deep">Loja física</p>
              <h3 className="mt-1 font-serif text-[22px] leading-tight md:text-[26px]">{site.store.venue}</h3>
              <address className="mt-1 text-[13px] leading-snug text-ink/70 not-italic">
                {site.store.street}
                <br />
                {site.store.district} · {site.store.city}/{site.store.state}
              </address>
            </div>
          </div>
          <ul className="mt-3 space-y-0.5 border-t border-ink/10 pt-3 text-[13px] text-ink/70">
            {site.store.hours.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            <PillLink href={site.store.directionsUrl} external label="Como chegar" icon={<IconArrow width={16} />} />
            <a href={site.store.mapsUrl} target="_blank" rel="noopener noreferrer" className="link-draw text-[13px] font-medium">
              Google Maps
            </a>
            <a href={site.store.wazeUrl} target="_blank" rel="noopener noreferrer" className="link-draw text-[13px] font-medium">
              Waze
            </a>
          </div>
          <p className="mt-3 text-[10px] text-ink/40">Imagem da fachada: Google Street View</p>
        </div>

        {/* Ativar/desativar o mapa (evita prender a rolagem) */}
        <div className="loc-explore absolute top-[calc(var(--header-h)+12px)] right-3 z-30 md:top-auto md:right-8 md:bottom-8">
          <button
            type="button"
            onClick={() => setInteractive((v) => !v)}
            aria-pressed={interactive}
            className={cn(
              'flex h-11 items-center gap-2 rounded-full px-5 text-[13px] font-medium shadow-[0_12px_30px_-14px_rgba(14,13,11,.6)] transition-colors duration-300',
              interactive ? 'bg-ink text-ivory' : 'bg-ivory/95 text-ink backdrop-blur hover:bg-ivory',
            )}
          >
            {interactive ? (
              <>
                <IconClose width={16} /> Fechar mapa
              </>
            ) : (
              <>
                <IconPin width={16} className="text-gold-deep" /> Explorar o mapa
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
