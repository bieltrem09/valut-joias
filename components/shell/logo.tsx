import { useId } from "react";

/**
 * Marca Ecloura: ícone escuro com brilho violeta na base e o glifo
 * metálico (branco → lilás). Vetor para ficar nítido em qualquer tamanho.
 */
export function LogoMark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Ecloura">
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
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${id}-bg)`} />
      <rect width="64" height="64" rx="15" fill={`url(#${id}-glow)`} />
      <rect x="0.5" y="0.5" width="63" height="63" rx="14.5" fill="none" stroke="#ffffff" strokeOpacity="0.08" />
      <path d="M19.2 40V25.2c0-4.9 3.9-8.8 8.8-8.8h16.8v13.8h-8.4v-7.1h-9.7V40z" fill={`url(#${id}-glyph)`} />
      <path d="M36.4 30.2h8.4L32.9 51.9h-8.3z" fill={`url(#${id}-glyph)`} />
    </svg>
  );
}
