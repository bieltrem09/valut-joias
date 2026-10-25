"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Motivo } from "@/lib/prospeccao";
import { cn } from "@/lib/utils";

export const PRIORIDADE = {
  maxima: { label: "Prioridade máxima", cls: "bg-profit-soft text-profit" },
  alta: { label: "Alta oportunidade", cls: "bg-accent text-accent-foreground" },
  media: { label: "Média", cls: "bg-pending-soft text-pending" },
  baixa: { label: "Baixa", cls: "bg-muted text-muted-foreground" },
} as const;

export const STATUS_FUNIL: Record<string, string> = {
  novo: "No funil",
  contatado: "Contatado",
  negociando: "Negociando",
  fechado: "Fechado",
  perdido: "Perdido",
};

/** "4,7" ou "4.7" → 4.7; vazio → null. */
export const lerNota = (v: string) => {
  const n = Number(v.replace(",", ".").trim());
  return v.trim() && Number.isFinite(n) ? n : null;
};

export const normNome = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Anel que enche conforme o valor (0–100). */
export function Medidor({ valor, tamanho = 56, rotulo }: { valor: number; tamanho?: number; rotulo?: string }) {
  const reduce = useReducedMotion();
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: tamanho, height: tamanho }}>
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
        <motion.circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.max(0, Math.min(100, valor)) / 100) }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 22 }}
          style={{ filter: "drop-shadow(0 0 6px color-mix(in oklch, var(--primary) 70%, transparent))" }}
        />
      </svg>
      <span className={cn("font-mono font-semibold tabular", tamanho >= 56 ? "text-16" : "text-13")}>
        {valor}
        {rotulo}
      </span>
    </div>
  );
}

/** Lista "por que N pontos", com a base no fim. */
export function Motivos({ motivos, score }: { motivos: Motivo[]; score: number }) {
  const base = score - motivos.reduce((a, m) => a + m.pontos, 0);
  return (
    <ul className="grid gap-1 text-12">
      {motivos.map((m) => (
        <li key={m.texto} className="flex items-baseline justify-between gap-3">
          <span className="text-subtle-foreground">{m.texto}</span>
          <span className={cn("font-mono tabular", m.pontos > 0 ? "text-profit" : m.pontos < 0 ? "text-cost" : "text-muted-foreground")}>
            {m.pontos > 0 ? "+" : ""}
            {m.pontos}
          </span>
        </li>
      ))}
      {base !== 0 && (
        <li className="flex items-baseline justify-between gap-3 border-t border-border pt-1">
          <span className="text-muted-foreground">Base</span>
          <span className="font-mono text-muted-foreground tabular">
            {base > 0 ? "+" : ""}
            {base}
          </span>
        </li>
      )}
    </ul>
  );
}
