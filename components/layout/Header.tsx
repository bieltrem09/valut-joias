'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { cartCount, useShop } from '@/lib/store';
import { cn } from '@/lib/format';
import { IconBag, IconHeart, IconSearch } from '@/components/ui/Icons';
import { LogoWordmark } from '@/components/ui/Logo';
import { TransitionLink } from '@/components/ui/TransitionLink';
import { MobileMenu } from './MobileMenu';

export const navLinks = [
  { href: '/colecao', label: 'Coleções' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/atacado', label: 'Atacado' },
  { href: '/contato', label: 'Contato' },
];

/**
 * Header: transparente sobre o topo; ao rolar vira barra ivory com blur e
 * "encolhe" de 88 para 64px (só transform: o fundo escala em Y e o conteúdo
 * sobe 12px). Esconde rolando para baixo, reaparece rolando para cima.
 */
export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const cart = useShop((s) => s.cart);
  const favorites = useShop((s) => s.favorites);
  const bump = useShop((s) => s.bump);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const setSearchOpen = useShop((s) => s.setSearchOpen);
  const badge = useAnimationControls();
  const lastY = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      if (Math.abs(y - lastY.current) > 6) {
        setHidden(y > lastY.current && y > 240);
        lastY.current = y;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setHidden(false);
  }, [pathname]);

  useEffect(() => {
    if (bump > 0) {
      setHidden(false);
      badge.start({ scale: [1, 1.3, 1], transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } });
    }
  }, [bump, badge]);

  const count = mounted ? cartCount(cart) : 0;
  const favCount = mounted ? favorites.length : 0;
  const compact = scrolled && !menuOpen;

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 h-[88px] transition-transform duration-700 ease-[var(--ease-expo)] will-change-transform',
          hidden && !menuOpen ? '-translate-y-full' : 'translate-y-0',
        )}
      >
        <div
          aria-hidden
          className={cn(
            'absolute inset-0 origin-top border-b border-ink/10 bg-ivory/75 backdrop-blur-xl transition-[transform,opacity] duration-500 ease-[var(--ease-expo)]',
            compact ? 'scale-y-[0.7273] opacity-100' : 'scale-y-100 opacity-0',
          )}
        />
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-10 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
          Pular para o conteúdo
        </a>
        <div
          className={cn(
            'relative mx-auto grid h-full max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-5 transition-transform duration-500 ease-[var(--ease-expo)] md:px-8',
            compact ? '-translate-y-3' : 'translate-y-0',
            menuOpen ? 'text-ivory' : 'text-ink',
          )}
        >
          <div className="flex items-center gap-5">
            <TransitionLink href="/" aria-label="VALUT Semijoias — início" className="block">
              <LogoWordmark className="h-[18px] w-auto text-current md:h-5" aria-hidden />
            </TransitionLink>
            <span className="eyebrow hidden opacity-70 xl:inline">Est. Loja Física</span>
          </div>

          <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center gap-9 text-[14px]">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <TransitionLink href={l.href} className="link-draw" aria-current={pathname.startsWith(l.href) ? 'page' : undefined}>
                    {l.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center justify-end gap-1 md:gap-2">
            <button type="button" onClick={() => setSearchOpen(true)} className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-ink/5" aria-label="Buscar peças">
              <IconSearch />
            </button>
            <TransitionLink href="/favoritos" className="relative hidden h-10 w-10 place-items-center rounded-full transition-colors hover:bg-ink/5 sm:grid" aria-label={`Favoritos (${favCount})`}>
              <IconHeart />
              {favCount > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-ruby" aria-hidden />}
            </TransitionLink>
            <button
              id="cart-icon"
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-ink/5"
              aria-label={`Abrir sacola, ${count} ${count === 1 ? 'item' : 'itens'}`}
            >
              <IconBag />
              <motion.span
                animate={badge}
                aria-hidden
                className={cn(
                  'absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold text-ink transition-opacity',
                  count ? 'opacity-100' : 'opacity-0',
                )}
              >
                {count}
              </motion.span>
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="menu-mobile"
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              className="relative ml-1 grid h-10 w-10 place-items-center lg:hidden"
            >
              <span className={cn('absolute h-px w-6 bg-current transition-transform duration-500 ease-[var(--ease-expo)]', menuOpen ? 'rotate-45' : '-translate-y-[4px]')} />
              <span className={cn('absolute h-px w-6 bg-current transition-transform duration-500 ease-[var(--ease-expo)]', menuOpen ? '-rotate-45' : 'translate-y-[4px]')} />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
