"use client";

import { motion, useReducedMotion } from "motion/react";
import { composicaoDoReal, type Resumo } from "@/lib/finance";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

const centavos = (f: number) => `${Math.round(f * 100)}¢`;

/**
 * "De onde vai cada real": cascata horizontal. A receita é a barra cheia;
 * cada saída é recortada da ponta direita, e o que sobra é o lucro.
 */
export function CadaReal({ resumo }: { resumo: Resumo }) {
  const reduce = useReducedMotion();
  const c = composicaoDoReal(resumo);
  const vazio = resumo.receitaBruta <= 0;

  const rows = [
    { key: "receita", label: "Receita", value: resumo.receitaBruta, start: 0, size: 1, bar: "bg-primary", note: "R$ 1,00" },
    { key: "cmv", label: "Placas (CMV)", value: -resumo.cmv, start: 1 - c.cmv, size: c.cmv, bar: "bg-cost", note: centavos(c.cmv) },
    {
      key: "despesas",
      label: "Despesas",
      value: -resumo.despesasOperacionais,
      start: Math.max(0, 1 - c.cmv - c.despesas),
      size: Math.min(c.despesas, 1 - c.cmv),
      bar: "bg-cost/45",
      note: centavos(c.despesas),
      noteClass: "text-foreground",
    },
    {
      key: "lucro",
      label: c.prejuizo > 0 ? "Prejuízo" : "Lucro",
      value: resumo.lucroLiquido,
      start: 0,
      size: c.prejuizo > 0 ? Math.min(1, c.prejuizo) : c.lucro,
      bar: c.prejuizo > 0 ? "bg-cost" : "bg-profit",
      note: centavos(c.prejuizo > 0 ? c.prejuizo : c.lucro),
    },
  ];

  return (
    <section aria-labelledby="cada-real" className="surface p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id="cada-real" className="text-16 font-semibold tracking-[-0.01em]">
            De onde vai cada real
          </h2>
          <p className="mt-1 text-13 text-muted-foreground">
            {vazio
              ? "Aparece quando entrar a primeira venda paga."
              : c.prejuizo > 0
                ? `Cada real vendido custou ${centavos(1 + c.prejuizo)}.`
                : `De cada R$ 1,00 vendido, ${centavos(c.lucro)} ficam com você.`}
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-3">
        {rows.map((r, i) => (
          <div key={r.key} className="grid grid-cols-[96px_1fr] items-center gap-x-4 gap-y-1 sm:grid-cols-[120px_1fr_120px]">
            <dt className="text-13 text-subtle-foreground">{r.label}</dt>
            <dd className="relative order-3 col-span-2 h-7 sm:order-none sm:col-span-1">
              {/* trilho: mostra o R$ 1,00 inteiro como referência */}
              <span className="absolute inset-0 rounded-[6px] bg-muted" aria-hidden />
              {!vazio && (
                <motion.span
                  aria-hidden
                  className={cn("absolute inset-y-0 rounded-[6px]", r.bar)}
                  style={{
                    left: `${r.start * 100}%`,
                    width: `${Math.max(r.size * 100, r.size > 0 ? 0.6 : 0)}%`,
                    transformOrigin: r.key === "lucro" || r.key === "receita" ? "left" : "right",
                  }}
                  initial={{ transform: "scaleX(0)" }}
                  animate={{ transform: "scaleX(1)" }}
                  transition={{ duration: 0.5, delay: 0.08 * i, ease: [0.23, 1, 0.32, 1], ...(reduce ? { duration: 0, delay: 0 } : {}) }}
                />
              )}
              {!vazio && (
                <span
                  className={cn("absolute inset-y-0 flex items-center px-2 font-mono text-11 tabular text-primary-foreground", "noteClass" in r && r.noteClass)}
                  style={{ left: `${r.start * 100}%` }}
                >
                  {r.size > 0.09 ? r.note : ""}
                </span>
              )}
            </dd>
            <dd
              className={cn(
                "text-right font-mono text-13 tabular",
                r.key === "lucro" ? (r.value < 0 ? "text-cost" : "font-medium text-foreground") : r.value < 0 ? "text-subtle-foreground" : "text-foreground",
              )}
            >
              {r.value < 0 ? `−${formatBRL(-r.value)}` : formatBRL(r.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
