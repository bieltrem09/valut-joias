import { CT_PATH, LOGO_VIEWBOX, WORDMARK_LETTERS, WORDMARK_PATH, WORDMARK_VIEWBOX } from "./logo-paths";

type Variant = "white-red" | "black-red" | "mono-white" | "mono-black";

const fills: Record<Variant, [string, string]> = {
  "white-red": ["var(--color-white)", "var(--color-red)"],
  "black-red": ["var(--color-black)", "var(--color-red)"],
  "mono-white": ["var(--color-white)", "var(--color-white)"],
  "mono-black": ["var(--color-black)", "var(--color-black)"],
};

/**
 * Logo oficial (vetor do kit em public/brand). Nunca recriar com fonte.
 * Largura mínima 120px; área de proteção = altura do "CT." (aplicada via padding pelo uso).
 */
export function Logo({
  variant = "white-red",
  className,
  title = "Zero Um CT",
}: {
  variant?: Variant;
  className?: string;
  title?: string;
}) {
  const [w, r] = fills[variant];
  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} role="img" aria-label={title}>
      <path fill={w} fillRule="evenodd" d={WORDMARK_PATH} />
      <path fill={r} fillRule="evenodd" d={CT_PATH} />
    </svg>
  );
}

/**
 * Só a palavra ZEROUM, uma <path> por letra (para o stagger do hero e o
 * logo gigante do footer). Decorativa: aria-hidden.
 */
export function Wordmark({ className, fill = "currentColor" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox={WORDMARK_VIEWBOX} className={className} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
      {WORDMARK_LETTERS.map((d, i) => (
        <path key={i} data-letter fill={fill} fillRule="evenodd" d={d} />
      ))}
    </svg>
  );
}
