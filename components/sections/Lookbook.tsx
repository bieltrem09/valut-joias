'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Look, looks } from '@/data/lookbook';
import { getProduct, Product } from '@/data/products';
import { gsap, useGSAP } from '@/lib/gsap';
import { mq } from '@/lib/animations';
import { cn, formatPrice } from '@/lib/format';
import { getLenis } from '@/lib/lenis';
import { useShop } from '@/lib/store';
import { Media } from '@/components/ui/Media';
import { IconBag, IconClose } from '@/components/ui/Icons';
import { RevealText } from '@/components/ui/Reveal';
import { TransitionLink } from '@/components/ui/TransitionLink';

const tones: Record<Look['tone'], string> = {
  blush: 'bg-[#e7c3d3] text-ink',
  olive: 'bg-olive text-ink',
  ivory: 'bg-ivory text-ink',
  marble: 'bg-marble text-ink',
};

/**
 * Lookbook em cards empilhados: cada foto nova sobe (sticky) e cobre a
 * anterior, que encolhe e escurece. Hotspots com pulso dourado abrem o painel
 * "Comprar o look" com as peças da foto.
 */
export function Lookbook() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<{ look: Look; focus?: string } | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(mq.motion, () => {
        const cards = gsap.utils.toArray<HTMLElement>('.lb-card', root.current);
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          gsap.to(card.querySelector('.lb-inner'), {
            scale: 0.9,
            filter: 'brightness(0.55)',
            ease: 'none',
            scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 12%', scrub: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="lookbook-title" className="relative px-3 pt-24 pb-10 md:px-6">
      <div className="mx-auto max-w-[1600px] px-2 md:px-2">
        <p className="eyebrow text-gold-deep">Lookbook editorial</p>
        <RevealText as="h2" id="lookbook-title" className="mt-3 max-w-3xl font-serif text-[length:var(--text-title)] leading-[0.95]">
          Joias que viram <span className="serif-italic">parte da história</span>
        </RevealText>
      </div>

      <ol className="mx-auto mt-14 max-w-[1600px]">
        {looks.map((look, i) => (
          <li key={look.id} className="lb-card sticky top-[9svh] mb-[6svh] h-[86svh] min-h-[560px]">
            <article className={cn('lb-inner grid h-full grid-rows-[1fr_auto] md:grid-rows-1 origin-top overflow-hidden rounded-[var(--radius-card)] will-change-transform md:grid-cols-[1.25fr_1fr]', tones[look.tone])}>
              <div className="relative min-h-0 overflow-hidden">
                <Media k={look.image} alt={look.alt} fill sizes="(min-width:768px) 55vw, 100vw" className="object-cover" />
                {look.spots.map((s) => {
                  const p = getProduct(s.slug);
                  if (!p) return null;
                  return (
                    <button
                      key={s.slug}
                      type="button"
                      onClick={() => setOpen({ look, focus: s.slug })}
                      className="group absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${s.x}%`, top: `${s.y}%` }}
                      aria-label={`Ver ${p.name} neste look`}
                    >
                      <span className="hotspot-pulse grid h-7 w-7 place-items-center rounded-full border border-ivory/80 bg-gold/80 backdrop-blur">
                        <span className="h-2 w-2 rounded-full bg-ivory" />
                      </span>
                      <span className="pointer-events-none absolute top-1/2 left-9 -translate-y-1/2 whitespace-nowrap rounded-full bg-ivory px-3 py-1 text-xs text-ink opacity-0 shadow transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                        {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col justify-between p-6 md:p-10 lg:p-14">
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Look {look.id}</span>
                  <span className="eyebrow tabular-nums opacity-60">
                    {String(i + 1).padStart(2, '0')} / {String(looks.length).padStart(2, '0')}
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-[clamp(2rem,4vw,4rem)] leading-[0.95]">{look.title}</h3>
                  <p className="mt-4 max-w-sm text-[15px] opacity-75">{look.spots.length} {look.spots.length === 1 ? 'peça' : 'peças'} neste look. Toque nos pontos dourados para conhecer cada uma.</p>
                  <button
                    type="button"
                    onClick={() => setOpen({ look })}
                    className="roll-host mt-8 inline-flex h-12 items-center gap-3 rounded-full bg-ink px-6 text-sm font-medium text-ivory transition-colors hover:bg-gold hover:text-ink"
                  >
                    <IconBag width={18} /> Comprar o look
                  </button>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ol>

      <ShopTheLook state={open} onClose={() => setOpen(null)} />
    </section>
  );
}

function ShopTheLook({ state, onClose }: { state: { look: Look; focus?: string } | null; onClose: () => void }) {
  const add = useShop((s) => s.add);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const products = (state?.look.spots.map((s) => getProduct(s.slug)).filter(Boolean) ?? []) as Product[];

  useEffect(() => {
    const lenis = getLenis();
    if (!state) return;
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      lenis?.start();
    };
  }, [state, onClose]);

  return (
    <AnimatePresence>
      {state && (
        <div className="fixed inset-0 z-[80]">
          <motion.div className="absolute inset-0 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Comprar o look ${state.look.id}`}
            className="absolute top-0 right-0 flex h-full w-full max-w-[440px] flex-col bg-ivory text-ink"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 32 }}
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <div>
                <p className="eyebrow text-gold-deep">Look {state.look.id}</p>
                <h2 className="font-serif text-2xl">Comprar o look</h2>
              </div>
              <button type="button" autoFocus onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5" aria-label="Fechar">
                <IconClose />
              </button>
            </div>
            <ul className="flex-1 space-y-4 overflow-y-auto p-6">
              {products.map((p, i) => (
                <motion.li
                  key={p.slug}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className={cn('flex gap-4 rounded-2xl p-3 transition-colors', state.focus === p.slug ? 'bg-marble ring-1 ring-gold' : '')}
                >
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-marble">
                    <Media k={p.images[0].key} alt={p.images[0].alt} fill sizes="96px" className={p.images[0].key === 'joia-rubi-recorte' ? 'object-contain p-2' : 'object-cover'} />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <TransitionLink href={`/produto/${p.slug}`} onClick={onClose} className="link-draw self-start font-serif text-lg leading-tight">
                      {p.name}
                    </TransitionLink>
                    <p className="mt-1 text-sm">
                      {formatPrice(p.price)}
                      {p.compareAt && <span className="ml-2 text-ink/50 line-through">{formatPrice(p.compareAt)}</span>}
                    </p>
                    <button
                      type="button"
                      onClick={() => add(p.slug, p.variants[0])}
                      className="mt-auto h-10 rounded-full border border-ink/25 text-sm transition-colors hover:bg-ink hover:text-ivory"
                    >
                      Adicionar à sacola
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
            <div className="border-t border-ink/10 p-6">
              <button
                type="button"
                onClick={() => {
                  products.forEach((p) => add(p.slug, p.variants[0]));
                  onClose();
                  setTimeout(() => setCartOpen(true), 350);
                }}
                className="h-14 w-full rounded-full bg-ink text-[15px] font-medium text-ivory transition-colors hover:bg-gold hover:text-ink"
              >
                Adicionar o look completo
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
