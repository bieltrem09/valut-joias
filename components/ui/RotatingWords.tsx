'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

/**
 * Palavra que troca sozinha, letra por letra (sai para cima, a nova entra de baixo).
 * Leitores de tela recebem a frase completa uma única vez.
 */
export function RotatingWords({ prefix, words, interval = 2600, className }: { prefix: string; words: string[]; interval?: number; className?: string }) {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setI((v) => (v + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [reduced, interval, words.length]);

  return (
    <span className={className}>
      <span className="sr-only">
        {prefix} {words.join(', ')}
      </span>
      <span aria-hidden className="inline-flex items-baseline">
        <span>{prefix}&nbsp;</span>
        <span className="relative inline-flex overflow-hidden pb-[0.18em] -mb-[0.18em]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={words[i]} className="inline-flex whitespace-pre">
              {[...words[i]].map((ch, k) => (
                <motion.span
                  key={k}
                  className="inline-block"
                  initial={{ y: '110%', rotate: 8 }}
                  animate={{ y: '0%', rotate: 0, transition: { duration: 0.7, delay: k * 0.022, ease: [0.16, 1, 0.3, 1] } }}
                  exit={{ y: '-110%', rotate: -6, transition: { duration: 0.45, delay: k * 0.012, ease: [0.76, 0, 0.24, 1] } }}
                >
                  {ch}
                </motion.span>
              ))}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
    </span>
  );
}
