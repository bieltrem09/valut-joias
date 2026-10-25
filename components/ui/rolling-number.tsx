"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion, useSpring } from "motion/react";

/**
 * Número que rola até o novo valor. O spring escreve direto no DOM
 * (textContent), sem re-render por frame. Com movimento reduzido, troca seco.
 */
export function RollingNumber({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const spring = useSpring(value, { stiffness: 140, damping: 26, mass: 0.9 });
  const fmt = useRef(format);
  fmt.current = format;

  useEffect(() => {
    if (reduce) spring.jump(value);
    else spring.set(value);
  }, [value, reduce, spring]);

  useEffect(
    () =>
      spring.on("change", (v) => {
        if (ref.current) ref.current.textContent = fmt.current(v);
      }),
    [spring],
  );

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
