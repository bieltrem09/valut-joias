'use client';

import { Flip, gsap, prefersReducedMotion } from './gsap';

/**
 * A miniatura do produto "voa" até o ícone da sacola (GSAP Flip.fit) e some.
 * Resolve quando termina, para disparar o bump do contador em sincronia.
 */
export function flyToCart(source: HTMLElement | null): Promise<void> {
  const target = document.getElementById('cart-icon');
  if (!source || !target || prefersReducedMotion()) return Promise.resolve();
  const rect = source.getBoundingClientRect();
  const img = source.querySelector('img');
  const clone = document.createElement('div');
  Object.assign(clone.style, {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    zIndex: '95',
    pointerEvents: 'none',
    borderRadius: '20px',
    overflow: 'hidden',
    backgroundImage: img ? `url("${img.currentSrc || img.src}")` : '',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    boxShadow: '0 30px 60px -20px rgb(14 13 11 / .45)',
  });
  document.body.appendChild(clone);
  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => {
        clone.remove();
        resolve();
      },
    });
    tl.to(clone, { scale: 0.9, duration: 0.2, ease: 'power2.out' });
    tl.add(Flip.fit(clone, target, { scale: true, duration: 0.85, ease: 'expo.inOut' }) as gsap.core.Tween);
    tl.to(clone, { borderRadius: '50%', duration: 0.6, ease: 'power2.inOut' }, 0.2);
    tl.to(clone, { autoAlpha: 0, duration: 0.2 }, '-=0.15');
  });
}
