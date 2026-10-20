'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { getProduct, Product } from '@/data/products';
import { useShop } from '@/lib/store';
import { PageHeader } from '@/components/ui/PageHeader';
import { PillLink } from '@/components/ui/Buttons';
import { ProductCard } from '@/components/shop/ProductCard';

export function FavoritesView() {
  const favorites = useShop((s) => s.favorites);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const list = mounted ? (favorites.map(getProduct).filter(Boolean) as Product[]) : [];

  return (
    <>
      <PageHeader
        eyebrow="Sua seleção"
        title={
          <>
            Favoritos<span className="serif-italic">.</span>
          </>
        }
      />
      <section className="mx-auto min-h-[40svh] max-w-[1600px] px-5 pb-28 md:px-8">
        {mounted && list.length === 0 ? (
          <div className="py-16">
            <p className="font-serif text-3xl italic text-ink/70">Nenhuma peça favoritada ainda.</p>
            <p className="mt-2 text-sm text-ink/60">Toque no coração das peças para guardá-las aqui.</p>
            <PillLink href="/colecao" label="Explorar coleção" className="mt-8" />
          </div>
        ) : (
          <motion.ul layout className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
            <AnimatePresence>
              {list.map((p) => (
                <motion.li key={p.slug} layout initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                  <ProductCard product={p} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </section>
    </>
  );
}
