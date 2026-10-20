'use client';

import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, useRef } from 'react';
import { useMagnetic } from '@/lib/animations';
import { cn } from '@/lib/format';
import { TransitionLink } from './TransitionLink';

/** Texto que "rola": cada letra sobe e é substituída por uma cópia vinda de baixo. */
export function RollText({ children }: { children: string }) {
  return (
    <span className="roll" aria-hidden>
      {[...children].map((ch, i) => {
        const c = ch === ' ' ? ' ' : ch;
        return (
          <span key={i} data-char={c} style={{ ['--i' as string]: i }}>
            {c}
          </span>
        );
      })}
    </span>
  );
}

type Variant = 'dark' | 'light' | 'outline' | 'outline-light' | 'gold';
const variants: Record<Variant, string> = {
  dark: 'bg-ink text-ivory',
  light: 'bg-ivory text-ink',
  gold: 'bg-gold text-ink',
  outline: 'border border-ink/80 text-ink',
  'outline-light': 'border border-ivory/70 text-ivory',
};

type Common = { label: string; variant?: Variant; icon?: ReactNode; className?: string; magnetic?: boolean; size?: 'md' | 'lg' };

function Inner({ label, icon }: { label: string; icon?: ReactNode }) {
  return (
    <>
      <span className="sr-only">{label}</span>
      <RollText>{label}</RollText>
      {icon && <span className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1">{icon}</span>}
    </>
  );
}

const pillClass = (variant: Variant, size: 'md' | 'lg', className?: string) =>
  cn(
    'roll-host group relative inline-flex items-center justify-center gap-3 rounded-full font-medium tracking-[0.02em] whitespace-nowrap transition-[background-color,color,box-shadow] duration-300 will-change-transform select-none',
    size === 'lg' ? 'h-14 px-8 text-[15px]' : 'h-12 px-6 text-sm',
    variants[variant],
    className,
  );

/** Pílula magnética com roll de letras. `href` interno passa pela cortina de transição. */
export function PillLink({ label, variant = 'dark', icon, className, href, magnetic = true, size = 'md', external, transitionLabel, ...rest }: Common & { href: string; external?: boolean; transitionLabel?: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const ref = useRef<HTMLAnchorElement>(null);
  useMagnetic(ref, magnetic ? 0.3 : 0);
  if (external)
    return (
      <a ref={ref} href={href} target="_blank" rel="noopener noreferrer" className={pillClass(variant, size, className)} {...rest}>
        <Inner label={label} icon={icon} />
      </a>
    );
  return (
    <TransitionLink ref={ref} href={href} transitionLabel={transitionLabel} className={pillClass(variant, size, className)} {...rest}>
      <Inner label={label} icon={icon} />
    </TransitionLink>
  );
}

export function PillButton({ label, variant = 'dark', icon, className, magnetic = true, size = 'md', ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  const ref = useRef<HTMLButtonElement>(null);
  useMagnetic(ref, magnetic ? 0.3 : 0);
  return (
    <button ref={ref} type="button" className={cn(pillClass(variant, size, className), 'disabled:opacity-40 disabled:pointer-events-none')} {...rest}>
      <Inner label={label} icon={icon} />
    </button>
  );
}
