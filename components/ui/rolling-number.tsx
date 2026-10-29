"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion, useSpring } from "motion/react";

/**
 * Número que conta de 0 até o valor quando a tela abre (contador que desacelera no fim)
 * e depois rola até cada valor novo. Escreve direto no DOM (textContent), sem re-render
 * por frame. Com movimento reduzido, mostra o valor seco.
 */
export function RollingNumber({
  value,
  format,
  className,
  contar = true,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
  /** Contar de 0 ao abrir a tela. */
  contar?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const spring = useSpring(value, { stiffness: 140, damping: 26, mass: 0.9 });
  const fmt = useRef(format);
  fmt.current = format;
  const primeira = useRef(true);

  useEffect(() => {
    const escrever = (v: number) => {
      if (ref.current) ref.current.textContent = fmt.current(v);
    };
    if (reduce) {
      spring.jump(value);
      escrever(value);
      return;
    }
    if (primeira.current) {
      primeira.current = false;
      if (contar && value !== 0) {
        // Contagem de abertura: mais longa para valores grandes, sem passar de 1,6 s.
        const duracao = Math.min(1.6, 0.8 + Math.log10(Math.abs(value) + 1) * 0.15);
        const c = animate(0, value, {
          duration: duracao,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: escrever,
          // Só depois de contar o "rolar" assume (os dois juntos fariam o valor piscar).
          onComplete: () => spring.jump(value),
        });
        return () => {
          c.stop();
          spring.jump(value);
          escrever(value);
        };
      }
    }
    spring.set(value);
  }, [value, reduce, spring, contar]);

  useEffect(
    () =>
      spring.on("change", (v) => {
        if (ref.current) ref.current.textContent = fmt.current(v);
      }),
    [spring],
  );

  return (
    <span ref={ref} className={className}>
      {/* Começa no 0 para a contagem não "piscar" o valor final antes de contar. */}
      {format(contar ? 0 : value)}
    </span>
  );
}
