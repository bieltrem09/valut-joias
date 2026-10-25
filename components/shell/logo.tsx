import { useId } from "react";

/**
 * Marca Basik7: ícone escuro com brilho violeta na base, o "B" metálico
 * (branco → lilás) e o "7" em violeta. Vetor para ficar nítido em qualquer tamanho.
 */
export function LogoMark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Basik7">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c0a18" />
          <stop offset="0.62" stopColor="#120c2a" />
          <stop offset="1" stopColor="#5b34d6" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="1.05" r="0.75">
          <stop offset="0" stopColor="#b69bff" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#7a4dff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#7a4dff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-glyph`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#e9e3ff" />
          <stop offset="1" stopColor="#7f62e8" />
        </linearGradient>
        <linearGradient id={`${id}-sete`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d8c8ff" />
          <stop offset="1" stopColor="#8b5cff" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${id}-bg)`} />
      <rect width="64" height="64" rx="15" fill={`url(#${id}-glow)`} />
      <rect x="0.5" y="0.5" width="63" height="63" rx="14.5" fill="none" stroke="#ffffff" strokeOpacity="0.08" />
      <path
        fill={`url(#${id}-glyph)`}
        fillRule="evenodd"
        d="M15 15h14.5a8 8 0 0 1 5.6 13.7A9.5 9.5 0 0 1 31 47H15zM21 21v6.2h8a3.1 3.1 0 0 0 0-6.2zM21 32.6v8.6h9.6a4.3 4.3 0 0 0 0-8.6z"
      />
      <path fill={`url(#${id}-sete)`} d="M38.5 15H51v4.6L44.4 35h-5.6l6.3-15.4h-6.6z" />
    </svg>
  );
}
