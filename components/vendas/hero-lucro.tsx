"use client";

import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { RollingNumber } from "@/components/ui/rolling-number";
import { GridGlow } from "@/components/ui/grid-glow";
import { formatBRL, formatPct } from "@/lib/format";
import { shortDate } from "@/lib/dates";
import type { PontoDiario, Resumo } from "@/lib/finance";
import { variacao } from "@/lib/finance";
import { cn } from "@/lib/utils";

export function HeroLucro({
  resumo,
  anterior,
  serie,
  fraseAnterior,
  periodKey,
  vendasDoDia = [],
}: {
  vendasDoDia?: { id: number; empresa: string; valor: number; status: string }[];
  resumo: Resumo;
  anterior: Resumo;
  serie: PontoDiario[];
  fraseAnterior: string;
  periodKey: string;
}) {
  const v = variacao(resumo.lucroLiquido, anterior.lucroLiquido);
  const semVendas = resumo.vendasPagas === 0 && resumo.receitaBruta === 0;
  const umDia = serie.length <= 1;

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex h-full min-h-[360px] flex-col overflow-hidden rounded-card bg-hero p-6 text-hero-foreground shadow-hairline ring-1 ring-border md:min-h-[420px] md:p-8 dark:ring-[color-mix(in_oklch,var(--primary)_22%,transparent)]"
    >
      {/* Grade só no escuro: dá profundidade sem virar decoração no claro. */}
      <GridGlow color="var(--hero-line)" className="-z-1 hidden dark:block" intensity={0.1} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="hero-title" className="eyebrow text-hero-muted">
            Lucro líquido no período
          </h2>
          <p className="mt-3 font-mono text-[44px] font-medium leading-none tracking-[-0.03em] tabular sm:text-56">
            <RollingNumber value={resumo.lucroLiquido} format={formatBRL} />
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-hero-chip px-2.5 py-1 text-12 font-medium">
              <span className="font-mono tabular">{formatPct(resumo.margemLiquida)}</span> de margem
            </span>
            {v !== null && v !== 0 && !semVendas && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-hero-chip px-2.5 py-1 text-12 font-medium"
                title={`Comparado com ${fraseAnterior}: ${formatBRL(anterior.lucroLiquido)}`}
              >
                {v > 0 ? <ArrowUpRight className="size-3.5" strokeWidth={2} /> : <ArrowDownRight className="size-3.5" strokeWidth={2} />}
                <span className="font-mono tabular">
                  {v > 0 ? "+" : "−"}
                  {formatPct(Math.abs(v))}
                </span>
                <span className="text-hero-muted">vs. {fraseAnterior}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative mt-6 min-h-[200px] flex-1">
        {semVendas ? <EmptyHero /> : umDia ? <OneDay resumo={resumo} periodKey={periodKey} vendas={vendasDoDia} /> : <LucroChart serie={serie} />}
      </div>
    </section>
  );
}

function LucroChart({ serie }: { serie: PontoDiario[] }) {
  const reduce = useReducedMotion();
  const values = serie.map((p) => p.acumulado);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const ticks = [serie[0].data, serie[Math.floor(serie.length / 2)].data, serie[serie.length - 1].data];

  return (
    <div
      className="absolute inset-0 -mx-2"
      role="img"
      aria-label={`Lucro acumulado: começa em ${formatBRL(values[0])} e termina em ${formatBRL(values.at(-1)!)}.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--hero-line)", stopOpacity: 0.22 }} />
              <stop offset="100%" style={{ stopColor: "var(--hero-line)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[min * 1.1, max * 1.12 || 1]} />
          <XAxis
            dataKey="data"
            ticks={ticks}
            interval={0}
            axisLine={false}
            tickLine={false}
            tick={(t: { x?: number | string; y?: number | string; index: number; payload: { value: string } }) => (
              <text
                x={t.x}
                y={t.y}
                dy={4}
                textAnchor={t.index === 0 ? "start" : t.index === ticks.length - 1 ? "end" : "middle"}
                fill="var(--hero-fg-muted)"
                fontSize={11}
                fontFamily="var(--font-jetbrains)"
              >
                {shortDate(t.payload.value)}
              </text>
            )}
            tickMargin={10}
          />
          {min < 0 && <ReferenceLine y={0} stroke="var(--hero-fg-muted)" strokeOpacity={0.35} strokeDasharray="2 4" />}
          <Tooltip
            content={(p) => <HeroTooltip active={p.active} payload={p.payload} />}
            cursor={{ stroke: "var(--hero-fg-muted)", strokeOpacity: 0.4, strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="acumulado"
            stroke="var(--hero-line)"
            strokeWidth={1.5}
            fill="url(#hero-fill)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--hero-bg)", fill: "var(--hero-line)" }}
            isAnimationActive={!reduce}
            animationDuration={600}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function HeroTooltip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }) {
  const p = payload?.[0]?.payload as PontoDiario | undefined;
  if (!active || !p) return null;
  return (
    <div className="min-w-44 rounded-control bg-popover px-3 py-2.5 text-popover-foreground shadow-pop ring-1 ring-border">
      <p className="font-mono text-11 text-muted-foreground">{shortDate(p.data)}</p>
      <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-12">
        <dt className="text-muted-foreground">No dia</dt>
        <dd className={cn("text-right font-mono tabular", p.lucro < 0 ? "text-cost" : "text-foreground")}>{formatBRL(p.lucro)}</dd>
        <dt className="text-muted-foreground">Acumulado</dt>
        <dd className="text-right font-mono font-medium tabular">{formatBRL(p.acumulado)}</dd>
      </dl>
    </div>
  );
}

function EmptyHero() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <GridGlow color="var(--hero-fg)" intensity={0.12} />
      <svg viewBox="0 0 320 90" className="absolute inset-x-6 bottom-6 h-20 w-[calc(100%-3rem)]" preserveAspectRatio="none" aria-hidden>
        <path
          d="M0 80 C 60 78, 90 70, 140 58 S 230 30, 320 12"
          fill="none"
          stroke="var(--hero-fg)"
          strokeOpacity=".35"
          strokeWidth="1.5"
          strokeDasharray="3 5"
        />
      </svg>
      <div className="relative text-center">
        <p className="text-16 font-medium">Sua primeira venda aparece aqui</p>
        <p className="mt-1 text-13 text-hero-muted">Nada pago neste período. Tente um intervalo maior.</p>
      </div>
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
      <dl className="grid grid-cols-3 gap-4 border-t border-[color-mix(in_oklch,var(--hero-fg)_18%,transparent)] pt-4">
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
      <p className="mt-4 text-13 text-hero-muted">
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
