"use client";
import { useEffect, useState } from "react";
import { nowInSaoPaulo } from "./time";

/**
 * Relógio de Americana atualizado a cada minuto (alinhado à virada do minuto),
 * sem loop por frame. null no SSR para evitar mismatch de hidratação.
 */
export function useNow() {
  const [now, setNow] = useState<ReturnType<typeof nowInSaoPaulo> | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(nowInSaoPaulo());
      t = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    };
    tick();
    return () => clearTimeout(t);
  }, []);
  return now;
}
