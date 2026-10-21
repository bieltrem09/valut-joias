'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { site } from '@/data/site';
import { getProduct, variantLabels, type Variant } from '@/data/products';
import { cartLines, cartSubtotal, startCheckout } from '@/lib/checkout';
import { cn, formatPrice } from '@/lib/format';
import { setScrollLock } from '@/lib/lenis';
import { cartCount, useShop } from '@/lib/store';
import { IconArrow, IconBag, IconClose, IconMinus, IconPlus, IconShield, IconSpark, IconTrash, IconTruck, IconWhatsapp } from '@/components/ui/Icons';
import { Media } from '@/components/ui/Media';
import { PillLink } from '@/components/ui/Buttons';
import { TransitionLink } from '@/components/ui/TransitionLink';

const spring = { type: 'spring', stiffness: 260, damping: 32, mass: 0.9 } as const;
const expo = [0.16, 1, 0.3, 1] as const;

/** Entrada em cascata dos blocos internos depois que o painel desliza. */
const rise = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: expo, delay: 0.12 + i * 0.06 } },
});

const swatch: Record<Variant, string> = {
  dourado: 'bg-[linear-gradient(135deg,#e9cf8a,#b79342_55%,#776b27)]',
  rodio: 'bg-[linear-gradient(135deg,#f4f4f4,#bfc3c7_55%,#8a8f94)]',
};

