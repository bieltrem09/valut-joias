'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { categories, CategorySlug } from '@/data/categories';
import { products, StoneColor, stoneLabels, Tag, tagLabels } from '@/data/products';
import { Flip, gsap, ScrollTrigger } from '@/lib/gsap';
import { mq } from '@/lib/animations';
import { setScrollLock } from '@/lib/lenis';
import { cn } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { IconClose } from '@/components/ui/Icons';
import { ProductCard, ProductCardSkeleton } from '@/components/shop/ProductCard';
import { FilterPills } from '@/components/shop/FilterPills';
import { Portal } from '@/components/ui/Portal';

type Sort = 'relevancia' | 'menor' | 'maior' | 'novidades';
const sorts: { value: Sort; label: string }[] = [
  { value: 'relevancia', label: 'Relevância' },
  { value: 'novidades', label: 'Novidades' },
  { value: 'menor', label: 'Menor preço' },
  { value: 'maior', label: 'Maior preço' },
];
const priceRanges = [
  { id: 'ate-120', label: 'Até R$ 120', min: 0, max: 120 },
  { id: '120-200', label: 'R$ 120 a R$ 200', min: 120, max: 200 },
  { id: 'acima-200', label: 'Acima de R$ 200', min: 200, max: Infinity },
];
const stones = Object.keys(stoneLabels) as StoneColor[];
const PAGE = 8;

/**
 * Loja (/colecao): filtros por categoria, preço e cor da pedra + ordenação.
 * A grade reorganiza com GSAP Flip; "infinite scroll" com skeletons dourados.
 * Categoria/coleção/filtro ficam na URL (?categoria=aneis&colecao=rubi-mood&filtro=novidade).
 */
