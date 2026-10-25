"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crosshair,
  ExternalLink,
  Globe,
  ImageOff,
  KeyRound,
  Loader2,
  MapPin,
  Phone,
  Search,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, fieldClass } from "@/components/ui/input";
import { Orb } from "@/components/ui/orb";
import { Stars } from "@/components/clientes/stars";
import { enviarAoFunil } from "@/app/actions";
import type { LeadGoogle } from "@/app/api/prospeccao/buscar/route";
import { ordenar, whatsappUrl } from "@/lib/prospeccao";
import { urlBuscaMaps, urlEmbedMaps } from "@/lib/maps-link";
import { formatInt, formatRating } from "@/lib/format";
import type { BuscaSalva } from "@/lib/data/leads";
import { cn } from "@/lib/utils";
import { Medidor, Motivos, PRIORIDADE, STATUS_FUNIL } from "./radar-ui";

type Modo = "cidade" | "perto";
type Ordem = "score" | "distancia" | "avaliacoes" | "nota";
type Filtro = "whatsapp" | "semSite" | "aberto" | "notaAlta";
type Uso = { buscas: number; fotos: number; limites: { buscas: number; fotos: number } };

const NICHOS = ["restaurante", "hamburgueria", "pizzaria", "barbearia", "salão de beleza", "clínica odontológica", "pet shop", "academia", "açaí", "estética"];
const FILTROS: [Filtro, string][] = [
  ["whatsapp", "WhatsApp"],
  ["semSite", "Sem site"],
  ["aberto", "Aberto agora"],
  ["notaAlta", "Nota 4,5+"],
];

const foto = (nome: string, w = 480) => `/api/google/foto-lugar?n=${encodeURIComponent(nome)}&w=${w}`;

/**
 * Prospecção: alvo à esquerda, estabelecimentos do Google com foto e tudo o que o Google sabe,
 * e o Google Maps de verdade à direita. Sem a chave, o mapa funciona e a lista mostra como ligar.
 */
