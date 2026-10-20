'use client';

import { createElement, ElementType, HTMLAttributes, ReactNode, useRef } from 'react';
import { useImageReveal, useSplitReveal } from '@/lib/animations';
import { cn } from '@/lib/format';

type TextProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  children: ReactNode;
  delay?: number;
  immediate?: boolean;
  start?: string;
  type?: 'lines' | 'words';
};

/** Texto com entrada por linhas mascaradas (SplitText). */
export function RevealText({ as = 'h2', children, delay, immediate, start, type, className, ...rest }: TextProps) {
  const ref = useRef<HTMLElement>(null);
  useSplitReveal(ref, { delay, immediate, start, type });
  return createElement(as, { ref, 'data-reveal': '', className, ...rest }, children);
}

type ImageProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  delay?: number;
  immediate?: boolean;
  from?: 'bottom' | 'top' | 'left';
};

/** Container com revelação por clip-path; o filho com [data-reveal-media] faz o scale 1.15 → 1. */
export function RevealImage({ children, delay, immediate, from, className, ...rest }: ImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  useImageReveal(ref, { delay, immediate, from });
  return (
    <div ref={ref} className={cn('overflow-hidden', className)} {...rest}>
      {children}
    </div>
  );
}
