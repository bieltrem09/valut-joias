'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { site } from '@/data/site';
import { MediaKey } from '@/data/media.generated';
import { getLenis } from '@/lib/lenis';
import { Media } from '@/components/ui/Media';
import { TransitionLink } from '@/components/ui/TransitionLink';

const links: { href: string; label: string; image: MediaKey }[] = [
  { href: '/', label: 'Início', image: 'editorial-flores-cravejadas' },
  { href: '/colecao', label: 'Coleções', image: 'aneis-coquetel' },
  { href: '/sobre', label: 'Sobre', image: 'loja-letreiro' },
  { href: '/atacado', label: 'Atacado', image: 'loja-interior' },
  { href: '/contato', label: 'Contato', image: 'loja-logo-marmore' },
  { href: '/favoritos', label: 'Favoritos', image: 'editorial-colar-gota' },
];

const curtain = [0.76, 0, 0.24, 1] as const;

/** Menu em tela cheia: fundo ink, links gigantes em serif com stagger e foto de fundo que troca com o foco. */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const lenis = getLenis();
    if (open) lenis?.stop();
    else lenis?.start();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="menu-mobile"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-ink px-6 pt-28 pb-8 text-ivory lg:hidden"
          initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: 0.7, ease: curtain, delay: 0.1 } }}
          transition={{ duration: 0.8, ease: curtain }}
        >
          <div aria-hidden className="absolute inset-0 opacity-35">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={active}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.12 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                <Media k={links[active].image} alt="" fill sizes="100vw" className="object-cover" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/30" />
          </div>

          <nav aria-label="Menu principal" className="relative flex-1">
            <ul className="space-y-1">
              {links.map((l, i) => (
                <li key={l.href} className="overflow-hidden">
                  <motion.div
                    initial={{ y: '110%' }}
                    animate={{ y: '0%' }}
                    exit={{ y: '-110%', transition: { duration: 0.4, ease: curtain } }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.25 + i * 0.06 }}
                  >
                    <TransitionLink
                      href={l.href}
                      onClick={onClose}
                      onFocus={() => setActive(i)}
                      onPointerEnter={() => setActive(i)}
                      className="flex items-baseline gap-4 py-1 font-serif text-[clamp(2.6rem,11vw,4.5rem)] leading-[1.05]"
                    >
                      <span className="font-sans text-xs text-gold">0{i + 1}</span>
                      <span className={active === i ? 'italic' : ''}>{l.label}</span>
                    </TransitionLink>
                  </motion.div>
                </li>
              ))}
            </ul>
          </nav>

          <motion.div
            className="relative flex items-end justify-between gap-4 text-sm text-ivory/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.7 } }}
            exit={{ opacity: 0 }}
          >
            <p>
              {site.model}
              <br />
              {site.shipping}
            </p>
            <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="link-draw text-gold">
              {site.instagram.handle}
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
