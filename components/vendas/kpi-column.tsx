"use client";

import { RollingNumber } from "@/components/ui/rolling-number";
import { formatBRL, formatPct } from "@/lib/format";
import { variacao, type PontoDiario, type Resumo } from "@/lib/finance";
import { cn } from "@/lib/utils";

type Kpi = {
  key: string;
  label: string;
  value: number;
  prev: number;
  caption: string;
  series: number[];
  /** Para gastos, subir é ruim. */
  inverse?: boolean;
  tone: "brand" | "profit" | "cost" | "pending";
};

export function KpiColumn({ resumo, anterior, serie }: { resumo: Resumo; anterior: Resumo; serie: PontoDiario[] }) {
  const kpis: Kpi[] = [
    {
      key: "receita",
      label: "Receita bruta",
      value: resumo.receitaBruta,
      prev: anterior.receitaBruta,
      caption: resumo.vendasPagas
        ? `${resumo.vendasPagas} ${resumo.vendasPagas === 1 ? "venda paga" : "vendas pagas"} · ticket ${formatBRL(resumo.ticketMedio)}`
        : "nenhuma venda paga",
      series: serie.map((p) => p.receita),
      tone: "brand",
    },
    {
      key: "bruto",
      label: "Lucro bruto",
      value: resumo.lucroBruto,
      prev: anterior.lucroBruto,
      caption: resumo.receitaBruta ? `sobra ${formatPct(resumo.lucroBruto / resumo.receitaBruta)} depois das placas` : "receita menos custo das placas",
      series: serie.map((p) => p.receita - p.cmv),
      tone: "profit",
    },
    {
      key: "gastos",
      label: "Gastos",
      value: resumo.gastos,
      prev: anterior.gastos,
      caption: `${formatBRL(resumo.cmv)} em placas · ${formatBRL(resumo.despesasOperacionais)} em despesas`,
      series: serie.map((p) => p.cmv + p.despesas),
      inverse: true,
      tone: "cost",
    },
    {
      key: "receber",
      label: "A receber",
      value: resumo.aReceber,
      prev: anterior.aReceber,
      caption: resumo.vendasPendentes ? `${resumo.vendasPendentes} ${resumo.vendasPendentes === 1 ? "venda pendente" : "vendas pendentes"}` : "tudo recebido",
      series: [],
      tone: "pending",
    },
  ];

  return (
    <ul
      aria-label="Indicadores do período"
      className={cn(
        // <768: carrossel com snap; 768–1279: 2×2; ≥1280: coluna.
        "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1",
        "md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0",
        "xl:grid-cols-1 xl:grid-rows-4",
      )}
    >
      {kpis.map((k) => (
        <KpiCard key={k.key} kpi={k} />
      ))}
    </ul>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const v = variacao(kpi.value, kpi.prev);
  const good = v === null || v === 0 ? null : kpi.inverse ? v < 0 : v > 0;
  return (
    <li className="surface toque flex w-[78%] shrink-0 snap-start flex-col justify-between gap-3 p-5 sm:w-[46%] md:w-auto">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-13 text-muted-foreground">{kpi.label}</h3>
        {v !== null && v !== 0 && kpi.key !== "receber" && (
          <span className={cn("font-mono text-11 tabular", good ? "text-profit" : "text-cost")} title="Comparado com o período anterior">
            {v > 0 ? "▲" : "▼"} {formatPct(Math.abs(v))}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="font-mono text-20 font-medium tracking-[-0.02em] tabular">
          <RollingNumber value={kpi.value} format={formatBRL} />
        </p>
        {kpi.series.length > 1 && kpi.series.some((v) => v !== 0) && <Sparkline values={kpi.series} tone={kpi.tone} />}
      </div>
      <p className="truncate text-12 text-muted-foreground" title={kpi.caption}>
        {kpi.caption}
      </p>
    </li>
  );
}

const TONE: Record<Kpi["tone"], string> = {
  brand: "text-primary",
  profit: "text-profit",
  cost: "text-cost",
  pending: "text-pending",
};

/** Linha minúscula, sem eixo: tendência, não valor. Acumulada para não serrilhar. */
function Sparkline({ values, tone }: { values: number[]; tone: Kpi["tone"] }) {
  let acc = 0;
  const pts = values.map((v) => (acc += v));
  const w = 72;
  const h = 24;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const d = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${((i / (pts.length - 1)) * w).toFixed(1)} ${(h - 2 - ((p - min) / span) * (h - 4)).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className={cn("shrink-0 overflow-visible", TONE[tone])} aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