export function Prospector({ buscas, temGoogle, uso }: { buscas: BuscaSalva[]; temGoogle: boolean; uso: Uso | null }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const segRef = React.useRef<HTMLInputElement>(null);
  const mapaBox = React.useRef<HTMLDivElement>(null);

  const [segmento, setSegmento] = React.useState("");
  const [local, setLocal] = React.useState("Limeira, SP");
  const [modo, setModo] = React.useState<Modo>("cidade");
  const [raioKm, setRaioKm] = React.useState(3);
  const [aba, setAba] = React.useState<"alvo" | "lista">("alvo");
  const [carregando, setCarregando] = React.useState(false);
  const [erro, setErro] = React.useState<string>();
  const [resultados, setResultados] = React.useState<LeadGoogle[] | null>(null);
  const [contexto, setContexto] = React.useState<{ segmento: string; onde: string } | null>(null);
  const [ordem, setOrdem] = React.useState<Ordem>("score");
  const [filtros, setFiltros] = React.useState<Set<Filtro>>(new Set());
  const [selecionado, setSelecionado] = React.useState<string | null>(null);

  // Mapa do Google (embed público, grátis): a busca toda, ou a ficha do estabelecimento escolhido.
  const [alvoMaps, setAlvoMaps] = React.useState<{ segmento: string; local: string; perto: { lat: number; lng: number } | null; raio: number } | null>(null);
  const [cores, setCores] = React.useState<"painel" | "original">("painel");
  const [carregandoMapa, setCarregandoMapa] = React.useState(true);
  const [montado, setMontado] = React.useState(false);
  React.useEffect(() => setMontado(true), []);
  React.useEffect(() => {
    if (!carregandoMapa) return;
    const t = setTimeout(() => setCarregandoMapa(false), 8000);
    return () => clearTimeout(t);
  }, [carregandoMapa]);

  const numeros = React.useMemo(() => new Map((resultados ?? []).map((l, i) => [l.placeId, i + 1])), [resultados]);
  const lista = React.useMemo(() => {
    let ls = resultados ?? [];
    if (filtros.has("whatsapp")) ls = ls.filter((l) => l.telefone && whatsappUrl(l.telefone));
    if (filtros.has("semSite")) ls = ls.filter((l) => !l.website);
    if (filtros.has("aberto")) ls = ls.filter((l) => l.abertoAgora);
    if (filtros.has("notaAlta")) ls = ls.filter((l) => (l.rating ?? 0) >= 4.5);
    if (ordem === "nota") return [...ls].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.totalAvaliacoes ?? 0) - (a.totalAvaliacoes ?? 0));
    return ordenar(ls, ordem) as LeadGoogle[];
  }, [resultados, filtros, ordem]);
  const atual = (resultados ?? []).find((l) => l.placeId === selecionado) ?? null;

  const embed = atual
    ? urlEmbedMaps({ lugar: [atual.nome, atual.endereco].filter(Boolean).join(", ") })
    : alvoMaps
      ? urlEmbedMaps({ segmento: alvoMaps.segmento, local: alvoMaps.local, perto: alvoMaps.perto, raioKm: alvoMaps.raio })
      : urlEmbedMaps({ local });
  const noApp = atual?.mapsUrl
    ? atual.mapsUrl
    : alvoMaps
      ? urlBuscaMaps({ segmento: alvoMaps.segmento, local: alvoMaps.local, perto: alvoMaps.perto ?? undefined })
      : urlBuscaMaps({ segmento: "", local });

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable) return;
      if (e.key === "/") {
        e.preventDefault();
        setAba("alvo");
        requestAnimationFrame(() => segRef.current?.focus());
      }
      if (e.key === "Escape") setSelecionado(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const localizar = () =>
    new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Seu navegador não informa a localização."));
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        (e) => reject(new Error(e.code === 1 ? "Permita o acesso à localização para buscar perto de você." : "Não deu para achar sua localização agora.")),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });

  const irParaMapa = () => {
    if (window.matchMedia("(max-width: 1023px)").matches)
      setTimeout(() => mapaBox.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 150);
  };

  const buscar = async (o?: { segmento?: string; local?: string; modo?: Modo; raioKm?: number | null }) => {
    const seg = (o?.segmento ?? segmento).trim();
    const m = o?.modo ?? modo;
    const loc = (o?.local ?? local).trim() || "Limeira, SP";
    const raio = o?.raioKm ?? raioKm;
    if (!seg) {
      setAba("alvo");
      setErro("Diga o que procurar, como “restaurante”.");
      return requestAnimationFrame(() => segRef.current?.focus());
    }
    setSegmento(seg);
    setErro(undefined);
    setCarregando(true);
    try {
      let centro: { lat: number; lng: number } | undefined;
      if (m === "perto") centro = await localizar();
      // O mapa do Google já mostra a busca enquanto a lista chega.
      setAlvoMaps({ segmento: seg, local: loc, perto: centro ?? null, raio });
      setSelecionado(null);
      setCarregandoMapa(true);
      setContexto({ segmento: seg, onde: m === "perto" ? `até ${raio} km de você` : loc });
      if (!temGoogle) {
        setAba("lista");
        irParaMapa();
        return;
      }
      const res = await fetch("/api/prospeccao/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmento: seg, local: loc, modo: m, centro, raioKm: raio }),
      });
      const body = (await res.json().catch(() => ({ ok: false }))) as { ok: boolean; error?: string; leads?: LeadGoogle[]; onde?: { nome: string } | null };
      if (!body.ok || !body.leads) throw new Error(body.error ?? "O Google não respondeu. Tente de novo.");
      setResultados(body.leads);
      setFiltros(new Set());
      setOrdem(m === "perto" ? "distancia" : "score");
      setContexto({ segmento: seg, onde: m === "perto" ? `até ${raio} km de você` : (body.onde?.nome ?? loc) });
      setAba("lista");
      irParaMapa();
      router.refresh(); // "Recentes" e o uso do mês
    } catch (e) {
      setErro(e instanceof Error ? e.message : "A busca falhou.");
    } finally {
      setCarregando(false);
    }
  };

  const selecionar = (id: string | null) => {
    setSelecionado(id);
    setCarregandoMapa(true);
  };

  const enviar = async (l: LeadGoogle) => {
    if (l.noFunil || l.jaCliente) return;
    const r = await enviarAoFunil([l], contexto?.segmento ?? "");
    if (!r.ok) return void toast.error(r.error);
    setResultados((rs) => rs?.map((x) => (x.placeId === l.placeId ? { ...x, noFunil: "novo" } : x)) ?? null);
    toast.success(`${l.nome} entrou no funil`, { description: `${l.score} pontos · ${PRIORIDADE[l.prioridade].label}` });
    router.refresh();
  };

  const navegar = (d: number) => {
    if (!lista.length) return;
    const i = Math.max(
      0,
      lista.findIndex((l) => l.placeId === selecionado),
    );
    selecionar(lista[(i + d + lista.length) % lista.length].placeId);
  };

  const total = resultados?.length ?? 0;

  return (
    <section
      aria-label="Prospecção"
      className="surface relative overflow-hidden p-0 lg:grid lg:h-[calc(100dvh-9.5rem)] lg:min-h-[680px] lg:grid-cols-[400px_minmax(0,1fr)]"
    >
      {/* ------------------------------ Painel ------------------------------ */}
      <aside className="flex min-h-0 flex-col border-b border-border bg-card/70 lg:border-r lg:border-b-0">
        <header className="relative overflow-hidden px-5 pt-5 pb-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,color-mix(in_oklch,var(--primary)_45%,transparent),transparent_70%)]"
          />
          <div aria-hidden className="hero-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative flex items-center gap-3">
            <Orb size={52} energia={carregando ? 1 : resultados ? 0.45 : 0.2} label={carregando ? "Buscando no Google" : "Prospecção"} />
            <div>
              <p className="font-mono text-11 tracking-[0.14em] text-primary uppercase">Ecloura / Google Maps</p>
              <h1 className="text-28 leading-none font-semibold tracking-[-0.03em]">Prospecção.</h1>
            </div>
          </div>
        </header>

        <LayoutGroup id="abas-prosp">
          <div role="tablist" aria-label="Painel" className="mx-5 flex gap-1 rounded-full bg-muted p-1">
            {(
              [
                ["alvo", "Alvo"],
                ["lista", resultados ? `Resultados · ${total}` : "Resultados"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                role="tab"
                type="button"
                aria-selected={aba === k}
                onClick={() => setAba(k)}
                className={cn(
                  "relative h-8 flex-1 rounded-full text-13 font-medium outline-hidden focus-visible:ring-2 focus-visible:ring-ring coarse:h-10",
                  aba === k ? "text-foreground" : "text-muted-foreground hover-fine:text-foreground",
                )}
              >
                {aba === k && (
                  <motion.span
                    layoutId="aba-prosp-pill"
                    className="absolute inset-0 rounded-full bg-card shadow-hairline"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative">{l}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>

        <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-4 lg:max-h-none lg:no-scrollbar", aba === "lista" && "max-h-[55vh]")}>
          {aba === "alvo" ? (
            <form
              className="grid gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                buscar();
              }}
            >
              <Etapa n="01" titulo="O que procurar">
                <div className="grid gap-2">
                  <div className="relative flex items-center">
                    <Search className="pointer-events-none absolute left-3 size-4 text-primary" strokeWidth={1.75} />
                    <input
                      ref={segRef}
                      value={segmento}
                      onChange={(e) => setSegmento(e.target.value)}
                      placeholder="Ex.: restaurante"
                      aria-label="Segmento"
                      enterKeyHint="search"
                      autoComplete="off"
                      className={cn(fieldClass, "h-11 pr-10 pl-9 text-16")}
                    />
                    {segmento && (
                      <button
                        type="button"
                        aria-label="Limpar"
                        onClick={() => {
                          setSegmento("");
                          segRef.current?.focus();
                        }}
                        className="absolute right-1.5 grid size-8 place-items-center rounded-full text-muted-foreground hover-fine:bg-muted"
                      >
                        <X className="size-4" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {NICHOS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSegmento(n)}
                        aria-pressed={segmento === n}
                        className={cn(
                          "h-7 rounded-full px-2.5 text-12 ring-1 transition-[color,background-color,transform] duration-150 ease-out-strong active:scale-[0.96] coarse:h-9",
                          segmento === n
                            ? "bg-primary text-primary-foreground ring-primary"
                            : "bg-card/60 text-subtle-foreground ring-border hover-fine:text-foreground",
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </Etapa>

              <Etapa n="02" titulo="Onde">
                <div role="radiogroup" aria-label="Onde" className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["cidade", Globe, "Cidade inteira"],
                      ["perto", Crosshair, "Perto de mim"],
                    ] as const
                  ).map(([k, Icone, t]) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={modo === k}
                      onClick={() => setModo(k)}
                      className={cn(
                        "flex items-center gap-2 rounded-card p-3 text-left text-13 font-medium ring-1 transition-[background-color,box-shadow,transform] duration-150 ease-out-strong active:scale-[0.98]",
                        modo === k ? "bg-accent/60 ring-primary/60" : "ring-border hover-fine:bg-muted/60",
                      )}
                    >
                      <Icone className={cn("size-4", modo === k ? "text-primary" : "text-muted-foreground")} strokeWidth={1.75} />
                      {t}
                    </button>
                  ))}
                </div>
                {modo === "cidade" ? (
                  <div className="relative flex items-center">
                    <MapPin className="pointer-events-none absolute left-3 size-4 text-primary" strokeWidth={1.75} />
                    <input
                      value={local}
                      onChange={(e) => setLocal(e.target.value)}
                      placeholder="Cidade ou bairro"
                      aria-label="Cidade ou bairro"
                      autoComplete="off"
                      className={cn(fieldClass, "h-11 pl-9 text-16")}
                    />
                  </div>
                ) : (
                  <label className="flex items-center justify-between gap-3 rounded-card px-3 py-2 text-12 text-subtle-foreground ring-1 ring-border">
                    Até quantos km de você
                    <Select value={raioKm} onChange={(e) => setRaioKm(Number(e.target.value))} aria-label="Raio" className="h-8 w-24 font-mono text-12">
                      {[1, 2, 3, 5, 10, 20].map((r) => (
                        <option key={r} value={r}>
                          {r} km
                        </option>
                      ))}
                    </Select>
                  </label>
                )}
              </Etapa>

              {buscas.length > 0 && (
                <Etapa n="03" titulo="Recentes">
                  <ul className="grid gap-1">
                    {buscas.slice(0, 5).map((b) => (
                      <li key={b.id}>
                        <button
                          type="button"
                          onClick={() => {
                            const m: Modo = b.modo === "perto" ? "perto" : "cidade";
                            setSegmento(b.segmento);
                            setModo(m);
                            if (m === "cidade") setLocal(b.local);
                            if (b.raioKm) setRaioKm(b.raioKm);
                            buscar({ segmento: b.segmento, local: b.local, modo: m, raioKm: b.raioKm });
                          }}
                          className="flex w-full items-center gap-2 rounded-control px-2 py-2 text-left transition-colors duration-150 hover-fine:bg-muted/70"
                        >
                          <Clock className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                          <span className="min-w-0 flex-1 truncate text-13">
                            <span className="font-medium capitalize">{b.segmento}</span> <span className="text-muted-foreground">· {b.local}</span>
                          </span>
                          {b.total > 0 && <span className="font-mono text-11 text-muted-foreground tabular">{b.total}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </Etapa>
              )}
            </form>
          ) : !temGoogle ? (
            <SemChave segmento={contexto?.segmento} />
          ) : !resultados ? (
            <p className="py-8 text-center text-13 text-muted-foreground">Escolha o que procurar e toque em “Buscar no Google”.</p>
          ) : (
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-12 text-muted-foreground">
                  <span className="font-medium text-foreground capitalize">{contexto?.segmento}</span> · {contexto?.onde}
                </p>
                <Select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="h-8 w-auto text-12" aria-label="Ordenar">
                  <option value="score">Melhores para a placa</option>
                  <option value="distancia">Mais perto</option>
                  <option value="avaliacoes">Menos avaliações</option>
                  <option value="nota">Melhor nota</option>
                </Select>
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtros">
                {FILTROS.map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={filtros.has(k)}
                    onClick={() =>
                      setFiltros((f) => {
                        const n = new Set(f);
                        if (n.has(k)) n.delete(k);
                        else n.add(k);
                        return n;
                      })
                    }
                    className={cn(
                      "h-7 rounded-full px-2.5 text-12 ring-1 transition-[color,background-color,transform] duration-150 ease-out-strong active:scale-[0.96] coarse:h-9",
                      filtros.has(k)
                        ? "bg-primary text-primary-foreground ring-primary"
                        : "bg-card/60 text-subtle-foreground ring-border hover-fine:text-foreground",
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <p className="text-11 text-muted-foreground">
                <span className="font-mono text-foreground tabular">{lista.length}</span> de {total} estabelecimentos
              </p>
              {lista.length === 0 ? (
                <div className="rounded-card bg-background/50 p-5 text-center ring-1 ring-border">
                  <p className="text-14 font-medium">Nenhum com esses filtros</p>
                  <button type="button" onClick={() => setFiltros(new Set())} className="mt-1 text-12 font-medium text-primary">
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <ol className="grid gap-2">
                  {lista.map((l) => (
                    <li key={l.placeId}>
                      <ItemLista l={l} numero={numeros.get(l.placeId)!} ativo={selecionado === l.placeId} onClick={() => selecionar(l.placeId)} />
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          {erro && (
            <p className="mb-3 text-12 text-destructive" role="alert">
              {erro}
            </p>
          )}
          <button
            type="button"
            onClick={() => buscar()}
            disabled={carregando}
            className="group relative flex h-12 w-full items-center gap-3 overflow-hidden rounded-card bg-primary px-4 text-14 font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_var(--primary)] transition-transform duration-150 ease-out-strong active:scale-[0.98] disabled:opacity-70"
          >
            {carregando ? (
              <Loader2 className="size-5 animate-spin motion-reduce:animate-none" strokeWidth={1.75} />
            ) : (
              <Search className="size-5" strokeWidth={1.75} />
            )}
            <span className="flex-1 text-left">{carregando ? "Buscando no Google…" : temGoogle ? "Buscar no Google" : "Ver no Google Maps"}</span>
            <ArrowRight className="size-5 transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5" strokeWidth={1.75} />
          </button>
          {uso && (
            <p className="mt-2 text-center text-11 text-muted-foreground">
              Cota grátis do mês: <span className="font-mono tabular">{uso.buscas}</span>/{uso.limites.buscas} buscas ·{" "}
              <span className="font-mono tabular">{uso.fotos}</span>/{uso.limites.fotos} fotos
            </p>
          )}
        </div>
      </aside>

      {/* ------------------------------- Mapa ------------------------------- */}
      <div ref={mapaBox} className="flex h-[72vh] min-h-[520px] scroll-mt-20 flex-col lg:h-full">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
          <span className="flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-12 font-medium">
            <span className={cn("size-1.5 rounded-full bg-primary", carregandoMapa && "animate-pulse motion-reduce:animate-none")} /> Google Maps
          </span>
          <p className="min-w-0 flex-1 truncate text-12 text-muted-foreground">
            {atual ? (
              <span className="text-foreground">{atual.nome}</span>
            ) : alvoMaps ? (
              <>
                <span className="font-medium text-foreground">{alvoMaps.segmento}</span> · {contexto?.onde}
              </>
            ) : (
              "Escolha o que procurar"
            )}
          </p>
          <div className="flex gap-1.5">
            {atual && (
              <button type="button" onClick={() => selecionar(null)} className={botaoBarra}>
                Ver todos
              </button>
            )}
            <button
              type="button"
              onClick={() => setCores((c) => (c === "painel" ? "original" : "painel"))}
              aria-pressed={cores === "original"}
              title={cores === "painel" ? "Cores originais do Google (melhor para fotos)" : "Cores do painel"}
              className={botaoBarra}
            >
              {cores === "painel" ? "Cores originais" : "Cores do painel"}
            </button>
            <a
              href={noApp}
              target="_blank"
              rel="noreferrer"
              className="flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-12 font-medium text-primary-foreground shadow-hairline transition-transform duration-150 active:scale-[0.96] coarse:h-10"
            >
              <ExternalLink className="size-3.5" strokeWidth={1.75} /> Abrir no app
            </a>
          </div>
        </div>

        <div className="relative isolate min-h-0 flex-1 bg-muted">
          {montado && (
            <iframe
              key={embed}
              src={embed}
              title={atual ? `Google Maps: ${atual.nome}` : alvoMaps ? `Google Maps: ${alvoMaps.segmento}` : "Google Maps"}
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setCarregandoMapa(false)}
              className={cn("absolute inset-0 size-full border-0", cores === "painel" && "mapa-roxo")}
            />
          )}
          {cores === "painel" && <div aria-hidden className="mapa-roxo-tinta pointer-events-none absolute inset-0" />}
          <AnimatePresence>
            {carregandoMapa && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-background/60 backdrop-blur-[2px]"
              >
                <div className="grid justify-items-center gap-3">
                  <Orb size={130} energia={1} />
                  <p className="text-14 text-subtle-foreground">Abrindo o Google Maps…</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {atual && (
              <Ficha
                key={atual.placeId}
                lead={atual}
                numero={numeros.get(atual.placeId)!}
                onFechar={() => selecionar(null)}
                onNavegar={lista.length > 1 ? navegar : undefined}
                onEnviar={enviar}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

const botaoBarra =
  "h-8 rounded-full px-3 text-12 font-medium ring-1 ring-border transition-[background-color,transform] duration-150 hover-fine:bg-muted active:scale-[0.96] coarse:h-10";

function Etapa({ n, titulo, children }: { n: string; titulo: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2.5">
      <p className="flex items-center gap-2 font-mono text-11 tracking-[0.14em] text-muted-foreground uppercase">
        <span className="text-primary">{n}</span> {titulo}
        <span className="h-px flex-1 bg-border" />
      </p>
      {children}
    </div>
  );
}

function Miniatura({ l, className }: { l: LeadGoogle; className?: string }) {
  const [erro, setErro] = React.useState(false);
  return (
    <span className={cn("relative block shrink-0 overflow-hidden bg-muted", className)}>
      {l.fotos[0] && !erro ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto(l.fotos[0], 240)} alt="" loading="lazy" decoding="async" onError={() => setErro(true)} className="size-full object-cover" />
      ) : (
        <span className="grid size-full place-items-center text-muted-foreground">
          <ImageOff className="size-4" strokeWidth={1.5} />
        </span>
      )}
    </span>
  );
}

function ItemLista({ l, numero, ativo, onClick }: { l: LeadGoogle; numero: number; ativo: boolean; onClick: () => void }) {
  const zap = l.telefone && whatsappUrl(l.telefone);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={ativo}
      className={cn(
        "flex w-full gap-3 rounded-card p-2 text-left ring-1 transition-[background-color,box-shadow] duration-150",
        ativo ? "bg-accent/60 ring-primary/60" : "ring-border hover-fine:bg-muted/60",
      )}
    >
      <span className="relative">
        <Miniatura l={l} className="size-16 rounded-control" />
        <span
          className={cn(
            "pin-chip absolute -top-1.5 -left-1.5 grid size-6 place-items-center rounded-full font-mono text-[10px] font-semibold text-white",
            `pin-${l.prioridade}`,
          )}
        >
          {String(numero).padStart(2, "0")}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="truncate text-13 font-semibold">{l.nome}</span>
          <span className="shrink-0 font-mono text-13 font-semibold tabular">{l.score}</span>
        </span>
        <span className="block truncate text-11 text-muted-foreground">
          {[l.categoria, l.distanciaKm != null ? `${l.distanciaKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km` : null]
            .filter(Boolean)
            .join(" · ")}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-11">
          {l.rating != null ? (
            <>
              <Stars value={l.rating} className="[&_svg]:size-3" />
              <span className="font-mono font-medium tabular">{formatRating(l.rating)}</span>
              <span className="text-muted-foreground">({formatInt(l.totalAvaliacoes ?? 0)})</span>
            </>
          ) : (
            <span className="text-muted-foreground">Sem avaliações</span>
          )}
        </span>
        <span className="mt-1 flex flex-wrap gap-1 text-[10px]">
          {l.abertoAgora != null && <Tag tom={l.abertoAgora ? "ok" : "off"}>{l.abertoAgora ? "Aberto" : "Fechado"}</Tag>}
          {zap && <Tag tom="ok">WhatsApp</Tag>}
          {!l.website && <Tag>Sem site</Tag>}
          {l.noFunil && <Tag tom="marca">{STATUS_FUNIL[l.noFunil]}</Tag>}
          {l.jaCliente && <Tag tom="ok">Cliente</Tag>}
        </span>
      </span>
    </button>
  );
}

function Tag({ tom, children }: { tom?: "ok" | "off" | "marca"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 font-medium",
        tom === "ok"
          ? "bg-profit-soft text-profit"
          : tom === "off"
            ? "bg-cost-soft text-cost"
            : tom === "marca"
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-subtle-foreground",
      )}
    >
      {children}
    </span>
  );
}

function SemChave({ segmento }: { segmento?: string }) {
  return (
    <div className="grid gap-3 rounded-card bg-background/50 p-4 ring-1 ring-border">
      <span className="grid size-10 place-items-center rounded-control bg-accent text-accent-foreground">
        <KeyRound className="size-5" strokeWidth={1.5} />
      </span>
      <p className="text-14 font-semibold">{segmento ? `Os resultados de “${segmento}” estão no mapa do Google.` : "O mapa é o Google Maps de verdade."}</p>
      <p className="text-12 text-muted-foreground">
        Toque num pino para ver foto, nota e avaliações. Para a lista aqui com{" "}
        <span className="text-foreground">foto, telefone, site e horário de cada um</span>, o painel precisa da chave do Google, que tem uma cota grátis por
        mês. O painel para sozinho antes de passar dela, então não gera cobrança.
      </p>
      <Link href="/configuracoes" className="text-12 font-medium text-primary">
        Como ligar a lista com fotos →
      </Link>
    </div>
  );
}

/** Ficha do estabelecimento sobre o mapa: fotos, tudo o que o Google sabe e as ações. */
function Ficha({
  lead: l,
  numero,
  onFechar,
  onNavegar,
  onEnviar,
}: {
  lead: LeadGoogle;
  numero: number;
  onFechar: () => void;
  onNavegar?: (d: number) => void;
  onEnviar: (l: LeadGoogle) => Promise<void>;
}) {
  const reduce = useReducedMotion();
  const [fotoAtual, setFotoAtual] = React.useState(0);
  const [porque, setPorque] = React.useState(false);
  const [horario, setHorario] = React.useState(false);
  const [enviando, setEnviando] = React.useState(false);
  const [fotoErro, setFotoErro] = React.useState<Set<number>>(new Set());
  const zap = l.telefone ? whatsappUrl(l.telefone, `Olá! Vi a ${l.nome} no Google e queria mostrar uma forma simples de conseguir mais avaliações.`) : null;
  const bloqueado = l.jaCliente || !!l.noFunil;
  const p = PRIORIDADE[l.prioridade];
  const fotos = l.fotos;

  return (
    <motion.article
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
      transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 380, damping: 32 }}
      aria-label={`Ficha de ${l.nome}`}
      className="glass-card absolute inset-x-3 bottom-3 z-20 max-h-[calc(100%-1.5rem)] overflow-y-auto sm:inset-x-auto sm:right-14 sm:w-[400px]"
    >
      {/* Fotos */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-t-[inherit] bg-muted">
        {fotos.length && !fotoErro.has(fotoAtual) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={fotos[fotoAtual]}
            src={foto(fotos[fotoAtual], 800)}
            alt={`Foto ${fotoAtual + 1} de ${l.nome}`}
            onError={() => setFotoErro((s) => new Set(s).add(fotoAtual))}
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <ImageOff className="size-6" strokeWidth={1.25} />
          </div>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
        <span
          className={cn(
            "pin-chip absolute top-3 left-3 grid size-9 place-items-center rounded-card font-mono text-13 font-semibold text-white",
            `pin-${l.prioridade}`,
          )}
        >
          {String(numero).padStart(2, "0")}
        </span>
        <div className="absolute top-2 right-2 flex gap-1">
          {onNavegar && (
            <>
              <BotaoRedondo rotulo="Anterior" onClick={() => onNavegar(-1)}>
                <ChevronLeft className="size-4" strokeWidth={1.75} />
              </BotaoRedondo>
              <BotaoRedondo rotulo="Próximo" onClick={() => onNavegar(1)}>
                <ChevronRight className="size-4" strokeWidth={1.75} />
              </BotaoRedondo>
            </>
          )}
          <BotaoRedondo rotulo="Fechar" onClick={onFechar}>
            <X className="size-4" strokeWidth={1.75} />
          </BotaoRedondo>
        </div>
        {fotos.length > 1 && (
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {fotos.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Foto ${i + 1}`}
                aria-pressed={i === fotoAtual}
                onClick={() => setFotoAtual(i)}
                className={cn("h-1.5 rounded-full transition-[width,background-color] duration-200", i === fotoAtual ? "w-5 bg-white" : "w-1.5 bg-white/50")}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 p-4 sm:p-5">
        <div>
          <p className="truncate font-mono text-[10px] tracking-[0.14em] text-primary uppercase">
            {l.categoria ?? "Estabelecimento"}
            {l.distanciaKm != null && ` · ${l.distanciaKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`}
            {l.preco ? ` · ${"$".repeat(l.preco)}` : ""}
          </p>
          <h3 className="mt-0.5 text-20 leading-tight font-semibold tracking-[-0.01em]">{l.nome}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-12">
            {l.rating != null ? (
              <span className="inline-flex items-center gap-1.5">
                <Stars value={l.rating} />
                <span className="font-mono font-medium tabular">{formatRating(l.rating)}</span>
                <span className="text-muted-foreground">({formatInt(l.totalAvaliacoes ?? 0)} avaliações)</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Sem avaliações no Google</span>
            )}
            {l.abertoAgora != null && <Tag tom={l.abertoAgora ? "ok" : "off"}>{l.abertoAgora ? "Aberto agora" : "Fechado agora"}</Tag>}
          </div>
        </div>

        <dl className="grid gap-1.5 text-12">
          {l.endereco && (
            <div className="flex gap-2">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={1.75} />
              <dd className="text-subtle-foreground">{l.endereco}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <Phone className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={1.75} />
            <dd className="font-mono text-subtle-foreground">{l.telefone ?? "Sem telefone no Google"}</dd>
          </div>
          <div className="flex min-w-0 gap-2">
            <Globe className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={1.75} />
            <dd className="min-w-0 truncate">
              {l.website ? (
                <a href={l.website} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover-fine:underline">
                  {l.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </a>
              ) : (
                <span className="text-subtle-foreground">Sem site: a ficha do Google é a vitrine</span>
              )}
            </dd>
          </div>
          {l.horario?.length ? (
            <div className="flex gap-2">
              <Clock className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={1.75} />
              <dd className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setHorario((v) => !v)}
                  aria-expanded={horario}
                  className="inline-flex items-center gap-1 text-subtle-foreground"
                >
                  Horário de funcionamento
                  <ChevronDown
                    className={cn("size-3.5 transition-transform duration-200 motion-reduce:transition-none", horario && "rotate-180")}
                    strokeWidth={1.5}
                  />
                </button>
                {horario && (
                  <ul className="mt-1 grid gap-0.5 text-11 text-muted-foreground">
                    {l.horario.map((h) => (
                      <li key={h} className="first-letter:uppercase">
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="flex items-center gap-3 rounded-card bg-background/50 p-3 ring-1 ring-border">
          <Medidor valor={l.score} tamanho={48} />
          <div className="min-w-0 flex-1">
            <span className={cn("inline-block rounded-full px-2 py-0.5 text-11 font-medium", p.cls)}>{p.label}</span>
            <p className="mt-0.5 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">Potencial para a placa</p>
          </div>
          <button
            type="button"
            onClick={() => setPorque((v) => !v)}
            aria-expanded={porque}
            className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-12 text-muted-foreground hover-fine:bg-muted hover-fine:text-foreground coarse:h-10"
          >
            Por quê
            <ChevronDown className={cn("size-3.5 transition-transform duration-200 motion-reduce:transition-none", porque && "rotate-180")} strokeWidth={1.5} />
          </button>
        </div>
        {porque && (
          <div className="rounded-card bg-muted/50 p-3">
            <Motivos motivos={l.motivos} score={l.score} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {zap && (
            <a
              href={zap}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center rounded-control bg-profit-soft px-3 text-13 font-medium text-profit transition-transform duration-150 active:scale-[0.96] coarse:h-11"
            >
              WhatsApp
            </a>
          )}
          {l.telefone && (
            <a
              href={`tel:${l.telefone.replace(/[^\d+]/g, "")}`}
              aria-label={`Ligar para ${l.nome}`}
              className="grid size-9 place-items-center rounded-control ring-1 ring-border transition-[transform,background-color] duration-150 hover-fine:bg-muted active:scale-[0.96] coarse:size-11"
            >
              <Phone className="size-4" strokeWidth={1.5} />
            </a>
          )}
          {l.mapsUrl && (
            <a
              href={l.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1 px-1 text-12 font-medium text-subtle-foreground hover-fine:text-foreground coarse:h-11"
            >
              Google Maps <ExternalLink className="size-3" strokeWidth={1.5} />
            </a>
          )}
          {bloqueado ? (
            <span className="ml-auto rounded-full bg-accent px-2.5 py-1 text-12 font-medium text-accent-foreground">
              {l.jaCliente ? "Já é cliente" : STATUS_FUNIL[l.noFunil!]}
            </span>
          ) : (
            <Button
              variant="primary"
              className="ml-auto"
              disabled={enviando}
              onClick={async () => {
                setEnviando(true);
                await onEnviar(l);
                setEnviando(false);
              }}
            >
              {enviando ? <Loader2 className="animate-spin motion-reduce:animate-none" strokeWidth={1.5} /> : <Send strokeWidth={1.5} />}
              Mandar para o funil
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function BotaoRedondo({ rotulo, onClick, children }: { rotulo: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      title={rotulo}
      className="grid size-8 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition-[background-color,transform] duration-150 hover-fine:bg-black/65 active:scale-[0.92] coarse:size-10"
    >
      {children}
    </button>
  );
}
