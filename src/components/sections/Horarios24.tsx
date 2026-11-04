"use client";
import { useState } from "react";
import { dias, diasLongos, gradeProfessores, turnos, zeroum, type TurnoId } from "@/content/zeroum";
import { useNow } from "@/lib/useNow";
import { turnoDaHora } from "@/lib/time";
import { RollingNumber } from "@/components/ui/RollingNumber";
import { SectionLabel } from "@/components/ui/SectionHead";
import { Value } from "@/components/ui/Todo";

/* ---------- Mostrador 24h ---------- */
function Dial({ hour, minute }: { hour: number; minute: number }) {
  const R = 150;
  const C = 170;
  const angle = ((hour + minute / 60) / 24) * 360;
  const arc = (from: number, to: number, r: number) => {
    const a0 = ((from / 24) * 360 - 90) * (Math.PI / 180);
    const a1 = ((to / 24) * 360 - 90) * (Math.PI / 180);
    const large = to - from > 12 ? 1 : 0;
    return `M ${C + r * Math.cos(a0)} ${C + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${C + r * Math.cos(a1)} ${C + r * Math.sin(a1)}`;
  };
  const atual = turnoDaHora(hour);
  return (
    <svg viewBox="0 0 340 340" className="h-auto w-full max-w-[420px]" role="img" aria-label={`Mostrador de 24 horas. Agora são ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} em Americana, turno da ${turnos.find((t) => t.id === atual)?.nome.toLowerCase()}. A academia está aberta.`}>
      {turnos.map((t) => (
        <path
          key={t.id}
          d={arc(t.inicio + 0.08, t.fim - 0.08, R)}
          fill="none"
          stroke={t.id === atual ? "var(--color-red)" : "rgb(255 255 255 / 0.16)"}
          strokeWidth={t.id === atual ? 10 : 6}
          strokeLinecap="round"
        />
      ))}
      {Array.from({ length: 24 }, (_, h) => {
        const a = ((h / 24) * 360 - 90) * (Math.PI / 180);
        const major = h % 6 === 0;
        const r1 = R - 18;
        const r2 = R - (major ? 34 : 24);
        return (
          <g key={h}>
            <line x1={C + r1 * Math.cos(a)} y1={C + r1 * Math.sin(a)} x2={C + r2 * Math.cos(a)} y2={C + r2 * Math.sin(a)} stroke="rgb(255 255 255 / 0.5)" strokeWidth={major ? 2 : 1} />
            {major && (
              <text x={C + (R - 52) * Math.cos(a)} y={C + (R - 52) * Math.sin(a) + 4} textAnchor="middle" fill="var(--color-gray-300)" fontFamily="var(--font-mono)" fontSize="11">
                {String(h).padStart(2, "0")}
              </text>
            )}
          </g>
        );
      })}
      {/* Ponteiro — gira com transform rotate, 1x por minuto */}
      <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${C}px ${C}px`, transition: "transform 600ms var(--ease-in-out)" }} className="motion-reduce:!transition-none">
        <line x1={C} y1={C + 14} x2={C} y2={C - R + 6} stroke="var(--color-white)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={C} cy={C - R + 6} r="5" fill="var(--color-red)" />
      </g>
      <circle cx={C} cy={C} r="5" fill="var(--color-white)" />
    </svg>
  );
}

/* ---------- Grade ---------- */
function Cell({ dia, turno, atual }: { dia: (typeof dias)[number]; turno: TurnoId; atual: boolean }) {
  const prof = gradeProfessores[dia]?.[turno];
  return (
    <div className={`h-full rounded-[var(--radius-chip)] border p-3 ${atual ? "border-red bg-red/10" : "hairline bg-carbon"}`}>
      <p className="label text-white">Aberto</p>
      <p className={`mt-1 text-xs leading-snug ${prof ? "text-white/85" : "text-gray-300"}`}>{prof ?? "Professor: a confirmar"}</p>
      {atual && <p className="label mt-2 text-red-bright">Agora</p>}
    </div>
  );
}

export function Horarios24({ full = false, label = "04" }: { full?: boolean; label?: string }) {
  const now = useNow();
  const [dia, setDia] = useState<number | null>(null);
  const hoje = now?.dayIndex ?? 0;
  const ativo = dia ?? hoje;
  const turnoAtual = now ? turnoDaHora(now.hour) : null;

  return (
    <section aria-labelledby="horarios-title" className="relative z-10 bg-black py-24 md:py-32">
      <div className="container-site">
        <SectionLabel n={label}>Horários</SectionLabel>
        <div className="mt-4 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="min-w-0 lg:col-span-5">
            <h2 id="horarios-title" className="display text-section">
              24 horas.
              <br />
              <span className="text-red">Todo dia.</span>
            </h2>
            <p className="mt-6 max-w-md text-gray-300">
              Agora são{" "}
              <strong className="font-mono text-white">{now ? <RollingNumber value={now.hhmm} /> : "--:--"}</strong> em Americana.{" "}
              <span className="text-white">Tem gente treinando.</span>
            </p>
            <div className="mt-10">{now ? <Dial hour={now.hour} minute={now.minute} /> : <div className="aspect-square max-w-[420px] rounded-full border border-white/10" />}</div>
            <p className="mt-6 max-w-md text-sm text-gray-300">
              <Value v={zeroum.domingosFeriados} />
            </p>
          </div>

          <div className="min-w-0 lg:col-span-7">
            {/* Desktop: tabela */}
            <div className="hidden md:block">
              <table className="w-full table-fixed border-separate border-spacing-1.5">
                <caption className="label mb-4 text-left text-gray-300">Funcionamento e professor no salão por turno</caption>
                <thead>
                  <tr>
                    <th scope="col" className="w-24" />
                    {dias.map((d, i) => (
                      <th key={d} scope="col" className={`label pb-2 text-left ${i === hoje && now ? "text-red-bright" : "text-gray-300"}`}>
                        <abbr title={diasLongos[i]} className="no-underline">
                          {d}
                        </abbr>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {turnos.map((t) => (
                    <tr key={t.id}>
                      <th scope="row" className="pr-2 text-left align-top">
                        <span className="block text-sm font-semibold">{t.nome}</span>
                        <span className="label text-gray-300">
                          {String(t.inicio).padStart(2, "0")}–{String(t.fim).padStart(2, "0")}h
                        </span>
                      </th>
                      {dias.map((d, i) => (
                        <td key={d} className="h-24 align-top">
                          <Cell dia={d} turno={t.id} atual={!!now && i === hoje && t.id === turnoAtual} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: tabs por dia (nunca tabela com scroll lateral) */}
            <div className="md:hidden">
              <div role="tablist" aria-label="Dia da semana" className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] pb-2">
                {dias.map((d, i) => (
                  <button
                    key={d}
                    role="tab"
                    id={`tab-${d}`}
                    aria-selected={ativo === i}
                    aria-controls="painel-dia"
                    tabIndex={ativo === i ? 0 : -1}
                    onClick={() => setDia(i)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                        const n = (ativo + (e.key === "ArrowRight" ? 1 : 6)) % 7;
                        setDia(n);
                        document.getElementById(`tab-${dias[n]}`)?.focus();
                      }
                    }}
                    className={`btn shrink-0 !min-h-11 !px-4 ${ativo === i ? "btn-white" : "btn-outline"}`}
                  >
                    {d}
                    {i === hoje && now && (
                      <>
                        <span className="size-1.5 rounded-full bg-red-bright" aria-hidden="true" />
                        <span className="sr-only">(hoje)</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
              <div id="painel-dia" role="tabpanel" aria-labelledby={`tab-${dias[ativo]}`}>
              <ul key={ativo} className="mt-4 grid gap-2 animate-[fade_180ms_var(--ease-out)] motion-reduce:animate-none">
                {turnos.map((t) => (
                  <li key={t.id} className="grid grid-cols-[6.5rem_1fr] items-stretch gap-2">
                    <div className="py-3">
                      <p className="text-sm font-semibold">{t.nome}</p>
                      <p className="label text-gray-300">
                        {String(t.inicio).padStart(2, "0")}–{String(t.fim).padStart(2, "0")}h
                      </p>
                    </div>
                    <Cell dia={dias[ativo]} turno={t.id} atual={!!now && ativo === hoje && t.id === turnoAtual} />
                  </li>
                ))}
              </ul>
              </div>
            </div>

            {full && (
              <div className="hairline mt-10 grid gap-6 border-t pt-8 sm:grid-cols-2">
                <div>
                  <p className="label text-gray-300">Avaliação física</p>
                  <p className="mt-2">
                    <Value v={zeroum.avaliacaoFisica} />
                  </p>
                </div>
                <div>
                  <p className="label text-gray-300">Recepção</p>
                  <p className="mt-2">
                    <Value v={{ todo: "Horário de atendimento da recepção" }} />
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
