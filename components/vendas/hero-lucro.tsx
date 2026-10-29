"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { RollingNumber } from "@/components/ui/rolling-number";
import { formatBRL, formatPct } from "@/lib/format";
import type { PontoDiario, Resumo } from "@/lib/finance";
import { variacao } from "@/lib/finance";
import { cn } from "@/lib/utils";

/** Gráfico em pedaço separado: a página abre sem esperar a biblioteca de gráficos. */
const LucroChart = dynamic(() => import("@/components/graficos").then((m) => m.LucroChart), { ssr: false });

/**
 * Card principal (referência "400%"): fundo violeta escuro com brilho na base,
 * grade sutil, curva luminosa com ponto pulsando no pico e o número grande
 * centralizado embaixo. Movimento: brilhos derivando, base "respirando",
 * linha que se desenha e um reflexo que atravessa o card.
 */
export function HeroLucro({
  resumo,
  anterior,
  serie,
  fraseAnterior,
  periodKey,
  periodoLabel,
  vendasDoDia = [],
}: {
  vendasDoDia?: { id: number; empresa: string; valor: number; status: string }[];
  resumo: Resumo;
  anterior: Resumo;
  serie: PontoDiario[];
  fraseAnterior: string;
  periodKey: string;
  periodoLabel: string;
}) {
  const v = variacao(resumo.lucroLiquido, anterior.lucroLiquido);
  const semVendas = resumo.vendasPagas === 0 && resumo.receitaBruta === 0;
  const umDia = serie.length <= 1;

  return (
    <section
      aria-labelledby="hero-title"
      className="hero-card relative isolate flex h-full min-h-[420px] flex-col overflow-hidden rounded-[28px] p-6 text-hero-foreground md:min-h-[480px] md:p-8"
    >
      <HeroFundo />

      <div className="flex items-center justify-between gap-3">
        <p className="text-13 text-hero-muted">
          <span className="hero-live mr-2 inline-block size-1.5 rounded-full align-middle" aria-hidden />
          Dados atualizados agora
        </p>
        <span className="rounded-full bg-[oklch(1_0_0/0.08)] px-3 py-1 text-13 text-hero-foreground ring-1 ring-[oklch(1_0_0/0.12)] backdrop-blur-sm">
          {periodoLabel}
        </span>
      </div>

      <div className="relative mt-4 min-h-[180px] flex-1">
        {semVendas ? <CurvaFantasma /> : umDia ? <OneDay resumo={resumo} periodKey={periodKey} vendas={vendasDoDia} /> : <LucroChart serie={serie} />}
      </div>

      <div className="relative mt-4 text-center">
        <h2 id="hero-title" className="text-14 text-hero-muted">
          Lucro líquido no período
        </h2>
        <p className="hero-number mt-2 font-sans text-[48px] font-semibold leading-none tracking-[-0.04em] tabular sm:text-[64px]">
          <RollingNumber value={resumo.lucroLiquido} format={formatBRL} />
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-12">
          {v !== null && v !== 0 && !semVendas ? (
            <span className="inline-flex items-center gap-1 text-hero-muted" title={`Comparado com ${fraseAnterior}: ${formatBRL(anterior.lucroLiquido)}`}>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-mono font-medium tabular",
                  v > 0 ? "text-[oklch(0.82_0.17_150)]" : "text-[oklch(0.78_0.15_25)]",
                )}
              >
                {v > 0 ? <ArrowUpRight className="size-3.5" strokeWidth={2} /> : <ArrowDownRight className="size-3.5" strokeWidth={2} />}
                {v > 0 ? "+" : "−"}
                {formatPct(Math.abs(v))}
              </span>
              vs. {fraseAnterior}
            </span>
          ) : (
            <span className="text-hero-muted">{semVendas ? "Registre a primeira venda para começar" : "Sem base de comparação"}</span>
          )}
          {!semVendas && (
            <span className="text-hero-muted">
              · margem <span className="font-mono tabular text-hero-foreground">{formatPct(resumo.margemLiquida)}</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

/** Camadas de luz do card. Só transform/opacity animados (CSS). */
function HeroFundo() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-1">
      <div className="hero-blob hero-blob-a" />
      <div className="hero-blob hero-blob-b" />
      <div className="hero-grid" />
      <div className="hero-base" />
      <div className="hero-sheen" />
    </div>
  );
}

/**
 * Sem vendas ainda: a curva aparece apagada, só como forma, com o ponto
 * pulsando. Deixa claro onde o gráfico vai nascer, sem inventar números.
 */
function CurvaFantasma() {
  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <linearGradient id="fantasma" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="oklch(0.75 0.16 295)" stopOpacity="0.15" />
            <stop offset="0.5" stopColor="oklch(0.85 0.12 300)" stopOpacity="0.7" />
            <stop offset="1" stopColor="oklch(0.75 0.16 295)" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path
          className="hero-ghost"
          d="M0 120 C 60 112, 110 128, 170 110 C 205 98, 210 26, 240 26 C 272 26, 280 108, 320 116 C 350 122, 380 112, 400 104"
          fill="none"
          stroke="url(#fantasma)"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
        />
      </svg>
      <span className="hero-ghost-dot absolute left-[60%] top-[16%] -ml-2 -mt-2 size-4 rounded-full" aria-hidden />
      <p className="absolute inset-x-0 bottom-0 text-center text-13 text-hero-muted">Sua primeira venda desenha esta curva.</p>
    </div>
  );
}

function OneDay({
  resumo,
  periodKey,
  vendas,
}: {
  resumo: Resumo;
  periodKey: string;
  vendas: { id: number; empresa: string; valor: number; status: string }[];
}) {
  return (
    <div className="absolute inset-0 flex flex-col justify-end">
      {vendas.length > 0 && (
        <ul className="mb-auto grid gap-2.5" aria-label="Vendas do dia">
          {vendas.slice(0, 4).map((v) => (
            <li key={v.id} className="flex items-baseline justify-between gap-4 text-13">
              <span className="truncate">{v.empresa}</span>
              <span className="shrink-0 font-mono tabular">
                {v.status === "paga" ? formatBRL(v.valor) : <span className="text-hero-muted">{formatBRL(v.valor)} · pendente</span>}
              </span>
            </li>
          ))}
          {vendas.length > 4 && <li className="text-12 text-hero-muted">e mais {vendas.length - 4}</li>}
        </ul>
      )}
      <dl className="grid grid-cols-3 gap-4 border-t border-[oklch(1_0_0/0.12)] pt-4">
        {[
          ["Vendas pagas", String(resumo.vendasPagas)],
          ["Entrou", formatBRL(resumo.receitaBruta)],
          ["Saiu", formatBRL(resumo.gastos)],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-12 text-hero-muted">{k}</dt>
            <dd className="mt-1 truncate font-mono text-16 tabular sm:text-20">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-13 text-hero-muted">
        Um dia só não faz curva.{" "}
        <Link
          href={`?p=7d`}
          className="font-medium text-hero-foreground underline decoration-current/40 underline-offset-4 hover-fine:decoration-current"
          scroll={false}
        >
          Ver os últimos 7 dias
        </Link>
        {periodKey === "hoje" ? " para comparar." : "."}
      </p>
    </div>
  );
}
