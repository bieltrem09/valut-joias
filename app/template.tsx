"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Troca de rota: entra com opacity 0→1 e y 6→0 em 220ms. Sem slide lateral.
 * Com movimento reduzido, o deslocamento some e o fade fica.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, transform: "translateY(6px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)", transitionEnd: { transform: "none" } }}
      // A transição não vai para o HTML do servidor, então ramificar aqui não quebra a hidratação.
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1], transform: reduce ? { duration: 0 } : undefined }}
    >
      {children}
    </motion.div>
  );
}
