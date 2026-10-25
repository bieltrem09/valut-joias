"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { categoriaHue } from "@/lib/categorias";
import { formatBRL, initials } from "@/lib/format";
import { relativeDays, type ISODate } from "@/lib/dates";
import { PersonAvatar, useImageFallback } from "@/components/ui/company-avatar";
import type { EmpresaCardData } from "@/lib/data/empresas";
import { Rating } from "./stars";
import { cn } from "@/lib/utils";

/**
 * Direção escolhida: "Capa editorial". A foto conta onde é o negócio,
 * o número de faturamento conta por que ele importa para você.
 * (A outra direção, "Ficha", está descrita no README.)
 */
export function CompanyCard({ empresa: e, today, index, onOpen }: { empresa: EmpresaCardData; today: ISODate; index: number; onOpen: () => void }) {
  const reduce = useReducedMotion();
  // Só os 8 primeiros entram em cascata; o resto aparece direto.
  const animate = index < 8;
  return (
    <motion.article
      initial={animate ? { opacity: 0, transform: "translateY(8px)" } : false}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: 0.32, delay: animate ? index * 0.04 : 0, ease: [0.23, 1, 0.32, 1], transform: reduce ? { duration: 0 } : undefined }}
      className="group/card relative"
    >
      <div
        className={cn(
          "surface relative flex h-full flex-col overflow-hidden",
          "transition-[transform,box-shadow] duration-300 ease-out-strong motion-reduce:transition-none",
          "[@media(hover:hover)_and_(pointer:fine)]:group-hover/card:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:shadow-pop",
          "group-has-[:focus-visible]/card:ring-2 group-has-[:focus-visible]/card:ring-ring",
        )}
      >
        <Cover empresa={e} />

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
            <Rating rating={e.rating} total={e.totalAvaliacoes} />
            <GanhoChip empresa={e} />
          </div>
          {e.crescimento.medicoes.length >= 2 && <MiniLinha empresa={e} />}

          <div className="border-t border-border pt-4">
            <p className="text-12 text-muted-foreground">Você faturou com eles</p>
            <p className="mt-1 flex items-baseline justify-between gap-3">
              <span className="font-mono text-20 font-medium tracking-[-0.02em] tabular">{formatBRL(e.faturamento)}</span>
              <span className="text-12 text-muted-foreground">
                <span className="font-mono tabular text-subtle-foreground">{e.placasCompradas}</span> {e.placasCompradas === 1 ? "placa" : "placas"}
              </span>
            </p>
          </div>

          {e.contatoNome && (
            <div className="flex items-center gap-2.5">
              <PersonAvatar nome={e.contatoNome} src={null} className="size-7" />
              <p className="min-w-0 truncate text-13">
                <span className="font-medium">{e.contatoNome}</span>
                {e.contatoCargo && <span className="text-muted-foreground"> · {e.contatoCargo}</span>}
              </p>
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-12 text-muted-foreground">
            <span>{e.ultimaCompra ? `Última compra ${relativeDays(e.ultimaCompra, today)}` : "Ainda sem compra"}</span>
            <span className="flex items-center gap-3">
              {e.mapsUrl && (
                <a
                  href={e.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="relative z-2 -my-2 inline-flex items-center gap-0.5 py-2 font-medium text-subtle-foreground underline-offset-4 outline-hidden hover-fine:text-foreground hover-fine:underline focus-visible:ring-2 focus-visible:ring-ring coarse:py-3"
                >
                  Ver no Maps
                  <ArrowUpRight className="size-3" strokeWidth={1.5} />
                </a>
              )}
              <span className="text-11">Dados: Google</span>
            </span>
          </div>
        </div>

        {/* Alvo do card inteiro; o link do Maps fica acima dele (z-2). */}
        <button type="button" onClick={onOpen} className="absolute inset-0 z-1 cursor-pointer rounded-card outline-hidden" aria-label={`Abrir ${e.nome}`} />
      </div>
    </motion.article>
  );
}

function Cover({ empresa: e }: { empresa: EmpresaCardData }) {
  const { ref, failed, onError } = useImageFallback(e.fotoUrl);
  const hasPhoto = !!e.fotoUrl && !failed;
  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
      {hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={e.fotoUrl!}
          alt={`Foto de ${e.nome}`}
          loading="lazy"
          decoding="async"
          onError={onError}
          className="absolute inset-0 size-full object-cover transition-transform duration-[400ms] ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/card:scale-100"
        />
      ) : (
        <div className="cat-swatch absolute inset-0 grid place-items-center" style={{ "--hue": categoriaHue(e.categoria) } as React.CSSProperties} aria-hidden>
          <span className="-mt-8 font-mono text-[44px] font-medium tracking-[-0.04em] opacity-60">{initials(e.nome)}</span>
        </div>
      )}
      {hasPhoto && (
        /* Escurece só a base: o texto fica legível sem apagar a foto. */
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/70 via-black/25 to-transparent" aria-hidden />
      )}
      <div
        className={cn("absolute inset-x-0 bottom-0 p-4", hasPhoto ? "text-white" : "cat-swatch-ink")}
        style={hasPhoto ? undefined : ({ "--hue": categoriaHue(e.categoria) } as React.CSSProperties)}
      >
        <h2 className={cn("truncate text-16 font-semibold tracking-[-0.01em]", hasPhoto && "[text-shadow:0_1px_2px_rgb(0_0_0/0.25)]")}>{e.nome}</h2>
        <p className={cn("mt-0.5 truncate text-12", hasPhoto ? "text-white/80" : "opacity-75")}>
          {e.categoria} · {e.cidade}
        </p>
      </div>
    </div>
  );
}

function GanhoChip({ empresa: e }: { empresa: EmpresaCardData }) {
  const c = e.crescimento;
  if (c.ganho != null && c.ganho > 0) {
    return (
      <span
        className="inline-flex items-center rounded-full bg-profit-soft px-2 py-0.5 text-12 font-medium text-profit"
        title={c.baseDepoisDaPlaca ? "Avaliações novas desde a primeira medição com a placa" : "Avaliações novas no Google desde que a placa foi ativada"}
      >
        <span className="font-mono tabular">+{c.ganho}</span>&nbsp;desde a placa
      </span>
    );
  }
  if (c.instalacao) return <span className="rounded-full bg-muted px-2 py-0.5 text-12 text-subtle-foreground">medindo</span>;
  return null;
}

/** Linha das medições reais; o trecho com placa fica na cor de lucro. */
function MiniLinha({ empresa: e }: { empresa: EmpresaCardData }) {
  const ms = e.crescimento.medicoes;
  const t = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
  const x0 = t(ms[0].data);
  const x1 = t(ms.at(-1)!.data) || x0 + 1;
  const lo = Math.min(...ms.map((m) => m.total));
  const hi = Math.max(...ms.map((m) => m.total));
  const w = 240;
  const h = 28;
  const px = (d: string) => ((t(d) - x0) / (x1 - x0 || 1)) * w;
  const py = (v: number) => h - 2 - ((v - lo) / (hi - lo || 1)) * (h - 4);
  const d = ms.map((m, i) => `${i ? "L" : "M"}${px(m.data).toFixed(1)} ${py(m.total).toFixed(1)}`).join(" ");
  const inst = e.crescimento.instalacao;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-7 w-full text-chart-2" aria-hidden>
      {inst && inst >= ms[0].data && (
        <line x1={px(inst)} x2={px(inst)} y1={0} y2={h} stroke="var(--border-strong)" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
      )}
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
