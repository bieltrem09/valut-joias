"use client";

import * as React from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { ChevronDown, Copy, Dumbbell, Lightbulb, Shuffle, Star, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { ETAPAS, EVITAR, MOMENTOS, REGRAS_DE_OURO, SEGMENTOS, falaPronta, montarFala, type Roteiro, type Tom, type Valores } from "@/lib/mentora";
import { formatRating } from "@/lib/format";
import { cn } from "@/lib/utils";

export type LeadMentora = { placeId: string; nome: string; segmento: string | null; rating: number | null; totalAvaliacoes: number | null };

const TOM: Record<Tom, { label: string; cls: string }> = {
  leve: { label: "Leve", cls: "bg-profit-soft text-profit" },
  curioso: { label: "Curioso", cls: "bg-accent text-accent-foreground" },
  direto: { label: "Direto", cls: "bg-pending-soft text-pending" },
};

const VAZIO: Valores = { estabelecimento: "", segmento: "", nota: "", avaliacoes: "", seuNome: "", cidade: "Limeira", vizinho: "" };

/** Lê/grava no navegador sem quebrar quando o armazenamento está bloqueado. */
const ler = <T,>(k: string, padrao: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : padrao;
  } catch {
    return padrao;
  }
};
const gravar = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

export function MentoraView({ leads }: { leads: LeadMentora[] }) {
  const reduce = useReducedMotion();
  const [valores, setValores] = React.useState<Valores>(VAZIO);
  const [etapa, setEtapa] = React.useState<string>(ETAPAS[0].id);
  const [favoritos, setFavoritos] = React.useState<string[]>([]);
  const [treino, setTreino] = React.useState<Roteiro[] | null>(null);

  // Seu nome, cidade e favoritos ficam neste aparelho.
  React.useEffect(() => {
    const salvo = ler<Partial<Valores>>("mentora-voce", {});
    setValores((v) => ({ ...v, seuNome: salvo.seuNome ?? "", cidade: salvo.cidade || "Limeira" }));
    setFavoritos(ler<string[]>("mentora-favoritos", []));
  }, []);

  const set = (k: keyof Valores, valor: string) =>
    setValores((v) => {
      const n = { ...v, [k]: valor };
      if (k === "seuNome" || k === "cidade") gravar("mentora-voce", { seuNome: n.seuNome, cidade: n.cidade });
      return n;
    });

  const usarLead = (placeId: string) => {
    const l = leads.find((x) => x.placeId === placeId);
    if (!l) return setValores((v) => ({ ...v, estabelecimento: "", segmento: "", nota: "", avaliacoes: "" }));
    const seg = (l.segmento ?? "").toLowerCase();
    setValores((v) => ({
      ...v,
      estabelecimento: l.nome,
      segmento: SEGMENTOS.includes(seg) ? seg : seg || v.segmento,
      nota: l.rating != null ? formatRating(l.rating) : "",
      avaliacoes: l.totalAvaliacoes != null ? String(l.totalAvaliacoes) : "",
    }));
  };

  const alternarFavorito = (id: string) =>
    setFavoritos((f) => {
      const n = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
      gravar("mentora-favoritos", n);
      return n;
    });

  const todos = ETAPAS.flatMap((e) => e.roteiros);
  const atual = etapa === "favoritos" ? null : ETAPAS.find((e) => e.id === etapa)!;
  const lista = atual ? atual.roteiros : todos.filter((r) => favoritos.includes(r.id));

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
        {/* Regras de ouro */}
        <section aria-labelledby="regras" className="grid grid-cols-[minmax(0,1fr)] gap-3">
          <h2 id="regras" className="flex items-center gap-2 text-16 font-semibold tracking-[-0.01em]">
            <Lightbulb className="size-4 text-primary" strokeWidth={1.75} /> Regras de ouro
          </h2>
          <ol className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-5">
            {REGRAS_DE_OURO.map((r, i) => (
              <li key={r.titulo} className="surface toque w-[72%] shrink-0 snap-start p-4 sm:w-auto">
                <p className="font-mono text-11 text-primary tabular">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-1 text-14 font-semibold">{r.titulo}</p>
                <p className="mt-1 text-12 leading-relaxed text-muted-foreground">{r.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Etapas */}
        <section aria-label="Roteiros" className="grid grid-cols-[minmax(0,1fr)] gap-4">
          <div className="sticky top-16 z-10 -mx-4 bg-background/80 px-4 py-2 backdrop-blur-md md:-mx-8 md:px-8 lg:mx-0 lg:rounded-full lg:px-0 lg:py-0 lg:backdrop-blur-none">
            <LayoutGroup id="etapas-mentora">
              <div role="tablist" aria-label="Etapas da venda" className="flex gap-1 overflow-x-auto rounded-full bg-muted p-1 no-scrollbar">
                {[
                  ...ETAPAS.map((e) => [e.id, e.titulo] as const),
                  ["favoritos", `★ Favoritos${favoritos.length ? ` · ${favoritos.length}` : ""}`] as const,
                ].map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={etapa === k}
                    onClick={() => setEtapa(k)}
                    className={cn(
                      "relative h-9 shrink-0 rounded-full px-4 text-13 font-medium whitespace-nowrap outline-hidden focus-visible:ring-2 focus-visible:ring-ring coarse:h-11",
                      etapa === k ? "text-foreground" : "text-muted-foreground hover-fine:text-foreground",
                    )}
                  >
                    {etapa === k && (
                      <motion.span
                        layoutId="etapa-pill"
                        className="absolute inset-0 rounded-full bg-card shadow-hairline"
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative">{l}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-13 text-muted-foreground">
              {atual ? atual.resumo : "Seus roteiros marcados com estrela, para revisar antes de sair de casa."}
            </p>
            {lista.length > 0 && (
              <Button variant="secondary" onClick={() => setTreino([...lista].sort(() => Math.random() - 0.5))}>
                <Dumbbell strokeWidth={1.5} /> Treinar {atual ? "esta etapa" : "favoritos"}
              </Button>
            )}
          </div>

          {lista.length === 0 ? (
            <div className="surface px-6 py-12 text-center">
              <p className="text-14 font-medium">Nenhum favorito ainda</p>
              <p className="mt-1 text-13 text-muted-foreground">Toque na estrela de um roteiro para guardar aqui.</p>
            </div>
          ) : (
            <ul className="grid gap-3">
              <AnimatePresence initial={false} mode="popLayout">
                {lista.map((r, i) => (
                  <motion.li
                    key={`${etapa}-${r.id}`}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 320, damping: 30, delay: Math.min(i, 6) * 0.03 }}
                  >
                    <CartaoRoteiro r={r} valores={valores} favorito={favoritos.includes(r.id)} onFavorito={() => alternarFavorito(r.id)} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </section>

        {/* Evite */}
        <section aria-labelledby="evite" className="surface p-5">
          <h2 id="evite" className="text-16 font-semibold tracking-[-0.01em]">
            Evite isto, faça assim
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {EVITAR.map((e) => (
              <li key={e.frase} className="grid gap-1 py-3 sm:grid-cols-2 sm:gap-6">
                <p className="flex gap-2 text-13 text-subtle-foreground">
                  <X className="mt-0.5 size-4 shrink-0 text-cost" strokeWidth={1.75} /> {e.frase}
                </p>
                <p className="text-13">
                  <span className="text-profit">→ </span>
                  {falaPronta(e.troque, { ...valores, vizinho: valores.vizinho || "loja vizinha" })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Personalizar */}
      <aside className="surface order-first grid gap-4 p-5 lg:sticky lg:top-24 lg:order-none">
        <div>
          <h2 className="text-16 font-semibold tracking-[-0.01em]">Para quem você vai falar?</h2>
          <p className="mt-1 text-12 text-muted-foreground">Os roteiros já aparecem com o nome, a nota e o momento certo de cada negócio.</p>
        </div>
        {leads.length > 0 && (
          <Field label="Puxar do funil" htmlFor="m-lead">
            <Select id="m-lead" defaultValue="" onChange={(e) => usarLead(e.target.value)}>
              <option value="">Escolha um lead…</option>
              {leads.map((l) => (
                <option key={l.placeId} value={l.placeId}>
                  {l.nome}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Nome do estabelecimento" htmlFor="m-est">
          <Input
            id="m-est"
            value={valores.estabelecimento}
            onChange={(e) => set("estabelecimento", e.target.value)}
            placeholder="Ex.: Cantina Bella"
            autoComplete="off"
          />
        </Field>
        <Field label="Tipo de negócio" htmlFor="m-seg">
          <Input
            id="m-seg"
            value={valores.segmento}
            onChange={(e) => set("segmento", e.target.value)}
            placeholder="Ex.: restaurante"
            list="m-segs"
            autoComplete="off"
          />
          <datalist id="m-segs">
            {SEGMENTOS.filter((s) => s !== "outro").map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nota no Google" htmlFor="m-nota">
            <Input id="m-nota" value={valores.nota} onChange={(e) => set("nota", e.target.value)} inputMode="decimal" placeholder="4,7" className="font-mono" />
          </Field>
          <Field label="Avaliações" htmlFor="m-av">
            <Input
              id="m-av"
              value={valores.avaliacoes}
              onChange={(e) => set("avaliacoes", e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="38"
              className="font-mono"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Seu nome" htmlFor="m-nome">
            <Input id="m-nome" value={valores.seuNome} onChange={(e) => set("seuNome", e.target.value)} placeholder="Ex.: Gabriel" autoComplete="given-name" />
          </Field>
          <Field label="Cidade" htmlFor="m-cid">
            <Input id="m-cid" value={valores.cidade} onChange={(e) => set("cidade", e.target.value)} placeholder="Limeira" />
          </Field>
        </div>
        <Field label="Cliente seu ali perto" htmlFor="m-viz" hint="Opcional, para a “prova do vizinho”.">
          <Input id="m-viz" value={valores.vizinho} onChange={(e) => set("vizinho", e.target.value)} placeholder="Ex.: Padaria Pão Nosso" autoComplete="off" />
        </Field>
        <div className="rounded-card bg-accent/50 p-3 text-12">
          <p className="font-medium text-accent-foreground">Melhor momento da placa</p>
          <p className="mt-0.5 text-subtle-foreground first-letter:uppercase">{MOMENTOS[valores.segmento.trim().toLowerCase()] ?? MOMENTOS.outro}.</p>
        </div>
      </aside>

      <Treino roteiros={treino} valores={valores} onFechar={() => setTreino(null)} />
    </div>
  );
}

function Fala({ r, valores, grande }: { r: Roteiro; valores: Valores; grande?: boolean }) {
  return (
    <blockquote className={cn("leading-relaxed text-foreground", grande ? "text-20 md:text-[22px]" : "text-16")}>
      “
      {montarFala(r.fala, valores).map((p, i) =>
        p.marcador ? (
          <span
            key={i}
            className={cn(p.preenchido ? "font-medium text-primary" : "rounded-[6px] bg-muted px-1 text-13 text-muted-foreground")}
            title={p.preenchido ? undefined : "Preencha ao lado para personalizar"}
          >
            {p.texto}
          </span>
        ) : (
          <React.Fragment key={i}>{p.texto}</React.Fragment>
        ),
      )}
      ”
    </blockquote>
  );
}

function ouvir(texto: string) {
  if (!("speechSynthesis" in window)) return toast("Seu navegador não lê em voz alta.");
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto.replace(/\[[^\]]+\]/g, ""));
  u.lang = "pt-BR";
  u.rate = 1;
  window.speechSynthesis.speak(u);
}

function CartaoRoteiro({ r, valores, favorito, onFavorito }: { r: Roteiro; valores: Valores; favorito: boolean; onFavorito: () => void }) {
  const [aberto, setAberto] = React.useState(false);
  const texto = falaPronta(r.fala, valores);
  const t = TOM[r.tom];
  return (
    <article className="surface toque grid gap-4 p-5">
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-16 font-semibold tracking-[-0.01em]">{r.titulo}</h3>
            <span className={cn("rounded-full px-2 py-0.5 text-11 font-medium", t.cls)}>{t.label}</span>
          </div>
          <p className="mt-0.5 text-12 text-muted-foreground">{r.quando}</p>
        </div>
        <button
          type="button"
          onClick={onFavorito}
          aria-pressed={favorito}
          aria-label={favorito ? "Tirar dos favoritos" : "Guardar nos favoritos"}
          className="grid size-9 shrink-0 place-items-center rounded-full transition-[background-color,transform] duration-150 hover-fine:bg-muted active:scale-[0.9] coarse:size-11"
        >
          <Star className={cn("size-[18px] transition-colors", favorito ? "fill-pending text-pending" : "text-muted-foreground")} strokeWidth={1.75} />
        </button>
      </header>

      <Fala r={r} valores={valores} />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(texto);
              toast.success("Fala copiada");
            } catch {
              toast.error("Não deu para copiar aqui.");
            }
          }}
        >
          <Copy strokeWidth={1.5} /> Copiar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => ouvir(texto)}>
          <Volume2 strokeWidth={1.5} /> Ouvir
        </Button>
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="ml-auto inline-flex h-8 items-center gap-1 rounded-full px-2 text-12 text-muted-foreground hover-fine:bg-muted hover-fine:text-foreground coarse:h-11"
        >
          Por que funciona
          <ChevronDown className={cn("size-3.5 transition-transform duration-200 motion-reduce:transition-none", aberto && "rotate-180")} strokeWidth={1.5} />
        </button>
      </div>
      {aberto && <p className="rounded-card bg-muted/60 p-3 text-13 leading-relaxed text-subtle-foreground">{r.porque}</p>}
    </article>
  );
}

/** Treino: um roteiro por vez, para falar em voz alta antes de sair. */
function Treino({ roteiros, valores, onFechar }: { roteiros: Roteiro[] | null; valores: Valores; onFechar: () => void }) {
  const [i, setI] = React.useState(0);
  const [mostrar, setMostrar] = React.useState(false);
  React.useEffect(() => {
    setI(0);
    setMostrar(false);
  }, [roteiros]);
  const r = roteiros?.[i];
  return (
    <Sheet
      open={!!roteiros}
      onOpenChange={(o) => !o && onFechar()}
      title="Treino"
      description="Leia em voz alta como se o dono estivesse na sua frente. Depois veja por que funciona."
      footer={
        roteiros && (
          <div className="flex w-full items-center justify-between gap-2">
            <span className="font-mono text-12 text-muted-foreground tabular">
              {i + 1} / {roteiros.length}
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setI(Math.floor(Math.random() * roteiros.length));
                  setMostrar(false);
                }}
              >
                <Shuffle strokeWidth={1.5} /> Sortear
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (i + 1 >= roteiros.length) return onFechar();
                  setI(i + 1);
                  setMostrar(false);
                }}
              >
                {i + 1 >= roteiros.length ? "Terminar" : "Próximo"}
              </Button>
            </div>
          </div>
        )
      }
    >
      {r && (
        <div className="grid gap-5">
          <div>
            <p className="eyebrow text-primary">{r.titulo}</p>
            <p className="mt-1 text-13 text-muted-foreground">{r.quando}</p>
          </div>
          <Fala r={r} valores={valores} grande />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => ouvir(falaPronta(r.fala, valores))}>
              <Volume2 strokeWidth={1.5} /> Ouvir
            </Button>
            {!mostrar && (
              <Button variant="ghost" onClick={() => setMostrar(true)}>
                <Lightbulb strokeWidth={1.5} /> Por que funciona
              </Button>
            )}
          </div>
          {mostrar && <p className="rounded-card bg-accent/50 p-4 text-14 leading-relaxed text-subtle-foreground">{r.porque}</p>}
        </div>
      )}
    </Sheet>
  );
}
