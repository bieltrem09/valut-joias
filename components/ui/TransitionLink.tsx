'use client';

import Link, { LinkProps } from 'next/link';
import { AnchorHTMLAttributes, forwardRef, MouseEvent } from 'react';
import { usePageTransition } from '@/components/layout/PageTransition';

type Props = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    /** Nome mostrado no meio da cortina. */
    transitionLabel?: string;
    /** Usa View Transitions API (elemento compartilhado) em vez da cortina. */
    viewTransition?: boolean;
  };

/** Link interno que passa pela cortina de transição. Ctrl/⌘+clique continua abrindo nova aba. */
export const TransitionLink = forwardRef<HTMLAnchorElement, Props>(function TransitionLink(
  { href, onClick, transitionLabel, viewTransition, ...rest },
  ref,
) {
  const { navigate } = usePageTransition();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (rest.target && rest.target !== '_self') return;
    e.preventDefault();
    navigate(href.toString(), { label: transitionLabel, viewTransition });
  };
  return <Link ref={ref} href={href} onClick={handle} {...rest} />;
});
