export const ease = {
  out: 'expo.out', // revelações
  inOut: 'cubic-bezier(0.76, 0, 0.24, 1)', // cortinas, transições de página
  soft: 'power3.out', // hovers
  land: 'back.out(1.2)', // joia pousando
} as const;

export const dur = { xs: 0.25, sm: 0.45, md: 0.8, lg: 1.2, xl: 1.6 } as const;
export const stagger = { chars: 0.02, words: 0.06, items: 0.08 } as const;

/** Media queries usadas pelo gsap.matchMedia em todo o site. */
export const mq = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
  desktop: '(min-width: 1024px)',
  mobile: '(max-width: 1023px)',
  finePointer: '(hover: hover) and (pointer: fine)',
} as const;
