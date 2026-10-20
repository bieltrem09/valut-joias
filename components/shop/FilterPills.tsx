'use client';

import { motion } from 'motion/react';
import { useId } from 'react';
import { cn } from '@/lib/format';

/** Pílulas de filtro com o fundo ativo deslizando entre elas (layoutId). */
export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  label,
  tone = 'light',
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  tone?: 'light' | 'dark';
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className="no-scrollbar flex gap-2 overflow-x-auto">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative shrink-0 rounded-full border px-5 py-2.5 text-sm transition-colors duration-300',
              tone === 'light' ? 'border-ink/20' : 'border-ivory/30',
              active ? (tone === 'light' ? 'text-ivory' : 'text-ink') : tone === 'light' ? 'hover:border-ink' : 'hover:border-ivory',
            )}
          >
            {active && (
              <motion.span
                layoutId={`pill-${id}`}
                className={cn('absolute inset-0 rounded-full', tone === 'light' ? 'bg-ink' : 'bg-ivory')}
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
