'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useShop } from '@/lib/store';
import { cn } from '@/lib/format';

/** Coração de favorito com preenchimento animado e "estouro" de partículas douradas. */
export function FavoriteButton({ slug, name, className }: { slug: string; name: string; className?: string }) {
  const active = useShop((s) => s.favorites.includes(slug));
  const toggle = useShop((s) => s.toggleFavorite);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      aria-pressed={active}
      aria-label={active ? `Remover ${name} dos favoritos` : `Adicionar ${name} aos favoritos`}
      className={cn('grid h-10 w-10 place-items-center rounded-full bg-ivory/85 text-ink backdrop-blur transition-colors hover:bg-ivory', className)}
    >
      <motion.svg viewBox="0 0 24 24" width="18" height="18" aria-hidden animate={{ scale: active ? [1, 1.35, 1] : 1 }} transition={{ duration: 0.45 }}>
        <path d="M12 20s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <motion.path
          d="M12 20s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z"
          fill="var(--color-ruby)"
          initial={false}
          animate={{ clipPath: active ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)' }}
          transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
        />
      </motion.svg>
      <AnimatePresence>
        {active &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute h-1 w-1 rounded-full bg-gold"
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: Math.cos((i / 6) * Math.PI * 2) * 18, y: Math.sin((i / 6) * Math.PI * 2) * 18, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          ))}
      </AnimatePresence>
    </button>
  );
}
