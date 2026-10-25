"use client";

import { useReducedMotion } from "motion/react";
import { Area, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Crescimento, Medicao } from "@/lib/crescimento";
import { shortDate, type ISODate } from "@/lib/dates";
import { formatInt, formatRating } from "@/lib/format";
import { edgeTick } from "@/components/ui/axis-tick";

const t = (d: ISODate) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const fromT = (n: number) => new Date(n).toISOString().slice(0, 10);

/**
 * Total de avaliações ao longo do tempo. Cada ponto é uma medição real;
 * o eixo X é tempo de verdade (medições espaçadas ficam espaçadas).
 * A faixa verde marca o período com placa; a linha tracejada, a base.
 */
export function CrescimentoChart({ c, height = 220 }: { c: Crescimento; height?: number }) {
  const reduce = useReducedMotion();
  const pontos = c.medicoes.map((m) => ({ ...m, x: t(m.data) }));
  if (pontos.length < 2) return null;

  const xs = pontos.map((p) => p.x);
  const instalacaoX = c.instalacao ? t(c.instalacao) : null;
  const minX = Math.min(...xs, instalacaoX ?? Infinity);
  const maxX = Math.max(...xs);
  const totais = pontos.map((p) => p.total).concat(c.base != null ? [c.base] : []);
  const lo = Math.min(...totais);
  const hi = Math.max(...totais);
  const pad = Math.max(2, Math.ceil((hi - lo) * 0.15));
  const ticks = [minX, ...(instalacaoX && instalacaoX > minX && instalacaoX < maxX ? [instalacaoX] : []), maxX].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div style={{ height }} className="-mx-1" role="img" aria-label={descricao(c)}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={pontos} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="cres-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--chart-2)", stopOpacity: 0.18 }} />
              <stop offset="100%" style={{ stopColor: "var(--chart-2)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="x"
            type="number"
            scale="time"
            domain={[minX, maxX]}
            ticks={ticks}
            axisLine={false}
            tickLine={false}
            tick={edgeTick(
              (v: number) => (v === instalacaoX ? "placa" : shortDate(fromT(v))),
              () => ticks.length,
            )}
            interval={0}
            tickMargin={8}
          />
          <YAxis
            orientation="right"
            domain={[lo - pad, hi + pad]}
            allowDecimals={false}
            tickCount={3}
            width={44}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
            tickFormatter={(v: number) => formatInt(Math.round(v))}
          />
          {instalacaoX && <ReferenceArea x1={Math.max(instalacaoX, minX)} x2={maxX} fill="var(--profit)" fillOpacity={0.06} ifOverflow="hidden" />}
          {instalacaoX && <ReferenceLine x={instalacaoX} stroke="var(--profit)" strokeOpacity={0.6} strokeDasharray="3 3" />}
          {c.base != null && <ReferenceLine y={c.base} stroke="var(--border-strong)" strokeDasharray="2 4" />}
          <Tooltip
            content={(p) => <Dica active={p.active} payload={p.payload} c={c} />}
            cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Area type="linear" dataKey="total" stroke="none" fill="url(#cres-fill)" isAnimationActive={!reduce} animationDuration={600} />
          <Line
            type="linear"
            dataKey="total"
            stroke="var(--chart-2)"
            strokeWidth={1.5}
            dot={{ r: 3, strokeWidth: 0, fill: "var(--chart-2)" }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)", fill: "var(--chart-2)" }}
            isAnimationActive={!reduce}
            animationDuration={600}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function Dica({ active, payload, c }: { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }>; c: Crescimento }) {
  const p = payload?.[0]?.payload as (Medicao & { x: number }) | undefined;
  if (!active || !p) return null;
  const desde = c.base != null && c.instalacao && p.data >= c.instalacao ? p.total - c.base : null;
  return (
    <div className="min-w-44 rounded-control bg-popover px-3 py-2.5 text-popover-foreground shadow-pop ring-1 ring-border">
      <p className="font-mono text-11 text-muted-foreground">
        {shortDate(p.data)} · {p.fonte === "google" ? "Google" : "anotado por você"}
      </p>
      <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-12">
        <dt className="text-muted-foreground">Avaliações</dt>
        <dd className="text-right font-mono font-medium tabular">{formatInt(p.total)}</dd>
        {p.rating != null && (
          <>
            <dt className="text-muted-foreground">Nota</dt>
            <dd className="text-right font-mono tabular">{formatRating(p.rating)}</dd>
          </>
        )}
        {desde != null && (
          <>
            <dt className="text-muted-foreground">Desde a placa</dt>
            <dd className="text-right font-mono text-profit tabular">+{formatInt(Math.max(0, desde))}</dd>
          </>
        )}
      </dl>
    </div>
  );
}

function descricao(c: Crescimento) {
  const a = c.medicoes[0];
  const b = c.medicoes.at(-1)!;
  return `Avaliações no Google: ${a.total} em ${shortDate(a.data)}, ${b.total} em ${shortDate(b.data)}${c.ganho != null ? `, ${c.ganho} a mais desde a placa` : ""}.`;
}
