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
        <FavoriteButton slug={product.slug} name={product.name} className="absolute top-3 right-3" />
      </div>

      <div className={cn('mt-4 flex flex-1 flex-col', dark ? 'text-ivory' : 'text-ink')}>
        <p className={cn('eyebrow', dark ? 'text-gold' : 'text-gold-deep')}>{categoryName(product.category)}</p>
        <h3 className="mt-1 font-serif text-xl leading-tight">
          <TransitionLink href={`/produto/${product.slug}`} className="link-draw">
            {product.name}
          </TransitionLink>
        </h3>
        <p className="mt-2 flex items-baseline gap-2 text-[15px]">
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
            'roll-host relative mt-4 h-11 overflow-hidden rounded-full border text-sm font-medium transition-colors duration-300',
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
