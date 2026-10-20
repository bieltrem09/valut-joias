import { cn } from '@/lib/format';
import { LogoSymbol } from './Logo';

/** Selo circular com texto girando e o símbolo VALUT no centro. */
export function RotatingBadge({ text, className }: { text: string; className?: string }) {
  return (
    <div aria-hidden className={cn('relative grid aspect-square place-items-center rounded-full bg-ivory text-ink shadow-[0_18px_40px_-18px_rgba(14,13,11,.45)]', className)}>
      <svg viewBox="0 0 100 100" className="badge-spin absolute inset-[6%] h-[88%] w-[88%] overflow-visible">
        <defs>
          <path id="badge-circle" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" />
        </defs>
        <text fontSize="8.6" letterSpacing="2.6" style={{ fontFamily: 'var(--font-sans)', textTransform: 'uppercase', fontWeight: 500 }} fill="currentColor">
          <textPath href="#badge-circle">{text}</textPath>
        </text>
      </svg>
      <LogoSymbol className="relative h-[34%] w-[34%] text-gold" />
    </div>
  );
}
