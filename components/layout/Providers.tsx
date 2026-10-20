'use client';

import { ReactNode, useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import '@/lib/gsap';
import { SmoothScroll } from '@/lib/lenis';
import { useShop } from '@/lib/store';
import { PageTransitionProvider } from './PageTransition';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    useShop.persist.rehydrate();
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll>
        <PageTransitionProvider>{children}</PageTransitionProvider>
      </SmoothScroll>
    </MotionConfig>
  );
}