/** Número que troca rolando na vertical (quantidade, totais). */
function Ticker({ value, className }: { value: string | number; className?: string }) {
  return (
    <span className={cn('relative inline-flex overflow-hidden', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.35, ease: expo }}
          className="inline-block tabular-nums"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Sacola em drawer lateral: resumo do pedido, frete grátis, sugestões e finalização pelo WhatsApp. */
export function CartDrawer() {
  const open = useShop((s) => s.cartOpen);
  const setOpen = useShop((s) => s.setCartOpen);
  const cart = useShop((s) => s.cart);
  const remove = useShop((s) => s.remove);
  const setQty = useShop((s) => s.setQty);
  const add = useShop((s) => s.add);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const lines = cartLines(cart);
  const count = cartCount(cart);
  const subtotal = cartSubtotal(cart);
  const savings = lines.reduce((s, { item, product }) => s + (product.compareAt ? (product.compareAt - product.price) * item.qty : 0), 0);
  const missing = Math.max(0, site.freeShippingThreshold - subtotal);
  const progress = Math.min(1, subtotal / site.freeShippingThreshold);
  const freeShipping = missing === 0;

  // "Complete o look": peças que combinam com o que já está na sacola.
  const inCart = new Set(cart.map((i) => i.slug));
  const suggestions = [...new Set(lines.flatMap(({ product }) => product.pairsWith ?? []))]
    .filter((slug) => !inCart.has(slug))
    .map((slug) => getProduct(slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 2);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement;
    setScrollLock('cart', true);
    requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      setScrollLock('cart', false);
      lastFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <motion.button
            type="button"
            aria-label="Fechar sacola"
            tabIndex={-1}
            className="absolute inset-0 cursor-default bg-ink/45 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            className="absolute top-0 right-0 flex h-full w-full max-w-[480px] flex-col bg-ivory text-ink shadow-[-24px_0_80px_-20px_rgb(14_13_11/0.35)] sm:rounded-l-[28px] sm:overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={spring}
          >
            {/* Cabeçalho */}
            <motion.header {...rise(0)} className="flex items-end justify-between px-6 pt-5 pb-4 sm:px-8 sm:pt-8 sm:pb-5">
              <div>
                <p className="eyebrow flex items-center gap-2 text-gold-deep">
                  <IconSpark width={10} height={10} /> Sua seleção
                </p>
                <h2 id="cart-title" className="mt-2 flex items-center gap-3 font-serif text-[30px] leading-none sm:text-[34px]">
                  Sacola
                  <span className="grid h-7 min-w-7 place-items-center rounded-full bg-ink px-2 font-sans text-[12px] font-medium text-ivory" aria-label={`${count} ${count === 1 ? 'item' : 'itens'}`}>
                    <Ticker value={count} />
                  </span>
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="group grid h-11 w-11 place-items-center rounded-full border border-ink/15 transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-ivory"
                aria-label="Fechar sacola"
              >
                <IconClose className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:rotate-90" />
              </button>
            </motion.header>

            {/* Frete grátis */}
            {lines.length > 0 && (
              <motion.div {...rise(1)} className="mx-6 shrink-0 rounded-2xl bg-marble/70 px-4 py-3 sm:mx-8 sm:py-3.5">
                <div className="flex items-center gap-3">
                  <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors duration-500', freeShipping ? 'bg-gold text-ink' : 'bg-ivory text-gold-deep')}>
                    <IconTruck width={18} height={18} />
                  </span>
                  <p className="text-[13px] leading-snug" aria-live="polite">
                    {freeShipping ? (
                      <strong className="font-medium text-gold-deep">Parabéns! Você ganhou frete grátis.</strong>
                    ) : (
                      <>
                        Faltam <strong className="font-semibold">{formatPrice(missing)}</strong> para ganhar <span className="font-medium">frete grátis</span>
                      </>
                    )}
                  </p>
                </div>
                <div
                  className="relative mt-3 h-[5px] overflow-hidden rounded-full bg-ink/10"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress * 100)}
                  aria-label="Progresso para frete grátis"
                >
                  <motion.div
                    className="cart-progress h-full origin-left rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: progress }}
                    transition={{ duration: 1, ease: expo, delay: 0.25 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Itens */}
            <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 sm:px-8" data-lenis-prevent>
              {lines.length === 0 ? (
                <motion.div {...rise(1)} className="flex h-full flex-col items-center justify-center pb-10 text-center">
                  <div className="relative grid h-28 w-28 place-items-center">
                    <span className="absolute inset-0 rounded-full bg-marble" />
                    <span className="absolute inset-3 rounded-full border border-dashed border-gold/50 badge-spin" />
                    <motion.span
                      className="relative text-gold-deep"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <IconBag width={40} height={40} strokeWidth={1.1} />
                    </motion.span>
                  </div>
                  <p className="mt-7 font-serif text-[32px] leading-tight italic">Sua sacola está vazia</p>
                  <p className="mt-2 max-w-[28ch] text-sm text-ink/60">Descubra peças banhadas a ouro feitas para brilhar todos os dias.</p>
                  <PillLink href="/colecao" label="Explorar coleção" className="mt-7" onClick={() => setOpen(false)} />
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {[
                      ['Brincos', '/colecao?categoria=brincos'],
                      ['Colares', '/colecao?categoria=colares'],
                      ['Anéis', '/colecao?categoria=aneis'],
                    ].map(([label, href]) => (
                      <TransitionLink
                        key={href}
                        href={href}
                        onClick={() => setOpen(false)}
                        className="rounded-full border border-ink/15 px-4 py-1.5 text-[13px] transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-ivory"
                      >
                        {label}
                      </TransitionLink>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <>
                  <ul className="mt-3 space-y-3">
                    <AnimatePresence initial={false}>
                      {lines.map(({ item, product }, i) => (
                        <motion.li
                          key={`${item.slug}-${item.variant}`}
                          layout
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: 0.55, ease: expo, delay: 0.18 + Math.min(i, 5) * 0.06 } }}
                          exit={{ opacity: 0, x: -40, transition: { duration: 0.35, ease: [0.76, 0, 0.24, 1] } }}
                          transition={spring}
                          className="group/item flex gap-4 rounded-2xl border border-ink/[0.07] bg-white/55 p-3 transition-colors duration-300 hover:border-ink/15 hover:bg-white/80"
                        >
                          <TransitionLink href={`/produto/${product.slug}`} onClick={() => setOpen(false)} className="relative h-[112px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-marble">
                            <Media
                              k={product.images[0].key}
                              alt={product.images[0].alt}
                              fill
                              sizes="96px"
                              className={cn(
                                'transition-transform duration-700 ease-[var(--ease-expo)] group-hover/item:scale-[1.06]',
                                product.images[0].key === 'joia-rubi-recorte' ? 'object-contain p-2' : 'object-cover',
                              )}
                            />
                          </TransitionLink>
                          <div className="flex min-w-0 flex-1 flex-col py-0.5">
                            <div className="flex items-start justify-between gap-2">
                              <TransitionLink href={`/produto/${product.slug}`} onClick={() => setOpen(false)} className="font-serif text-[17px] leading-[1.2] hover:text-gold-deep">
                                {product.name}
                              </TransitionLink>
                              <button
                                type="button"
                                onClick={() => remove(item.slug, item.variant)}
                                className="-mt-1 -mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink/45 transition-colors duration-300 hover:bg-ruby/10 hover:text-ruby"
                                aria-label={`Remover ${product.name} da sacola`}
                              >
                                <IconTrash width={16} height={16} />
                              </button>
                            </div>
                            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink/60">
                              <span className={cn('h-2.5 w-2.5 rounded-full ring-1 ring-ink/10', swatch[item.variant])} aria-hidden />
                              {variantLabels[item.variant]}
                              <span className="text-ink/25">·</span>
                              {formatPrice(product.price)} un.
                            </p>
                            <div className="mt-auto flex items-end justify-between pt-3">
                              <div className="flex h-9 items-center rounded-full border border-ink/15 bg-ivory">
                                <button
                                  type="button"
                                  className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-ink/5 disabled:opacity-30"
                                  onClick={() => setQty(item.slug, item.variant, item.qty - 1)}
                                  disabled={item.qty <= 1}
                                  aria-label={`Diminuir quantidade de ${product.name}`}
                                >
                                  <IconMinus width={14} />
                                </button>
                                <span className="w-6 text-center text-sm font-medium" aria-live="polite">
                                  <Ticker value={item.qty} />
                                </span>
                                <button
                                  type="button"
                                  className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-ink/5"
                                  onClick={() => setQty(item.slug, item.variant, item.qty + 1)}
                                  aria-label={`Aumentar quantidade de ${product.name}`}
                                >
                                  <IconPlus width={14} />
                                </button>
                              </div>
                              <div className="text-right leading-tight">
                                {product.compareAt && <p className="text-[11px] text-ink/40 line-through">{formatPrice(product.compareAt * item.qty)}</p>}
                                <p className="text-[15px] font-semibold">
                                  <Ticker value={formatPrice(product.price * item.qty)} />
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>

                  <ul className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-ink/[0.07] px-4 py-3 text-[11px] leading-tight text-ink/60">
                    <li className="flex items-center gap-2">
                      <IconShield width={16} height={16} className="shrink-0 text-gold-deep" /> Garantia de {site.warrantyYears} ano
                    </li>
                    <li className="flex items-center gap-2">
                      <IconTruck width={16} height={16} className="shrink-0 text-gold-deep" /> Envio para todo o Brasil
                    </li>
                  </ul>

                  {suggestions.length > 0 && (
                    <motion.section {...rise(4)} className="mt-7" aria-label="Complete o look">
                      <p className="eyebrow text-ink/55">Complete o look</p>
                      <ul className="mt-3 grid grid-cols-2 gap-3">
                        {suggestions.map((p) => (
                          <li key={p.slug} className="group/sug flex flex-col overflow-hidden rounded-2xl border border-ink/[0.07] bg-white/55">
                            <TransitionLink href={`/produto/${p.slug}`} onClick={() => setOpen(false)} className="relative aspect-[4/3] overflow-hidden bg-marble">
                              <Media
                                k={p.images[0].key}
                                alt={p.images[0].alt}
                                fill
                                sizes="200px"
                                className={cn(
                                  'transition-transform duration-700 ease-[var(--ease-expo)] group-hover/sug:scale-[1.06]',
                                  p.images[0].key === 'joia-rubi-recorte' ? 'object-contain p-2' : 'object-cover',
                                )}
                              />
                            </TransitionLink>
                            <div className="flex flex-1 flex-col p-3">
                              <p className="line-clamp-2 text-[13px] leading-snug">{p.name}</p>
                              <div className="mt-auto flex items-center justify-between pt-2">
                                <span className="text-[13px] font-semibold">{formatPrice(p.price)}</span>
                                <button
                                  type="button"
                                  onClick={() => add(p.slug, p.variants[0])}
                                  className="grid h-8 w-8 place-items-center rounded-full bg-ink text-ivory transition-[transform,background-color,color] duration-300 hover:bg-gold hover:text-ink active:scale-90"
                                  aria-label={`Adicionar ${p.name} à sacola`}
                                >
                                  <IconPlus width={14} />
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </motion.section>
                  )}
                </>
              )}
            </div>

            {/* Resumo e finalização */}
            {lines.length > 0 && (
              <motion.footer
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: expo, delay: 0.2 } }}
                className="shrink-0 border-t border-ink/10 bg-ivory px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_30px_-18px_rgb(14_13_11/0.25)] sm:px-8 sm:pt-5 sm:pb-6"
              >
                <dl className="space-y-1 text-[13px]">
                  <div className="hidden justify-between text-ink/70 sm:flex">
                    <dt>Subtotal ({count} {count === 1 ? 'item' : 'itens'})</dt>
                    <dd className="tabular-nums">{formatPrice(subtotal + savings)}</dd>
                  </div>
                  {savings > 0 && (
                    <div className="hidden justify-between text-gold-deep sm:flex">
                      <dt>Descontos</dt>
                      <dd className="tabular-nums">− {formatPrice(savings)}</dd>
                    </div>
                  )}
                  <div className="hidden justify-between text-ink/70 sm:flex">
                    <dt>Frete</dt>
                    <dd>{freeShipping ? <span className="font-medium text-gold-deep">Grátis</span> : 'Calculado no atendimento'}</dd>
                  </div>
                  <div className="flex items-end justify-between text-ink sm:border-t sm:border-dashed sm:border-ink/15 sm:pt-2.5">
                    <dt className="text-[15px] font-medium">
                      Total
                      {savings > 0 && <span className="block text-[12px] font-normal text-gold-deep sm:hidden">Você economiza {formatPrice(savings)}</span>}
                    </dt>
                    <dd className="font-serif text-[24px] leading-none sm:text-[28px]">
                      <Ticker value={formatPrice(subtotal)} />
                    </dd>
                  </div>
                </dl>

                <a
                  href={startCheckout(cart)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative mt-3.5 flex h-[52px] w-full sm:mt-4 sm:h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-ink text-[15px] font-medium text-ivory transition-colors duration-300 hover:bg-gold hover:text-ink active:scale-[0.99]"
                >
                  <span className="cart-cta-shine" aria-hidden />
                  <IconWhatsapp width={19} height={19} />
                  Finalizar pedido pelo WhatsApp
                  <IconArrow width={16} height={16} className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1" />
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="link-draw mx-auto mt-3 hidden text-[13px] text-ink/65 sm:block"
                >
                  Continuar comprando
                </button>

              </motion.footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
