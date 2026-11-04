"use client";

/**
 * Dígitos que rolam na vertical ao mudar (tabular-nums, sem layout shift).
 * emil/animate: state indication · transform translateY · 240ms ease-out · interrompível (transition).
 * Reduced motion: troca instantânea.
 */
export function RollingNumber({ value, className = "" }: { value: string; className?: string }) {
  return (
    <span className={`tnum inline-flex ${className}`}>
      <span className="sr-only">{value}</span>
      {value.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} className="relative inline-block h-[1em] overflow-hidden leading-none" aria-hidden="true">
            <span
              className="flex flex-col transition-transform duration-[240ms] ease-[var(--ease-out)] motion-reduce:transition-none"
              style={{ transform: `translateY(-${Number(ch) * 10}%)` }}
            >
              {"0123456789".split("").map((d) => (
                <span key={d} className="block h-[1em] leading-none">
                  {d}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden="true" className="inline-block leading-none">
            {ch}
          </span>
        ),
      )}
    </span>
  );
}
