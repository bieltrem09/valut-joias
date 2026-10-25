"use client";

import { useReducedMotion } from "motion/react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GridGlow } from "@/components/ui/grid-glow";
import { CompanyAvatar } from "@/components/ui/company-avatar";
import type { EmpresaCardData } from "@/lib/data/empresas";
import { shortDate } from "@/lib/dates";
import { formatInt } from "@/lib/format";
import { edgeTick } from "@/components/ui/axis-tick";

type Ponto = { data: string; ganho: number; medido: boolean };

/**
 * Soma real do que as placas renderam no Google, dia a dia.
 * Degrau (stepAfter): o valor vale até a próxima medição — não há
 * interpolação inventada entre um dia medido e outro.
 */
export function CrescimentoGeral({ serie, empresas, googleEnabled }: { serie: Ponto[]; empresas: EmpresaCardData[]; googleEnabled: boolean }) {
  const reduce = useReducedMotion();
  const ranking = empresas
    .filter((e) => e.crescimento.ganho != null)
    .sort((a, b) => (b.crescimento.ganho ?? 0) - (a.crescimento.ganho ?? 0))
    .slice(0, 5);
  const total = serie.at(-1)?.ganho ?? 0;
  const medindo = empresas.filter((e) => e.crescimento.instalacao).length;

  if (serie.length === 0) {
    return (
      <section aria-labelledby="cres-geral" className="surface relative overflow-hidden p-6 md:p-8">
        <GridGlow className="opacity-70" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_1.4fr] md:items-center">
          <div>
            <h2 id="cres-geral" className="eyebrow text-primary">
              Avaliações ganhas com as placas
            </h2>
            <p className="mt-2 text-20 font-medium tracking-[-0.015em]">
              {medindo > 0 ? "A medição já começou." : "O gráfico nasce com a primeira placa de avaliação."}
            </p>
            <p className="mt-1 text-13 text-muted-foreground">
              {medindo > 0
                ? "Ele aparece assim que houver uma medição depois da placa instalada."
                : "Nada aqui é estimado: cada ponto é uma contagem real do Google."}
            </p>
          </div>
          <ol className="grid gap-3 text-13">
            {[
              ["Cadastre o cliente", googleEnabled ? "pela busca do Google, para o painel achar o perfil dele." : "e anote quantas avaliações ele tem hoje."],
              ["Registre a venda", "com uma placa “Avaliação Google” marcada como entregue."],
              [
                googleEnabled ? "O painel mede todo dia" : "Anote de tempos em tempos",
                googleEnabled ? "às 9h e desenha o crescimento desde a instalação." : "a contagem no perfil do cliente; cada anotação vira um ponto.",
              ],
            ].map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[24px_1fr] gap-3">
                <span className="grid size-6 place-items-center rounded-full bg-accent font-mono text-11 text-accent-foreground">{i + 1}</span>
                <p>
                  <span className="font-medium">{t}</span> <span className="text-muted-foreground">{d}</span>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="cres-geral" className="surface grid gap-6 p-6 md:p-8 lg:grid-cols-[1.6fr_1fr]">
      <div className="min-w-0">
        <h2 id="cres-geral" className="eyebrow text-primary">
          Avaliações ganhas com as placas
        </h2>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-[40px] font-medium leading-none tracking-[-0.03em] text-profit tabular">+{formatInt(total)}</span>
          <span className="text-13 text-muted-foreground">
            em {ranking.length} {ranking.length === 1 ? "cliente" : "clientes"}
          </span>
        </p>
        {serie.length > 1 ? (
          <div
            className="mt-5 h-44"
            role="img"
            aria-label={`De ${shortDate(serie[0].data)} a ${shortDate(serie.at(-1)!.data)}, ${total} avaliações a mais somando todos os clientes.`}
          >
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
                    const p = payload?.[0]?.payload as Ponto | undefined;
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
                  dot={(props: { cx?: number; cy?: number; payload?: Ponto; index?: number }) =>
                    props.payload?.medido ? <circle key={props.index} cx={props.cx} cy={props.cy} r={2.5} fill="var(--chart-2)" /> : <g key={props.index} />
                  }
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)", fill: "var(--chart-2)" }}
                  isAnimationActive={!reduce}
                  animationDuration={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-5 text-13 text-muted-foreground">A linha aparece a partir da segunda medição.</p>
        )}
        <p className="mt-2 text-12 text-muted-foreground">
          Cada ponto é uma contagem real do Google{googleEnabled ? ", feita todo dia às 9h" : " anotada por você"}. Entre medições, o valor se mantém.
        </p>
      </div>

      <div className="min-w-0 lg:border-l lg:border-border lg:pl-6">
        <h3 className="text-13 font-medium text-subtle-foreground">Quem mais cresceu</h3>
        <ol className="mt-3 grid gap-3">
          {ranking.map((e) => {
            const c = e.crescimento;
            const max = ranking[0].crescimento.ganho || 1;
            return (
              <li key={e.id} className="grid grid-cols-[28px_1fr_auto] items-center gap-x-3 gap-y-1">
                <CompanyAvatar nome={e.nome} categoria={e.categoria} src={e.fotoUrl} />
                <div className="min-w-0">
                  <p className="truncate text-13 font-medium">{e.nome}</p>
                  <p className="text-11 text-muted-foreground">
                    {c.ritmoDepois != null
                      ? `${c.ritmoDepois.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} por semana`
                      : `há ${c.diasDesde ?? 0} ${c.diasDesde === 1 ? "dia" : "dias"} com placa`}
                  </p>
                </div>
                <span className="font-mono text-13 font-medium text-profit tabular">+{formatInt(c.ganho ?? 0)}</span>
                <span />
                <span className="col-span-2 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <span className="block h-full rounded-full bg-profit" style={{ width: `${((c.ganho ?? 0) / max) * 100}%` }} />
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
