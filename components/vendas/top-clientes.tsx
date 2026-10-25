"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { CompanyAvatar } from "@/components/ui/company-avatar";
import { formatBRL } from "@/lib/format";
import type { TopCliente } from "@/lib/data/vendas";

export function TopClientes({ clientes }: { clientes: TopCliente[] }) {
  const reduce = useReducedMotion();
  const max = clientes[0]?.faturamento ?? 0;
  return (
    <section aria-labelledby="top-clientes" className="surface toque flex flex-col p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="top-clientes" className="text-16 font-semibold tracking-[-0.01em]">
          Melhores clientes do período
        </h2>
        <Link href="/clientes" className="text-13 font-medium text-primary underline-offset-4 hover-fine:underline">
          Ver todos
        </Link>
      </div>
      {clientes.length === 0 ? (
        <p className="mt-6 text-13 text-muted-foreground">Quando alguém pagar uma placa neste período, aparece aqui.</p>
      ) : (
        <ol className="mt-5 grid gap-4">
          {clientes.map((c, i) => (
            <li key={c.empresaId} className="grid grid-cols-[16px_28px_1fr_auto] items-center gap-x-3 gap-y-1.5">
              <span className="font-mono text-11 text-muted-foreground tabular">{i + 1}</span>
              <CompanyAvatar nome={c.nome} categoria={c.categoria} src={c.fotoUrl} />
              <div className="min-w-0">
                <p className="truncate text-14 font-medium">{c.nome}</p>
                <p className="truncate text-12 text-muted-foreground">
                  {c.cidade} · {c.vendas} {c.vendas === 1 ? "compra" : "compras"}
                </p>
              </div>
              <span className="font-mono text-13 tabular">{formatBRL(c.faturamento)}</span>
              <span className="col-span-2" />
              <span className="col-span-2 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                <motion.span
                  className="block h-full origin-left rounded-full bg-primary"
                  style={{ width: `${(c.faturamento / max) * 100}%` }}
                  initial={{ transform: "scaleX(0)" }}
                  animate={{ transform: "scaleX(1)" }}
                  transition={{ duration: 0.5, delay: 0.05 * i, ease: [0.23, 1, 0.32, 1], ...(reduce ? { duration: 0, delay: 0 } : {}) }}
                />
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
