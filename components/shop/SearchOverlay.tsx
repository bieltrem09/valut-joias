'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { categories, categoryName } from '@/data/categories';
import { products } from '@/data/products';
import { formatPrice } from '@/lib/format';
import { setScrollLock } from '@/lib/lenis';
import { useShop } from '@/lib/store';
import { IconClose, IconSearch } from '@/components/ui/Icons';
import { Media } from '@/components/ui/Media';
import { TransitionLink } from '@/components/ui/TransitionLink';

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function SearchOverlay() {
  const open = useShop((s) => s.searchOpen);
  const setOpen = useShop((s) => s.setSearchOpen);
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setScrollLock('search', true);
    const t = setTimeout(() => input.current?.focus({ preventScroll: true }), 250);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      setScrollLock('search', false);
    };
  }, [open, setOpen]);

  const results = useMemo(() => {
    const n = normalize(q.trim());
    if (!n) return [];
    return products.filter((p) => normalize(`${p.name} ${categoryName(p.category)} ${p.stone}`).includes(n)).slice(0, 8);
  }, [q]);

  const close = () => setOpen(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Buscar"
          className="fixed inset-0 z-[85] overflow-y-auto bg-ivory/95 backdrop-blur-xl"
          data-lenis-prevent
          initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="mx-auto max-w-5xl px-6 pt-24 pb-16">
            <button type="button" onClick={close} className="absolute top-6 right-6 grid h-11 w-11 place-items-center rounded-full border border-ink/15 hover:bg-ink hover:text-ivory" aria-label="Fechar busca">
              <IconClose />
            </button>
            <label htmlFor="busca" className="eyebrow text-gold-deep">
              O que você procura?
            </label>
            <div className="mt-3 flex items-center gap-4 border-b border-ink pb-3">
              <IconSearch width={28} height={28} />
              <input
                id="busca"
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Brincos, rubi, pérolas…"
                className="w-full bg-transparent font-serif text-[clamp(2rem,5vw,3.5rem)] outline-none placeholder:text-ink/25"
                autoComplete="off"
              />
            </div>

            {!q && (
              <div className="mt-8 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <TransitionLink key={c.slug} href={`/colecao?categoria=${c.slug}`} onClick={close} className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:border-ink hover:bg-ink hover:text-ivory">
                    {c.name}
                  </TransitionLink>
                ))}
              </div>
            )}

            <ul className="mt-10 grid gap-x-8 gap-y-2 sm:grid-cols-2" aria-live="polite">
              {results.map((p, i) => (
                <motion.li key={p.slug} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                  <TransitionLink href={`/produto/${p.slug}`} onClick={close} className="group flex items-center gap-4 rounded-2xl p-2 hover:bg-marble">
                    <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-marble">
                      <Media k={p.images[0].key} alt="" fill sizes="64px" className={p.images[0].key === 'joia-rubi-recorte' ? 'object-contain p-1' : 'object-cover'} />
                    </span>
                    <span className="flex-1">
                      <span className="block font-serif text-lg">{p.name}</span>
                      <span className="text-xs text-ink/60">
                        {categoryName(p.category)} · {formatPrice(p.price)}
                      </span>
                    </span>
                  </TransitionLink>
                </motion.li>
              ))}
            </ul>
            {q && results.length === 0 && <p className="mt-10 font-serif text-2xl italic text-ink/60">Nada por aqui ainda. Tente outra palavra.</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
