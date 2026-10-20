'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/format';

type Props = { name: 'video-rubi-mood' | 'video-flores-cravejadas'; label: string; className?: string };

/**
 * Vídeo vertical em loop, mudo: só carrega perto da viewport e pausa fora dela.
 * Em reduced motion fica parado no poster (com controles nativos disponíveis).
 */
export function LazyVideo({ name, label, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let loaded = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!loaded) {
            v.querySelectorAll('source').forEach((s) => (s.src = s.dataset.src!));
            v.load();
            loaded = true;
          }
          if (!reduced) v.play().catch(() => {});
        } else v.pause();
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={cn('h-full w-full object-cover', className)}
      muted
      playsInline
      loop
      preload="none"
      poster={`/media/${name}-poster.jpg`}
      aria-label={label}
    >
      <source data-src={`/media/${name}.webm`} type="video/webm" />
      <source data-src={`/media/${name}.mp4`} type="video/mp4" />
    </video>
  );
}
