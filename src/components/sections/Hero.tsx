import Link from "next/link";
import { MapPin } from "lucide-react";
import { Wordmark } from "@/components/brand/Logo";
import { Media } from "@/components/ui/Media";
import { media } from "@/content/media";
import { zeroum } from "@/content/zeroum";
import { HeroClock } from "./HeroClock";

/**
 * 01 · HERO — momento de assinatura #1: logo gigante ATRÁS do atleta e NA FRENTE do fundo.
 * Camadas: [fundo] → [ZEROUM] → [recorte do atleta] → [gradiente] → [conteúdo].
 *
 * Intro em CSS puro (globals.css → "Hero intro"): começa no primeiro paint, roda fora da
 * main thread e não depende do JS (emil/animate: "CSS animations beat JS under load").
 * Texto do hero só usa transform (sem opacity 0) → não atrasa o LCP.
 * Parallax + pin no scroll: data-fx="hero-parallax" (ScrollFx, carregado no idle).
 */
export function Hero() {
  const athlete = media["hero-athlete-f"];

  return (
    <section aria-labelledby="hero-title" className="relative p-3" data-fx="hero-parallax">
      <div className="hero-frame relative isolate flex h-[92svh] max-h-[1080px] min-h-[640px] flex-col overflow-hidden rounded-[var(--radius-photo)] bg-carbon">
        {/* Camada 1 · fundo */}
        <div className="absolute inset-0 -z-30" data-fx-bg>
          <div className="hero-bg h-full w-full">
            <Media slot="hero-bg" priority keepRatio={false} rounded={false} hideLabel className="h-full w-full" sizes="100vw" />
          </div>
        </div>

        {/* Camada 2 · ZEROUM gigante */}
        <div className="hero-wordmark pointer-events-none absolute inset-x-[4%] top-[calc(var(--nav-h)+4.25rem)] -z-20 overflow-hidden md:top-[calc(var(--nav-h)+5rem)]" data-fx-mark>
          <Wordmark className="w-full text-white/90" />
        </div>

        {/* Camada 3 · recorte do atleta (por cima do logo) */}
        <div className="hero-athlete absolute bottom-0 right-[4%] -z-10 aspect-[4/5] h-[62%] md:right-[10%] md:h-[80%]">
          {athlete.src ? (
            <Media slot="hero-athlete-f" keepRatio={false} rounded={false} className="h-full w-full" imgClassName="!object-contain object-bottom" sizes="(min-width:768px) 40vw, 60vw" priority />
          ) : (
            <div className="relative h-full w-full rounded-t-[999px] border border-dashed border-white/25 bg-[radial-gradient(60%_50%_at_50%_30%,rgb(255_255_255/0.07),transparent)]" role="img" aria-label={athlete.alt + " (recorte em produção)"}>
              <span className="label absolute inset-x-0 top-[38%] hidden text-center text-white/50 md:block">
                <span className="text-red-bright">■</span> RECORTE · hero-athlete-f
              </span>
            </div>
          )}
        </div>

        {/* Camada 4 · gradiente para leitura */}
        <div className="absolute inset-0 -z-[5] bg-[linear-gradient(to_top,rgb(11_11_11/0.92)_0%,rgb(11_11_11/0.35)_45%,transparent_70%)]" aria-hidden="true" />

        {/* Chips superiores */}
        <div className="flex flex-wrap items-start justify-end gap-2 p-4 pt-[calc(var(--nav-h)+0.5rem)] md:p-6 md:pt-[calc(var(--nav-h)+1rem)]">
          <span className="hero-chip glass label inline-flex h-10 items-center gap-2 rounded-[var(--radius-chip)] px-3">
            <span className="pulse-dot" aria-hidden="true" />
            <HeroClock />
          </span>
          <span className="hero-chip glass label hidden h-10 items-center rounded-[var(--radius-chip)] px-3 sm:inline-flex">{zeroum.area}</span>
          <span className="hero-chip glass label hidden h-10 items-center gap-2 rounded-[var(--radius-chip)] px-3 sm:inline-flex">
            <span className="grid size-5 place-items-center rounded-[5px] bg-red" aria-hidden="true">
              <MapPin size={12} strokeWidth={2.5} />
            </span>
            Americana · SP
          </span>
        </div>

        {/* Conteúdo */}
        <div className="mt-auto grid gap-6 p-5 md:grid-cols-12 md:items-end md:p-10">
          <div className="md:col-span-9">
            <h1 id="hero-title" className="hero-title display text-hero leading-[1.1]">
              <span className="hero-line">
                <span>A academia</span>
              </span>
              <span className="hero-line">
                <span>que não fecha.</span>
              </span>
            </h1>
            <p className="hero-sub mt-5 max-w-[34rem] text-base text-white/85 md:text-lg">
              Musculação 24 horas em {zeroum.area}, com {zeroum.maquinas} máquinas, em Americana. Estrutura de verdade, acompanhamento de verdade.
            </p>
            <div className="hero-ctas mt-7 flex flex-wrap gap-3">
              <Link href="/aula-experimental" className="btn btn-red">
                Agendar aula experimental <span className="btn-arrow" aria-hidden="true">→</span>
              </Link>
              <Link href="/planos" className="btn btn-outline">
                Ver planos
              </Link>
            </div>
          </div>

          {/* Chip de dado com linha conectora (ref. Velocity) */}
          <div className="hidden items-center md:col-span-3 md:flex md:justify-end">
            <span className="hero-connector h-px w-16 bg-white/50" aria-hidden="true" />
            <span className="hero-connector size-2 rounded-full bg-red-bright" aria-hidden="true" />
            <p className="hero-chip glass ml-3 max-w-[15rem] rounded-[var(--radius-chip)] p-4">
              <span className="label block text-gray-300">Agregadores</span>
              <span className="mt-1 block font-semibold leading-snug">Aceita Wellhub Silver · TotalPass TP2</span>
            </p>
          </div>
          <p className="label text-white/80 md:hidden">Aceita Wellhub Silver · TotalPass TP2</p>
        </div>
      </div>
    </section>
  );
}
