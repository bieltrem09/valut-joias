"use client";

/**
 * Todos os gráficos (recharts) num pedaço só, carregado à parte: as páginas
 * abrem e respondem ao toque sem esperar a biblioteca de gráficos.
 */
import { useReducedMotion } from "motion/react";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { edgeTick } from "@/components/ui/axis-tick";
import type { DespesaCategoria } from "@/lib/db/schema";
import type { PontoDiario } from "@/lib/finance";
import { shortDate } from "@/lib/dates";
import { formatBRL, formatInt } from "@/lib/format";
import { cn } from "@/lib/utils";

export function GraficoToques({ data }: { data: { data: string; n: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap={2}>
        <XAxis dataKey="data" hide />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          isAnimationActive={false}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as { data: string; n: number } | undefined;
            if (!active || !p) return null;
            return (
              <div className="rounded-[8px] bg-popover px-2.5 py-1.5 font-mono text-11 shadow-pop ring-1 ring-border">
                {shortDate(p.data)} · <span className="text-foreground">{p.n}</span>
              </div>
            );
          }}
        />
        <Bar dataKey="n" fill="var(--chart-1)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GraficoCategorias({ porCat, cores }: { porCat: { categoria: DespesaCategoria; valor: number }[]; cores: Record<DespesaCategoria, string> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={porCat}
          dataKey="valor"
          nameKey="categoria"
          innerRadius="84%"
          outerRadius="100%"
          paddingAngle={2}
          cornerRadius={4}
          stroke="var(--card)"
          strokeWidth={2}
          startAngle={90}
          endAngle={-270}
          isAnimationActive={false}
        >
          {porCat.map((c) => (
            <Cell key={c.categoria} fill={cores[c.categoria]} />
          ))}
        </Pie>
        <Tooltip
          isAnimationActive={false}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as { categoria: string; valor: number } | undefined;
            if (!active || !p) return null;
            return (
              <div className="rounded-[8px] bg-popover px-2.5 py-1.5 text-12 shadow-pop ring-1 ring-border">
                {p.categoria} · <span className="font-mono tabular">{formatBRL(p.valor)}</span>
              </div>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

type PontoGeral = { data: string; ganho: number; medido: boolean };

export function GraficoGeral({ serie }: { serie: PontoGeral[] }) {
  const reduce = useReducedMotion();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={serie} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="geral-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--chart-2)", stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: "var(--chart-2)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="data"
          ticks={[serie[0].data, serie.at(-1)!.data]}
          axisLine={false}
          tickLine={false}
          interval={0}
          tick={edgeTick(shortDate, () => 2)}
          tickMargin={8}
        />
        <YAxis hide domain={[0, (max: number) => Math.max(4, Math.ceil(max * 1.15))]} />
        <Tooltip
          isAnimationActive={false}
          cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as PontoGeral | undefined;
            if (!active || !p) return null;
            return (
              <div className="rounded-control bg-popover px-3 py-2 shadow-pop ring-1 ring-border">
                <p className="font-mono text-11 text-muted-foreground">
                  {shortDate(p.data)}
                  {p.medido ? " · medido" : " · última medição"}
                </p>
                <p className="mt-1 font-mono text-13 font-medium text-profit tabular">+{formatInt(p.ganho)}</p>
              </div>
            );
          }}
        />
        <Area
          type="stepAfter"
          dataKey="ganho"
          stroke="var(--chart-2)"
          strokeWidth={1.5}
          fill="url(#geral-fill)"
          dot={(props: { cx?: number; cy?: number; payload?: PontoGeral; index?: number }) =>
            props.payload?.medido ? <circle key={props.index} cx={props.cx} cy={props.cy} r={2.5} fill="var(--chart-2)" /> : <g key={props.index} />
          }
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)", fill: "var(--chart-2)" }}
          isAnimationActive={!reduce}
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LucroChart({ serie }: { serie: PontoDiario[] }) {
  const reduce = useReducedMotion();
  const values = serie.map((p) => p.acumulado);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const pico = values.indexOf(Math.max(...values));
  const ticks = [serie[0].data, serie[serie.length - 1].data];

  return (
    <div
      className="absolute inset-0 -mx-2"
      role="img"
      aria-label={`Lucro acumulado: começa em ${formatBRL(values[0])} e termina em ${formatBRL(values.at(-1)!)}.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={serie} margin={{ top: 24, right: 30, bottom: 0, left: 10 }}>
          <defs>
            <linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--hero-line)", stopOpacity: 0.28 }} />
              <stop offset="100%" style={{ stopColor: "var(--hero-line)", stopOpacity: 0 }} />
            </linearGradient>
            <linearGradient id="hero-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" style={{ stopColor: "var(--hero-line)", stopOpacity: 0.35 }} />
              <stop offset="50%" style={{ stopColor: "oklch(0.85 0.12 300)", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "var(--hero-line)", stopOpacity: 0.55 }} />
            </linearGradient>
            <filter id="hero-glow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <YAxis hide domain={[min * 1.1, max * 1.15 || 1]} />
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
                textAnchor={t.index === 0 ? "start" : "end"}
                fill="var(--hero-fg-muted)"
                fontSize={11}
                fontFamily="var(--font-jetbrains)"
              >
                {shortDate(t.payload.value)}
              </text>
            )}
            tickMargin={8}
          />
          {min < 0 && <ReferenceLine y={0} stroke="var(--hero-fg-muted)" strokeOpacity={0.35} strokeDasharray="2 4" />}
          <Tooltip
            content={(p) => <HeroTooltip active={p.active} payload={p.payload} />}
            cursor={{ stroke: "var(--hero-fg-muted)", strokeOpacity: 0.35, strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="acumulado"
            stroke="url(#hero-stroke)"
            strokeWidth={2.5}
            fill="url(#hero-fill)"
            filter="url(#hero-glow)"
            dot={(d: { cx?: number; cy?: number; index?: number }) =>
              d.index === pico && d.cx != null && d.cy != null ? <PontoPico key="pico" cx={d.cx} cy={d.cy} /> : <g key={d.index} />
            }
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--hero-bg)", fill: "oklch(0.9 0.08 300)" }}
            isAnimationActive={!reduce}
            animationDuration={1100}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Ponto no pico: núcleo claro, halo e anel pulsando (como na referência). */
function PontoPico({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={16} className="hero-pulse" fill="oklch(0.75 0.2 295)" />
      <circle cx={cx} cy={cy} r={10} fill="oklch(0.7 0.22 295 / 0.35)" />
      <circle cx={cx} cy={cy} r={6} fill="oklch(0.93 0.06 300)" stroke="oklch(0.75 0.2 295)" strokeWidth={2} />
    </g>
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
