'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { site } from '@/data/site';
import { variantLabels } from '@/data/products';
import { cartLines, cartSubtotal, startCheckout } from '@/lib/checkout';
import { cn, formatPrice } from '@/lib/format';
import { getLenis } from '@/lib/lenis';
import { cartCount, useShop } from '@/lib/store';
import { IconClose, IconMinus, IconPlus } from '@/components/ui/Icons';
import { Media } from '@/components/ui/Media';
import { PillLink } from '@/components/ui/Buttons';
import { TransitionLink } from '@/components/ui/TransitionLink';

const spring = { type: 'spring', stiffness: 260, damping: 32, mass: 0.9 } as const;

/** Sacola em drawer lateral: spring suave, remoção com layout animation, barra de frete grátis. */
export function CartDrawer() {
  const open = useShop((s) => s.cartOpen);
  const setOpen = useShop((s) => s.setCartOpen);
  const cart = useShop((s) => s.cart);
  const remove = useShop((s) => s.remove);
  const setQty = useShop((s) => s.setQty);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const lines = cartLines(cart);
  const subtotal = cartSubtotal(cart);
  const missing = Math.max(0, site.freeShippingThreshold - subtotal);
  const progress = Math.min(1, subtotal / site.freeShippingThreshold);

  useEffect(() => {
    const lenis = getLenis();
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement;
      lenis?.stop();
      requestAnimationFrame(() => closeRef.current?.focus());
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
    lenis?.start();
    lastFocus.current?.focus?.();
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <motion.button
            type="button"
            aria-label="Fechar sacola"
            tabIndex={-1}
            className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            className="absolute top-0 right-0 flex h-full w-full max-w-[460px] flex-col bg-ivory text-ink shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={spring}
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <h2 id="cart-title" className="font-serif text-2xl">
                Sacola <span className="font-sans text-sm text-ink/60">({cartCount(cart)})</span>
              </h2>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5" aria-label="Fechar sacola">
                <IconClose />
              </button>
            </div>

            <div className="border-b border-ink/10 px-6 py-4">
              <p className="text-sm" aria-live="polite">
                {missing > 0 ? (
                  <>
                    Faltam <strong>{formatPrice(missing)}</strong> para o frete grátis
                  </>
                ) : (
                  <strong className="text-gold-deep">Você ganhou frete grátis ✦</strong>
                )}
              </p>
              <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Progresso para frete grátis">
                <motion.div className="h-full origin-left bg-gold" initial={false} animate={{ scaleX: progress }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4" data-lenis-prevent>
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="font-serif text-3xl italic">Sua sacola está vazia.</p>
                  <p className="mt-2 text-sm text-ink/60">Que tal começar pelas novidades?</p>
                  <PillLink href="/colecao" label="Explorar coleção" className="mt-6" onClick={() => setOpen(false)} />
                </div>
              ) : (
                <ul className="divide-y divide-ink/10">
                  <AnimatePresence initial={false}>
                    {lines.map(({ item, product }) => (
                      <motion.li
                        key={`${item.slug}-${item.variant}`}
                        layout
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -60, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.4, ease: [0.76, 0, 0.24, 1] } }}
                        transition={spring}
                        className="flex gap-4 overflow-hidden py-4"
                      >
                        <TransitionLink href={`/produto/${product.slug}`} onClick={() => setOpen(false)} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-marble">
                          <Media k={product.images[0].key} alt={product.images[0].alt} fill sizes="96px" className={product.images[0].key === 'joia-rubi-recorte' ? 'object-contain p-2' : 'object-cover'} />
                        </TransitionLink>
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between gap-2">
                            <p className="font-serif text-lg leading-tight">{product.name}</p>
                            <p className="text-sm font-medium">{formatPrice(product.price * item.qty)}</p>
                          </div>
                          <p className="text-xs text-ink/60">{variantLabels[item.variant]}</p>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center rounded-full border border-ink/20">
                              <button type="button" className="grid h-8 w-8 place-items-center" onClick={() => setQty(item.slug, item.variant, item.qty - 1)} aria-label={`Diminuir quantidade de ${product.name}`}>
                                <IconMinus width={14} />
                              </button>
                              <span className="w-6 text-center text-sm tabular-nums" aria-live="polite">
                                {item.qty}
                              </span>
                              <button type="button" className="grid h-8 w-8 place-items-center" onClick={() => setQty(item.slug, item.variant, item.qty + 1)} aria-label={`Aumentar quantidade de ${product.name}`}>
                                <IconPlus width={14} />
                              </button>
                            </div>
                            <button type="button" onClick={() => remove(item.slug, item.variant)} className="link-draw text-xs text-ink/70">
                              Remover
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <div className="border-t border-ink/10 px-6 py-5">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <p className="mt-1 text-xs text-ink/60">Frete e pagamento combinados na finalização. {site.shipping}.</p>
                <a
                  href={startCheckout(cart)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn('roll-host mt-4 flex h-14 w-full items-center justify-center rounded-full bg-ink text-[15px] font-medium text-ivory transition-colors hover:bg-gold hover:text-ink')}
                >
                  Finalizar pelo WhatsApp
                </a>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
