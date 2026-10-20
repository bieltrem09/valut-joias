'use client';

import { AnimatePresence, motion } from 'motion/react';
import { PointerEvent as RPointerEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { categoryName } from '@/data/categories';
import { Product, Variant, variantLabels } from '@/data/products';
import { site, whatsappLink } from '@/data/site';
import { flyToCart } from '@/lib/flyToCart';
import { cn, formatPrice } from '@/lib/format';
import { setScrollLock } from '@/lib/lenis';
import { useShop } from '@/lib/store';
import { Media } from '@/components/ui/Media';
import { IconArrow, IconClose, IconMinus, IconPlus, IconWhatsapp } from '@/components/ui/Icons';
import { RevealText } from '@/components/ui/Reveal';
import { TransitionLink } from '@/components/ui/TransitionLink';
import { Portal } from '@/components/ui/Portal';
import { FavoriteButton } from '@/components/shop/FavoriteButton';
import { ProductCard, productVtName } from '@/components/shop/ProductCard';

const care = [
  'Guarde cada peça separada, em local seco e fechado (de preferência no saquinho ou caixinha).',
  'Evite contato com perfume, cremes, cloro, água do mar e produtos de limpeza.',
  'Coloque as semijoias por último, depois da maquiagem e do perfume.',
  'Limpe com flanela macia e seca após o uso.',
];

/**
 * Página de produto: galeria vertical sticky (zoom no hover + lightbox) à
 * esquerda e informações sticky à direita. A primeira imagem recebe o
 * view-transition-name do card de origem (elemento compartilhado).
 */
export function ProductView({ product, pairs }: { product: Product; pairs: Product[] }) {
  const [variant, setVariant] = useState<Variant>(product.variants[0]);
  const [qty, setQty] = useState(1);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const add = useShop((s) => s.add);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const setRingGuideOpen = useShop((s) => s.setRingGuideOpen);
  const firstImg = useRef<HTMLDivElement>(null);
  const isCutout = (k: string) => k === 'joia-rubi-recorte';

  const onAdd = async () => {
    await flyToCart(firstImg.current);
    add(product.slug, variant, qty);
    setTimeout(() => setCartOpen(true), 250);
  };

  const waMessage = `Olá, VALUT! Quero comprar: ${product.name} (${variantLabels[variant]}) × ${qty} — ${formatPrice(product.price * qty)}`;

  return (
    <>
      <div className="mx-auto max-w-[1600px] px-5 pt-28 pb-24 md:px-8 lg:pt-32">
        <nav aria-label="Trilha" className="mb-6 text-xs text-ink/60">
          <ol className="flex flex-wrap gap-2">
            <li>
              <TransitionLink href="/colecao" className="link-draw">
                Coleção
              </TransitionLink>
            </li>
            <li aria-hidden>/</li>
            <li>
              <TransitionLink href={`/colecao?categoria=${product.category}`} className="link-draw">
                {categoryName(product.category)}
              </TransitionLink>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          {/* Galeria vertical */}
          <div className="space-y-4">
            {product.images.map((img, i) => (
              <ZoomFrame key={img.key + i} onOpen={() => setLightbox(i)} label={`Ampliar foto ${i + 1} de ${product.name}`}>
                <div
                  ref={i === 0 ? firstImg : undefined}
                  className={cn('relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-marble')}
                  style={i === 0 ? { viewTransitionName: productVtName(product.slug) } : undefined}
                >
                  <Media
                    k={img.key}
                    alt={img.alt}
                    fill
                    priority={i === 0}
                    sizes="(min-width:1024px) 55vw, 100vw"
                    className={cn('zoom-target transition-transform duration-500 ease-[var(--ease-soft)]', isCutout(img.key) ? 'object-contain p-10' : 'object-cover')}
                  />
                </div>
              </ZoomFrame>
            ))}
          </div>

          {/* Informações */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex items-start justify-between gap-4">
              <p className="eyebrow text-gold-deep">
                {categoryName(product.category)}
                {product.collection === 'rubi-mood' && ' · Rubi Mood'}
              </p>
              <FavoriteButton slug={product.slug} name={product.name} className="relative border border-ink/15" />
            </div>
            <RevealText as="h1" immediate className="mt-3 font-serif text-[clamp(2.4rem,4.5vw,4.25rem)] leading-[0.95]">
              {product.name}
            </RevealText>
            <p className="mt-5 flex items-baseline gap-3 text-xl">
              <span className="font-medium">{formatPrice(product.price)}</span>
              {product.compareAt && (
                <>
                  <span className="text-base text-ink/50 line-through">{formatPrice(product.compareAt)}</span>
                  <span className="rounded-full bg-ruby px-3 py-1 text-[11px] tracking-wider text-ivory uppercase">Sale</span>
                </>
              )}
            </p>
            {site.demoData && <p className="mt-1 text-xs text-ink/45">[CONFIRMAR] preço ilustrativo</p>}

            <fieldset className="mt-8">
              <legend className="eyebrow">Acabamento · {variantLabels[variant]}</legend>
              <div className="mt-3 flex gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={variant === v}
                    onClick={() => setVariant(v)}
                    className={cn('flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-colors', variant === v ? 'border-ink' : 'border-ink/20 hover:border-ink/60')}
                  >
                    <span aria-hidden className={cn('h-4 w-4 rounded-full', v === 'dourado' ? 'bg-[linear-gradient(135deg,#e9cf8a,#b79342,#8a6a24)]' : 'bg-[linear-gradient(135deg,#f4f4f4,#c9c9cf,#8d8d96)]')} />
                    {variantLabels[v]}
                  </button>
                ))}
              </div>
            </fieldset>

            {product.category === 'aneis' && (
              <button type="button" onClick={() => setRingGuideOpen(true)} className="link-draw mt-5 text-sm">
                Guia de tamanho de anel
              </button>
            )}

            <div className="mt-8 flex gap-3">
              <div className="flex h-14 items-center rounded-full border border-ink/20">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-14 w-12 place-items-center" aria-label="Diminuir quantidade">
                  <IconMinus width={16} />
                </button>
                <span className="w-6 text-center tabular-nums" aria-live="polite" aria-label={`Quantidade: ${qty}`}>
                  {qty}
                </span>
                <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} className="grid h-14 w-12 place-items-center" aria-label="Aumentar quantidade">
                  <IconPlus width={16} />
                </button>
              </div>
              <button type="button" onClick={onAdd} className="roll-host h-14 flex-1 rounded-full bg-ink text-[15px] font-medium text-ivory transition-colors hover:bg-gold hover:text-ink">
                Adicionar à sacola
              </button>
            </div>
            <a
              href={whatsappLink(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex h-14 items-center justify-center gap-2 rounded-full border border-ink/25 text-[15px] transition-colors hover:border-ink"
            >
              <IconWhatsapp /> Comprar pelo WhatsApp
            </a>
            <p className="mt-4 text-sm text-ink/60">✦ {site.shipping} · {site.model}</p>

            <div className="mt-10 border-t border-ink/15">
              <Accordion title="Descrição" defaultOpen>
                <p>{product.description}</p>
              </Accordion>
              <Accordion title="Cuidados com a semijoia">
                <ul className="list-disc space-y-1 pl-5">
                  {care.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </Accordion>
              <Accordion title="Envio">
                <p>
                  {site.shipping}. Prazos e valores calculados na finalização. [CONFIRMAR] política de envio, prazo de postagem e transportadoras.
                </p>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {pairs.length > 0 && (
        <section aria-labelledby="look-title" className="border-t border-ink/10 bg-marble/50 px-5 py-24 md:px-8">
          <div className="mx-auto max-w-[1600px]">
            <div className="flex items-end justify-between">
              <RevealText as="h2" id="look-title" className="font-serif text-[clamp(2.2rem,5vw,4.5rem)] leading-[0.95]">
                Complete o <span className="serif-italic">look</span>
              </RevealText>
              <TransitionLink href="/colecao" className="link-draw hidden items-center gap-2 text-sm md:flex">
                Ver tudo <IconArrow width={16} />
              </TransitionLink>
            </div>
            <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
              {pairs.map((p) => (
                <li key={p.slug}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <Lightbox product={product} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />
    </>
  );
}

/** Zoom ao passar o mouse: a imagem escala 1.8 com a origem seguindo o cursor. */
function ZoomFrame({ children, onOpen, label }: { children: ReactNode; onOpen: () => void; label: string }) {
  const move = (e: RPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== 'mouse') return;
    const img = e.currentTarget.querySelector<HTMLElement>('.zoom-target');
    if (!img) return;
    const r = e.currentTarget.getBoundingClientRect();
    img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    img.style.transform = 'scale(1.8)';
  };
  const leave = (e: RPointerEvent<HTMLButtonElement>) => {
    const img = e.currentTarget.querySelector<HTMLElement>('.zoom-target');
    if (img) img.style.transform = '';
  };
  return (
    <button type="button" onClick={onOpen} onPointerMove={move} onPointerLeave={leave} className="block w-full cursor-zoom-in" aria-label={label} data-cursor="Ampliar">
      {children}
    </button>
  );
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = title.toLowerCase().replace(/\W+/g, '-');
  return (
    <div className="border-b border-ink/15">
      <h3>
        <button type="button" aria-expanded={open} aria-controls={`acc-${id}`} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between py-5 text-left text-[15px] font-medium">
          {title}
          <span aria-hidden className="relative h-3 w-3">
            <span className="absolute top-1/2 left-0 h-px w-3 bg-current" />
            <span className={cn('absolute top-1/2 left-0 h-px w-3 bg-current transition-transform duration-500 ease-[var(--ease-expo)]', open ? 'rotate-0' : 'rotate-90')} />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`acc-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-[15px] leading-relaxed text-ink/75">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Lightbox({ product, index, onClose, onIndex }: { product: Product; index: number | null; onClose: () => void; onIndex: (i: number) => void }) {
  const n = product.images.length;
  useEffect(() => {
    if (index === null) return;
    setScrollLock('lightbox', true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % n);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + n) % n);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      setScrollLock('lightbox', false);
    };
  }, [index, n, onClose, onIndex]);

  return (
    <Portal>
    <AnimatePresence>
      {index !== null && (
        <motion.div role="dialog" aria-modal="true" aria-label={`Fotos de ${product.name}`} className="fixed inset-0 z-[90] bg-ink/95" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div key={index} className="absolute inset-8 md:inset-16" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <Media k={product.images[index].key} alt={product.images[index].alt} fill sizes="100vw" className="object-contain" />
            </motion.div>
          </AnimatePresence>
          <button type="button" autoFocus onClick={onClose} className="absolute top-5 right-5 grid h-12 w-12 place-items-center rounded-full bg-ivory text-ink" aria-label="Fechar">
            <IconClose />
          </button>
          {n > 1 && (
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4 text-ivory">
              <button type="button" onClick={() => onIndex((index - 1 + n) % n)} className="grid h-12 w-12 place-items-center rounded-full border border-ivory/30" aria-label="Foto anterior">
                <IconArrow className="rotate-180" />
              </button>
              <span className="text-sm tabular-nums">
                {index + 1} / {n}
              </span>
              <button type="button" onClick={() => onIndex((index + 1) % n)} className="grid h-12 w-12 place-items-center rounded-full border border-ivory/30" aria-label="Próxima foto">
                <IconArrow />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  );
}
