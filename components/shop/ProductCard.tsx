'use client';

import { MouseEvent, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { categoryName } from '@/data/categories';
import { Product } from '@/data/products';
import { flyToCart } from '@/lib/flyToCart';
import { cn, formatPrice } from '@/lib/format';
import { useShop } from '@/lib/store';
import { Media } from '@/components/ui/Media';
import { TransitionLink } from '@/components/ui/TransitionLink';
import { FavoriteButton } from './FavoriteButton';
import { IconBag } from '@/components/ui/Icons';

type Props = { product: Product; priority?: boolean; tone?: 'light' | 'dark'; className?: string; sizes?: string };

export const productVtName = (slug: string) => `product-${slug}`;

/**
 * Card de produto (ref. Sparkle): selo "Sale", preço antigo riscado, favorito,
 * troca para a 2ª foto no hover e "Adicionar à sacola" com a miniatura voando.
 * O clique na imagem leva ao produto com elemento compartilhado (View Transitions).
 */
export function ProductCard({ product, priority, tone = 'light', className, sizes = '(min-width: 1024px) 25vw, 50vw' }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const add = useShop((s) => s.add);
  const [added, setAdded] = useState(false);
  const [first, second] = product.images;
  const onSale = Boolean(product.compareAt);
  const dark = tone === 'dark';

  const markShared = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget.querySelector<HTMLElement>('[data-vt]');
    if (el) el.style.viewTransitionName = productVtName(product.slug);
  };

  const onAdd = async () => {
    setAdded(true);
    await flyToCart(frame.current);
    add(product.slug, product.variants[0]);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article className={cn('group/card relative flex flex-col', className)} data-product-card>
      <div className="relative">
        <TransitionLink href={`/produto/${product.slug}`} viewTransition onClick={markShared} data-cursor="Ver" aria-label={`Ver ${product.name}`} className="block">
          <div ref={frame} data-vt className={cn('relative aspect-[4/5] overflow-hidden rounded-[22px]', dark ? 'bg-white/5' : 'bg-marble')}>
            <Media
              k={first.key}
              alt={first.alt}
              fill
              sizes={sizes}
              priority={priority}
              className={cn(
                'transition-[opacity,transform] duration-[900ms] ease-[var(--ease-expo)] group-hover/card:scale-105',
                first.key === 'joia-rubi-recorte' ? 'object-contain p-6' : 'object-cover',
                second && 'group-hover/card:opacity-0',
              )}
            />
            {second && (
              <Media
                k={second.key}
                alt=""
                aria-hidden
                fill
                sizes={sizes}
                className={cn(
                  'scale-105 opacity-0 transition-[opacity,transform] duration-[900ms] ease-[var(--ease-expo)] group-hover/card:scale-100 group-hover/card:opacity-100',
                  second.key === 'joia-rubi-recorte' ? 'object-contain p-6' : 'object-cover',
                )}
              />
            )}
          </div>
        </TransitionLink>
        {onSale && (
          <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-ruby px-3 py-1 text-[11px] font-medium tracking-wider text-ivory uppercase">Sale</span>
        )}
        <FavoriteButton slug={product.slug} name={product.name} className="absolute top-2.5 right-2.5 md:top-3 md:right-3" />
        {/* Mobile: botão compacto de sacola sobre a foto */}
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Adicionar ${product.name} à sacola`}
          className={cn(
            'absolute right-2.5 bottom-2.5 grid h-11 w-11 place-items-center rounded-full shadow-[0_8px_20px_-8px_rgba(14,13,11,.5)] transition-[transform,background-color] duration-300 active:scale-90 md:hidden',
            added ? 'bg-gold text-ink' : 'bg-ink text-ivory',
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={added ? 'ok' : 'add'} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ duration: 0.25 }}>
              {added ? '✓' : <IconBag width={18} height={18} />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      <div className={cn('mt-3 flex flex-1 flex-col md:mt-4', dark ? 'text-ivory' : 'text-ink')}>
        <p className={cn('eyebrow text-[10px] md:text-[11px]', dark ? 'text-gold' : 'text-gold-deep')}>{categoryName(product.category)}</p>
        <h3 className="mt-1 font-serif text-[17px] leading-tight md:text-xl">
          <TransitionLink href={`/produto/${product.slug}`} className="link-draw">
            {product.name}
          </TransitionLink>
        </h3>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-[14px] md:mt-2 md:text-[15px]">
          <span className="font-medium">{formatPrice(product.price)}</span>
          {product.compareAt && (
            <span className={cn('text-sm line-through', dark ? 'text-ivory/50' : 'text-ink/50')}>
              <span className="sr-only">de </span>
              {formatPrice(product.compareAt)}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={onAdd}
          className={cn(
            'roll-host relative mt-4 hidden h-11 overflow-hidden rounded-full border text-sm font-medium transition-colors duration-300 md:block',
            dark ? 'border-ivory/40 hover:bg-ivory hover:text-ink' : 'border-ink/25 hover:border-ink hover:bg-ink hover:text-ivory',
          )}
          aria-label={`Adicionar ${product.name} à sacola`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={added ? 'ok' : 'add'}
              className="absolute inset-0 grid place-items-center"
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              exit={{ y: '-100%' }}
              transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
            >
              {added ? 'Na sacola ✓' : 'Adicionar à sacola'}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col">
      <div className="shimmer aspect-[4/5] rounded-[22px]" />
      <div className="shimmer mt-4 h-3 w-16 rounded-full" />
      <div className="shimmer mt-3 h-5 w-3/4 rounded-full" />
      <div className="shimmer mt-3 h-4 w-24 rounded-full" />
      <div className="shimmer mt-4 h-11 rounded-full" />
    </div>
  );
}