export function CollectionView() {
  const params = useSearchParams();
  const router = useRouter();
  const grid = useRef<HTMLUListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  const category = (params.get('categoria') as CategorySlug | null) ?? 'todas';
  const collection = params.get('colecao');
  const tag = params.get('filtro') as Tag | null;
  const [price, setPrice] = useState<string[]>([]);
  const [stone, setStone] = useState<StoneColor[]>([]);
  const [sort, setSort] = useState<Sort>('relevancia');
  const [panel, setPanel] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    let list = products.filter(
      (p) =>
        (category === 'todas' || p.category === category) &&
        (!collection || p.collection === collection) &&
        (!tag || p.tags.includes(tag)) &&
        (price.length === 0 || priceRanges.some((r) => price.includes(r.id) && p.price >= r.min && p.price < r.max)) &&
        (stone.length === 0 || stone.includes(p.stone)),
    );
    if (sort === 'menor') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'maior') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'novidades') list = [...list].sort((a, b) => Number(b.tags.includes('novidade')) - Number(a.tags.includes('novidade')));
    return list;
  }, [category, collection, tag, price, stone, sort]);

  const visible = filtered.slice(0, limit);
  const hasMore = limit < filtered.length;

  // Captura o estado antes de qualquer mudança de filtro → Flip depois do render
  const capture = () => {
    if (grid.current) flipState.current = Flip.getState(grid.current.querySelectorAll('.col-item'));
  };

  const setParam = (key: string, value: string | null) => {
    capture();
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    setLimit(PAGE);
    router.replace(`/colecao${next.toString() ? `?${next}` : ''}`, { scroll: false });
  };

  const toggle = <T,>(list: T[], v: T, set: (l: T[]) => void) => {
    capture();
    setLimit(PAGE);
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  };

  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state || !grid.current) return;
    flipState.current = null;
    const reduced = window.matchMedia(mq.reduced).matches;
    Flip.from(state, {
      targets: grid.current.querySelectorAll('.col-item'),
      duration: reduced ? 0 : 0.75,
      ease: 'expo.inOut',
      absolute: true,
      scale: true,
      stagger: 0.02,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.15, stagger: 0.04 }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.9, duration: 0.3 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }, [filtered]);

  useEffect(() => {
    if (!panel) return;
    setScrollLock('filters', true);
    return () => setScrollLock('filters', false);
  }, [panel]);

  // Infinite scroll: carrega mais quando o sentinela aparece (com skeletons enquanto "busca")
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || loading) return;
        setLoading(true);
        // Simula a latência de uma API/CMS; troque por fetch paginado.
        setTimeout(() => {
          setLimit((l) => l + PAGE);
          setLoading(false);
        }, 650);
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading]);

  const title =
    collection === 'rubi-mood' ? (
      <>
        Rubi <span className="serif-italic">Mood</span>
      </>
    ) : category !== 'todas' ? (
      categories.find((c) => c.slug === category)?.name
    ) : (
      <>
        Coleção <span className="serif-italic">completa</span>
      </>
    );

  const activeChips = [
    ...(collection ? [{ label: 'Rubi Mood', clear: () => setParam('colecao', null) }] : []),
    ...(tag ? [{ label: tagLabels[tag], clear: () => setParam('filtro', null) }] : []),
    ...price.map((id) => ({ label: priceRanges.find((r) => r.id === id)!.label, clear: () => toggle(price, id, setPrice) })),
    ...stone.map((s) => ({ label: stoneLabels[s], clear: () => toggle(stone, s, setStone) })),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Loja VALUT"
        title={title}
        titleKey={`${collection}-${category}`}
        aside={
          <p className="text-sm text-ink/60" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? 'peça' : 'peças'}
          </p>
        }
      />

      <div className="sticky top-0 z-30 border-y border-ink/10 bg-ivory/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-5 py-3 md:px-8">
          <div className="min-w-0 flex-1 [mask-image:linear-gradient(to_right,#000_85%,transparent)] md:[mask-image:none]">
            <FilterPills
              label="Categoria"
              value={category}
              onChange={(v) => setParam('categoria', v === 'todas' ? null : v)}
              options={[{ value: 'todas' as const, label: 'Todas' }, ...categories.map((c) => ({ value: c.slug, label: c.name }))]}
            />
          </div>
          <button type="button" onClick={() => setPanel(true)} className="shrink-0 rounded-full border border-ink/20 px-5 py-2.5 text-sm hover:border-ink" aria-expanded={panel} aria-controls="painel-filtros">
            Filtros{price.length + stone.length > 0 && ` (${price.length + stone.length})`}
          </button>
          <label className="hidden shrink-0 items-center gap-2 text-sm md:flex">
            <span className="text-ink/60">Ordenar</span>
            <select value={sort} onChange={(e) => (capture(), setSort(e.target.value as Sort))} className="rounded-full border border-ink/20 bg-transparent px-4 py-2.5 text-sm outline-none focus-visible:border-ink">
              {sorts.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <section aria-label="Produtos" className="mx-auto max-w-[1600px] px-5 pt-8 pb-28 md:px-8">
        <AnimatePresence>
          {activeChips.length > 0 && (
            <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-8 flex flex-wrap gap-2">
              {activeChips.map((c) => (
                <li key={c.label}>
                  <button type="button" onClick={c.clear} className="flex items-center gap-2 rounded-full bg-marble px-4 py-2 text-sm hover:bg-ink hover:text-ivory" aria-label={`Remover filtro ${c.label}`}>
                    {c.label} <IconClose width={14} height={14} />
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-4xl italic">Nenhuma peça com esses filtros.</p>
            <button
              type="button"
              className="link-draw mt-4 text-sm"
              onClick={() => {
                setPrice([]);
                setStone([]);
                router.replace('/colecao', { scroll: false });
              }}
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <ul ref={grid} className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
            {visible.map((p, i) => (
              <li key={p.slug} className="col-item" data-flip-id={p.slug}>
                <ProductCard product={p} priority={i < 4} />
              </li>
            ))}
            {loading && [...Array(Math.min(PAGE, filtered.length - limit))].map((_, i) => <li key={`sk-${i}`}><ProductCardSkeleton /></li>)}
          </ul>
        )}
        <div ref={sentinel} aria-hidden className="h-px" />
        {hasMore && !loading && (
          <div className="mt-12 flex justify-center">
            <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="link-draw text-sm">
              Carregar mais peças
            </button>
          </div>
        )}
      </section>

      <Portal>
      <AnimatePresence>
        {panel && (
          <div className="fixed inset-0 z-[80]">
            <motion.div className="absolute inset-0 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPanel(false)} />
            <motion.aside
              id="painel-filtros"
              role="dialog"
              aria-modal="true"
              aria-label="Filtros"
              data-lenis-prevent
              className="absolute top-0 left-0 flex h-full w-full max-w-[420px] flex-col overflow-y-auto bg-ivory p-6"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 32 }}
              onKeyDown={(e) => e.key === 'Escape' && setPanel(false)}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-3xl">Filtros</h2>
                <button type="button" autoFocus onClick={() => setPanel(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5" aria-label="Fechar filtros">
                  <IconClose />
                </button>
              </div>

              <fieldset className="mt-8">
                <legend className="eyebrow text-gold-deep">Preço</legend>
                <div className="mt-4 space-y-3">
                  {priceRanges.map((r) => (
                    <Check key={r.id} label={r.label} checked={price.includes(r.id)} onChange={() => toggle(price, r.id, setPrice)} />
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-8">
                <legend className="eyebrow text-gold-deep">Cor da pedra</legend>
                <div className="mt-4 flex flex-wrap gap-2">
                  {stones.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={stone.includes(s)}
                      onClick={() => toggle(stone, s, setStone)}
                      className={cn('flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors', stone.includes(s) ? 'border-ink bg-ink text-ivory' : 'border-ink/20 hover:border-ink')}
                    >
                      <span aria-hidden className={cn('h-3 w-3 rounded-full border border-ink/20', swatch[s])} />
                      {stoneLabels[s]}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-8 md:hidden">
                <legend className="eyebrow text-gold-deep">Ordenar</legend>
                <div className="mt-4 space-y-3">
                  {sorts.map((s) => (
                    <Check key={s.value} type="radio" label={s.label} checked={sort === s.value} onChange={() => (capture(), setSort(s.value))} />
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-8">
                <legend className="eyebrow text-gold-deep">Coleção</legend>
                <div className="mt-4">
                  <Check label="Rubi Mood" checked={collection === 'rubi-mood'} onChange={() => setParam('colecao', collection ? null : 'rubi-mood')} />
                </div>
              </fieldset>

              <button type="button" onClick={() => setPanel(false)} className="mt-auto h-14 rounded-full bg-ink text-ivory">
                Ver {filtered.length} {filtered.length === 1 ? 'peça' : 'peças'}
              </button>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
      </Portal>
    </>
  );
}

const swatch: Record<StoneColor, string> = {
  cristal: 'bg-white',
  rubi: 'bg-ruby',
  coral: 'bg-[#e8573f]',
  amarelo: 'bg-[#e9c23b]',
  perola: 'bg-[#efe6d2]',
  colorida: 'bg-[conic-gradient(#e8573f,#e9c23b,#2f7fd1,#9b1b30,#e8573f)]',
  'sem-pedra': 'bg-gold',
};

function Check({ label, checked, onChange, type = 'checkbox' }: { label: string; checked: boolean; onChange: () => void; type?: 'checkbox' | 'radio' }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-[15px]">
      <input type={type} checked={checked} onChange={onChange} className="peer sr-only" />
      <span aria-hidden className={cn('grid h-5 w-5 place-items-center border border-ink/40 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-gold', type === 'radio' ? 'rounded-full' : 'rounded-md', checked && 'border-ink bg-ink')}>
        {checked && <span className={cn('bg-ivory', type === 'radio' ? 'h-2 w-2 rounded-full' : 'h-2 w-2 rounded-[2px]')} />}
      </span>
      {label}
    </label>
  );
}
