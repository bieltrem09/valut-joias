"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ícone neon da navegação (referência: ícones em contorno violeta com brilho).
 * A cada clique: o ícone "acende" (pulso de escala), um anel de luz se expande
 * e seis faíscas saem em volta. `burst` muda a cada clique para reiniciar.
 */
export function NeonIcon({ icon: Icon, active, burst, size = 20 }: { icon: LucideIcon; active: boolean; burst: number; size?: number }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size + 8, height: size + 8 }}>
      <motion.span
        key={reduce ? "static" : `i${burst}`}
        initial={burst && !reduce ? { scale: 0.7 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 14 }}
        className={cn("neon-icon relative grid place-items-center", active && "is-active")}
      >
        <Icon style={{ width: size, height: size }} strokeWidth={1.75} />
      </motion.span>
      <AnimatePresence>
        {burst > 0 && !reduce && (
          <motion.span
            key={`b${burst}`}
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.span
              className="neon-ring absolute inset-0 rounded-full"
              initial={{ scale: 0.6, opacity: 0.9 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            />
            {Array.from({ length: 6 }, (_, i) => {
              const a = (i / 6) * Math.PI * 2 + 0.4;
              return (
                <motion.span
                  key={i}
                  className="neon-spark absolute left-1/2 top-1/2 size-1 -ml-0.5 -mt-0.5 rounded-full"
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{ x: Math.cos(a) * 22, y: Math.sin(a) * 22, scale: 0.2, opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
                />
              );
            })}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/** Guarda o "último clique" por item para disparar a animação. */
export function useBurst() {
  const [bursts, setBursts] = React.useState<Record<string, number>>({});
  const fire = React.useCallback((key: string) => setBursts((b) => ({ ...b, [key]: (b[key] ?? 0) + 1 })), []);
  return { bursts, fire };
}
