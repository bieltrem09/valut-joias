"use client";
import { useNow } from "@/lib/useNow";

/** Relógio ao vivo de Americana no chip do hero (momento de assinatura #2). */
export function HeroClock() {
  const now = useNow();
  return (
    <span className="tnum" aria-live="off">
      {now ? now.hhmm : "24H"} · Aberto agora
    </span>
  );
}
