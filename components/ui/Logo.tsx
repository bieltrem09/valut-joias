import { SVGProps } from 'react';
import { symbolPaths, wordmarkPaths } from './logo-paths';

/** Símbolo de folhas em V (recriado em SVG a partir do letreiro da loja). */
export function LogoSymbol(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 200" fill="currentColor" role="img" aria-label="Símbolo VALUT" {...props}>
      {symbolPaths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

/** Wordmark "VALUT" com o A em Λ (sem barra). */
export function LogoWordmark({ withTagline = false, ...props }: SVGProps<SVGSVGElement> & { withTagline?: boolean }) {
  return (
    <svg viewBox={withTagline ? '0 0 454 160' : '0 16 454 112'} fill="currentColor" role="img" aria-label="VALUT Semijoias" {...props}>
      {wordmarkPaths.map((d, i) => (
        <path key={i} d={d} />
      ))}
      {withTagline && (
        <text x="227" y="156" textAnchor="middle" fontSize="20" letterSpacing="14" style={{ fontFamily: 'var(--font-sans)' }}>
          SEMIJOIAS
        </text>
      )}
    </svg>
  );
}
