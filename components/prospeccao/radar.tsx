"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowRight,
  AtSign,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crosshair,
  ExternalLink,
  Globe,
  Loader2,
  LocateFixed,
  MapPin,
  Minus,
  Phone,
  Plus,
  Search,
  Send,
  Square,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, fieldClass } from "@/components/ui/input";
import { Orb } from "@/components/ui/orb";
import { enviarAoFunil } from "@/app/actions";
import { ordenar, qualificar, whatsappUrl, type Lead } from "@/lib/prospeccao";
import { formatInt, formatRating } from "@/lib/format";
import type { BuscaSalva } from "@/lib/data/leads";
import { cn } from "@/lib/utils";
import { Medidor, Motivos, PRIORIDADE, STATUS_FUNIL, lerNota } from "./radar-ui";
import type { Area, MapaHandle, Pin } from "./mapa";

const Mapa = dynamic(() => import("./mapa").then((m) => m.Mapa), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted motion-reduce:animate-none" />,
});

type Modo = "cidade" | "perto" | "area";
type Ordem = "score" | "distancia" | "avaliacoes";
type Resultado = Lead & { instagram?: string | null; horario?: string | null; jaCliente: boolean; noFunil: string | null };
type Onde = { nome: string; centro: { lat: number; lng: number }; limites: Area } | null;

// Centro de Limeira-SP: ponto de partida do mapa até a primeira busca.
const LIMEIRA = { lat: -22.5647, lng: -47.4017 };
const NICHOS = ["hamburgueria", "pizzaria", "barbearia", "salão de beleza", "clínica odontológica", "pet shop", "academia", "açaí", "estética", "cafeteria"];

/**
 * Radar de prospecção: alvo à esquerda, território no mapa com pinos numerados,
 * ficha da empresa por cima. Funciona com o Google (pago) ou com o mapa aberto (grátis).
 */
export function Radar({ buscas, fonte }: { buscas: BuscaSalva[]; fonte: "google" | "osm" }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const mapa = React.useRef<MapaHandle>(null);
  const segRef = React.useRef<HTMLInputElement>(null);
  const mapaBox = React.useRef<HTMLDivElement>(null);

  const [segmento, setSegmento] = React.useState("");
  const [local, setLocal] = React.useState("Limeira, SP");
  const [modo, setModo] = React.useState<Modo>("cidade");
  const [raioKm, setRaioKm] = React.useState(3);
  const [voce, setVoce] = React.useState<{ lat: number; lng: number } | null>(null);

  const [aba, setAba] = React.useState<"alvo" | "lista">("alvo");
  const [carregando, setCarregando] = React.useState(false);
  const [erro, setErro] = React.useState<string>();
  const [resultados, setResultados] = React.useState<Resultado[] | null>(null);
  const [onde, setOnde] = React.useState<Onde>(null);
  const [contexto, setContexto] = React.useState<{ segmento: string; onde: string; modo: Modo; raio: number } | null>(null);
  const [ordem, setOrdem] = React.useState<Ordem>("score");
  const [selecionado, setSelecionado] = React.useState<string | null>(null);
  const [enquadrar, setEnquadrar] = React.useState<{ key: string; bounds?: Area; centro?: { lat: number; lng: number }; zoom?: number } | null>(null);
  const [zoom, setZoom] = React.useState(13);

  // A numeração segue a pontuação (01 = melhor), não muda quando reordena a lista.
  const numeros = React.useMemo(() => new Map((resultados ?? []).map((l, i) => [l.placeId, i + 1])), [resultados]);
  const lista = React.useMemo(() => (resultados ? (ordenar(resultados, ordem) as Resultado[]) : []), [resultados, ordem]);
  const pins: Pin[] = React.useMemo(
    () =>
      (resultados ?? [])
        .filter((l) => l.lat != null && l.lng != null)
        .map((l) => ({ id: l.placeId, lat: l.lat!, lng: l.lng!, nome: l.nome, numero: numeros.get(l.placeId)!, prioridade: l.prioridade })),
    [resultados, numeros],
  );
  const atual = lista.find((l) => l.placeId === selecionado) ?? null;

  // "/" leva direto para o campo de busca.
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

  const buscar = async (o?: { segmento?: string; local?: string; modo?: Modo; raioKm?: number | null }) => {
    const seg = (o?.segmento ?? segmento).trim();
    const m = o?.modo ?? modo;
    const loc = (o?.local ?? local).trim();
    const raio = o?.raioKm ?? raioKm;
    if (!seg) {
      setAba("alvo");
      setErro("Diga o que procurar, como “hamburgueria”.");
      return requestAnimationFrame(() => segRef.current?.focus());
    }
    setSegmento(seg);
    setErro(undefined);
    setCarregando(true);
    try {
      let centro: { lat: number; lng: number } | undefined;
      let area: Area | undefined;
      if (m === "perto") {
        centro = await localizar();
        setVoce(centro);
      }
      if (m === "area") area = mapa.current?.area() ?? undefined;

      const res = await fetch("/api/prospeccao/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmento: seg, local: loc, modo: m, centro, raioKm: raio, area }),
      });
      const body = (await res.json()) as { ok: boolean; error?: string; leads?: Resultado[]; onde?: Onde };
      if (!body.ok || !body.leads) throw new Error(body.error ?? "A busca falhou.");

      setResultados(body.leads);
      setOnde(body.onde ?? null);
      setOrdem(m === "perto" ? "distancia" : "score");
      setContexto({ segmento: seg, onde: m === "cidade" ? (body.onde?.nome ?? loc) : m === "perto" ? "Perto de você" : "Área do mapa", modo: m, raio });
      setAba("lista");
      // Abre a ficha da melhor oportunidade.
      setSelecionado(body.leads[0]?.placeId ?? null);

      const comPos = body.leads.filter((l) => l.lat != null && l.lng != null);
      if (m === "perto" && centro) {
        const d = raio / 111;
        setEnquadrar({ key: `p${Date.now()}`, bounds: { south: centro.lat - d, north: centro.lat + d, west: centro.lng - d, east: centro.lng + d } });
      } else if (comPos.length) {
        setEnquadrar({
          key: `r${Date.now()}`,
          bounds: {
            south: Math.min(...comPos.map((l) => l.lat!)),
            north: Math.max(...comPos.map((l) => l.lat!)),
            west: Math.min(...comPos.map((l) => l.lng!)),
            east: Math.max(...comPos.map((l) => l.lng!)),
          },
        });
      } else if (body.onde) setEnquadrar({ key: `c${Date.now()}`, bounds: body.onde.limites });
      // No celular o mapa fica abaixo do painel: leva a pessoa até ele.
      if (window.matchMedia("(max-width: 1023px)").matches)
        // Espera a lista encolher (aba nova) para não passar do ponto.
        setTimeout(() => mapaBox.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 120);
      router.refresh(); // atualiza "Recentes"
    } catch (e) {
      setErro(e instanceof Error ? e.message : "A busca falhou.");
    } finally {
      setCarregando(false);
    }
  };

  const enviar = async (l: Resultado) => {
    if (l.noFunil || l.jaCliente) return;
    const r = await enviarAoFunil([l], contexto?.segmento ?? "");
    if (!r.ok) return void toast.error(r.error);
    setResultados((rs) => rs?.map((x) => (x.placeId === l.placeId ? { ...x, noFunil: "novo" } : x)) ?? null);
    toast.success(`${l.nome} entrou no funil`, { description: `${l.score} pontos · ${PRIORIDADE[l.prioridade].label}` });
    router.refresh();
  };

  const total = resultados?.length ?? 0;
  const fortes = resultados?.filter((l) => l.prioridade === "maxima" || l.prioridade === "alta").length ?? 0;
  const potencial = total ? Math.round((fortes / total) * 100) : null;

  const navegar = (d: number) => {
    if (!lista.length) return;
    const i = Math.max(
      0,
      lista.findIndex((l) => l.placeId === selecionado),
    );
    setSelecionado(lista[(i + d + lista.length) % lista.length].placeId);
  };

  return (
    <section
      aria-label="Radar de prospecção"
      className="surface relative overflow-hidden p-0 lg:grid lg:h-[calc(100dvh-9.5rem)] lg:min-h-[660px] lg:grid-cols-[380px_minmax(0,1fr)]"
    >
      {/* --------------------------- Painel do alvo --------------------------- */}
      <aside className="flex min-h-0 flex-col border-b border-border bg-card/70 lg:border-r lg:border-b-0">
        <header className="relative overflow-hidden px-5 pt-5 pb-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,color-mix(in_oklch,var(--primary)_45%,transparent),transparent_70%)]"
          />
          <div aria-hidden className="hero-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative flex items-center gap-3">
            <Orb size={52} energia={carregando ? 1 : resultados ? 0.45 : 0.2} label={carregando ? "Varrendo o território" : "Radar"} />
            <div>
              <p className="font-mono text-11 tracking-[0.14em] text-primary uppercase">Ecloura / Prospecção</p>
              <h1 className="text-28 leading-none font-semibold tracking-[-0.03em]">Radar.</h1>
            </div>
          </div>
        </header>

        <LayoutGroup id="abas-radar">
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
                disabled={k === "lista" && !resultados}
                onClick={() => setAba(k)}
                className={cn(
                  "relative h-8 flex-1 rounded-full text-13 font-medium outline-hidden transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 coarse:h-10",
                  aba === k ? "text-foreground" : "text-muted-foreground hover-fine:text-foreground",
                )}
              >
                {aba === k && (
                  <motion.span
                    layoutId="aba-pill"
                    className="absolute inset-0 rounded-full bg-card shadow-hairline"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative font-mono tabular">{l}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>

        <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-4 lg:max-h-none lg:no-scrollbar", aba === "lista" && "max-h-[40vh]")}>
          {aba === "alvo" ? (
            <form
              id="form-radar"
              className="grid gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                buscar();
              }}
            >
              <Etapa n="01" titulo="Defina o alvo">
                <div className="grid gap-4 rounded-card bg-background/50 p-4 ring-1 ring-border">
                  <div className="grid gap-2">
                    <label htmlFor="seg" className="text-12 font-medium text-subtle-foreground">
                      Segmento
                    </label>
                    <div className="relative flex items-center">
                      <Search className="pointer-events-none absolute left-3 size-4 text-primary" strokeWidth={1.75} />
                      <input
                        ref={segRef}
                        id="seg"
                        value={segmento}
                        onChange={(e) => setSegmento(e.target.value)}
                        placeholder="Ex.: hamburgueria"
                        enterKeyHint="search"
                        autoComplete="off"
                        className={cn(fieldClass, "h-11 pl-9 text-16")}
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
                      {NICHOS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSegmento(s)}
                          aria-pressed={segmento === s}
                          className={cn(
                            "h-7 rounded-full px-2.5 text-12 ring-1 transition-[color,background-color,transform] duration-150 ease-out-strong active:scale-[0.96] coarse:h-9",
                            segmento === s
                              ? "bg-primary text-primary-foreground ring-primary"
                              : "text-muted-foreground ring-border hover-fine:bg-accent hover-fine:text-accent-foreground",
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2 border-t border-border pt-4">
                    <label htmlFor="loc" className="text-12 font-medium text-subtle-foreground">
                      Localidade
                    </label>
                    <div className="relative flex items-center">
                      <MapPin className="pointer-events-none absolute left-3 size-4 text-primary" strokeWidth={1.75} />
                      <input
                        id="loc"
                        value={local}
                        onChange={(e) => setLocal(e.target.value)}
                        placeholder="Cidade ou bairro"
                        autoComplete="off"
                        disabled={modo !== "cidade"}
                        className={cn(fieldClass, "h-11 pl-9 text-16 disabled:opacity-50")}
                      />
                    </div>
                    <p className="text-11 text-muted-foreground">Cidade inteira (“Limeira, SP”) ou um bairro (“Centro, Limeira”).</p>
                  </div>
                </div>
              </Etapa>

              <Etapa n="02" titulo="Território">
                <div role="radiogroup" aria-label="Território" className="grid gap-2">
                  {(
                    [
                      ["cidade", Globe, "Toda a localidade", "Varre a cidade ou o bairro inteiro"],
                      ["perto", Crosshair, "Perto de mim", "Usa o GPS do aparelho"],
                      ["area", Square, "Área do mapa", "Só o que está na tela agora"],
                    ] as const
                  ).map(([k, Icone, t, d]) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={modo === k}
                      onClick={() => setModo(k)}
                      className={cn(
                        "flex items-center gap-3 rounded-card p-3 text-left ring-1 transition-[background-color,box-shadow,transform] duration-150 ease-out-strong active:scale-[0.99]",
                        modo === k ? "bg-accent/60 ring-primary/60" : "ring-border hover-fine:bg-muted/60",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-control",
                          modo === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icone className="size-4" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-13 font-medium">{t}</span>
                        <span className="block text-11 text-muted-foreground">{d}</span>
                      </span>
                    </button>
                  ))}
                  {modo === "perto" && (
                    <label className="flex items-center justify-between gap-3 rounded-card px-3 py-2 text-12 text-subtle-foreground ring-1 ring-border">
                      Raio a partir de você
                      <Select value={raioKm} onChange={(e) => setRaioKm(Number(e.target.value))} aria-label="Raio" className="h-8 w-24 font-mono text-12">
                        {[1, 2, 3, 5, 10, 20].map((r) => (
                          <option key={r} value={r}>
                            {r} km
                          </option>
                        ))}
                      </Select>
                    </label>
                  )}
                </div>
              </Etapa>

              {buscas.length > 0 && (
                <Etapa n="03" titulo="Recentes">
                  <ul className="grid gap-1">
                    {buscas.slice(0, 5).map((b) => (
                      <li key={b.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSegmento(b.segmento);
                            setModo(b.modo);
                            if (b.modo === "cidade") setLocal(b.local);
                            if (b.raioKm) setRaioKm(b.raioKm);
                            buscar({ segmento: b.segmento, local: b.local, modo: b.modo, raioKm: b.raioKm });
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
          ) : (
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-12 text-muted-foreground">
                  <span className="font-medium text-foreground capitalize">{contexto?.segmento}</span> · {contexto?.onde}
                </p>
                <Select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="h-8 w-auto text-12" aria-label="Ordenar">
                  <option value="score">Melhores</option>
                  <option value="distancia">Mais perto</option>
                  {fonte === "google" && <option value="avaliacoes">Menos avaliações</option>}
                </Select>
              </div>
              {lista.length === 0 ? (
                <div className="rounded-card bg-background/50 p-6 text-center ring-1 ring-border">
                  <p className="text-14 font-medium">Nenhuma empresa nesse território</p>
                  <p className="mt-1 text-12 text-muted-foreground">Tente outro nome para o nicho, aumente o raio ou anote à mão abaixo do mapa.</p>
                </div>
              ) : (
                <ol className="grid gap-1.5">
                  {lista.map((l) => (
                    <li key={l.placeId}>
                      <button
                        type="button"
                        onClick={() => setSelecionado(l.placeId)}
                        aria-current={selecionado === l.placeId}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-card p-2.5 text-left ring-1 transition-[background-color,box-shadow] duration-150",
                          selecionado === l.placeId ? "bg-accent/60 ring-primary/60" : "ring-transparent hover-fine:bg-muted/60",
                        )}
                      >
                        <span
                          className={cn(
                            "pin-chip grid size-8 shrink-0 place-items-center rounded-full font-mono text-11 font-semibold text-white",
                            `pin-${l.prioridade}`,
                          )}
                        >
                          {String(numeros.get(l.placeId)).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-13 font-medium">{l.nome}</span>
                          <span className="block truncate text-11 text-muted-foreground">
                            {[
                              l.categoria,
                              l.distanciaKm != null ? `${l.distanciaKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km` : null,
                              l.noFunil ? STATUS_FUNIL[l.noFunil] : null,
                              l.jaCliente ? "Cliente" : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                        <span className="font-mono text-14 font-semibold tabular">{l.score}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>

        {/* Ação principal, sempre à mão */}
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
            <span aria-hidden className="hero-sheen pointer-events-none absolute inset-0" />
            {carregando ? (
              <Loader2 className="size-5 animate-spin motion-reduce:animate-none" strokeWidth={1.75} />
            ) : (
              <Crosshair className="size-5" strokeWidth={1.75} />
            )}
            <span className="flex-1 text-left">{carregando ? "Varrendo o território…" : "Mapear oportunidades"}</span>
            <ArrowRight className="size-5 transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5" strokeWidth={1.75} />
          </button>
        </div>
      </aside>

      {/* ------------------------------- Mapa ------------------------------- */}
      <div ref={mapaBox} className="relative h-[68vh] min-h-[480px] scroll-mt-20 lg:h-full">
        <Mapa
          ref={mapa}
          centro={LIMEIRA}
          pins={pins}
          selecionado={selecionado}
          onSelecionar={setSelecionado}
          enquadrar={enquadrar}
          raio={contexto?.modo === "perto" && voce ? { ...voce, km: contexto.raio } : null}
          voce={voce}
          limites={contexto?.modo === "cidade" ? (onde?.limites ?? null) : null}
          onZoom={setZoom}
        />
        {/* Vinheta: o mapa "afunda" nas bordas, como uma tela de radar. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[400] shadow-[inset_0_0_120px_30px_color-mix(in_oklch,var(--background)_85%,transparent)]"
        />

        {/* Cobertura */}
        <div className="pointer-events-none absolute top-3 left-3 z-[500] max-w-[calc(100%-1.5rem)] sm:max-w-80">
          <div className="glass-card px-4 py-3">
            <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-primary uppercase">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" /> Cobertura territorial
            </p>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <p className="truncate text-20 font-semibold tracking-[-0.02em]">{contexto?.onde ?? "Limeira"}</p>
              <span className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] text-subtle-foreground uppercase ring-1 ring-border">
                {contexto?.modo === "perto" ? `${contexto.raio} km` : contexto?.modo === "area" ? "Área" : "Local"}
              </span>
            </div>
            <p className="mt-1 text-11 text-muted-foreground">
              {resultados ? (
                <>
                  <span className="font-mono text-foreground tabular">{total}</span> {total === 1 ? "empresa encontrada" : "empresas encontradas"}
                  {contexto && <> · {contexto.segmento}</>}
                </>
              ) : (
                "Defina o alvo e mapeie"
              )}
            </p>
          </div>
        </div>

        {/* Potencial */}
        {potencial != null && (
          <div className="pointer-events-none absolute top-3 right-3 z-[500] hidden sm:block">
            <div className="glass-card flex items-center gap-3 px-4 py-3">
              <Medidor valor={potencial} tamanho={48} rotulo="%" />
              <div>
                <p className="text-13 font-semibold">Potencial do território</p>
                <p className="text-11 text-muted-foreground">
                  {fortes} de {total} com alta oportunidade
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Zoom */}
        <div className="glass-card absolute top-[104px] right-3 z-[500] hidden flex-col items-center gap-1 p-1.5 sm:flex">
          <BotaoMapa rotulo="Aproximar" onClick={() => mapa.current?.zoom(1)}>
            <Plus className="size-4" strokeWidth={1.75} />
          </BotaoMapa>
          <div className="grid place-items-center py-1">
            <span className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase">Zoom</span>
            <span className="font-mono text-16 font-semibold tabular">{zoom}</span>
          </div>
          <BotaoMapa rotulo="Afastar" onClick={() => mapa.current?.zoom(-1)}>
            <Minus className="size-4" strokeWidth={1.75} />
          </BotaoMapa>
          <span className="my-1 h-px w-6 bg-border" />
          <BotaoMapa
            rotulo="Onde estou"
            onClick={async () => {
              try {
                const c = await localizar();
                setVoce(c);
                setEnquadrar({ key: `v${Date.now()}`, centro: c, zoom: 15 });
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            <LocateFixed className="size-4" strokeWidth={1.75} />
          </BotaoMapa>
        </div>

        {/* Carregando */}
        <AnimatePresence>
          {carregando && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 z-[600] grid place-items-center bg-background/55 backdrop-blur-[3px]"
            >
              <div className="grid justify-items-center gap-3">
                <Orb size={140} energia={1} />
                <p className="text-14 text-subtle-foreground">Varrendo o território…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ficha da empresa */}
        <AnimatePresence mode="wait">
          {atual && (
            <Ficha
              key={atual.placeId}
              lead={atual}
              numero={numeros.get(atual.placeId)!}
              fonte={fonte}
              onFechar={() => setSelecionado(null)}
              onNavegar={lista.length > 1 ? navegar : undefined}
              onEnviar={enviar}
            />
          )}
        </AnimatePresence>

        {/* Legenda + fonte */}
        {!atual && (
          <div className="glass-card absolute bottom-3 left-3 z-[500] hidden items-center gap-3 px-3 py-2 text-11 text-subtle-foreground sm:flex">
            {(["maxima", "alta", "media", "baixa"] as const).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={cn("pin-chip size-2.5 rounded-full", `pin-${k}`)} aria-hidden />
                {k === "maxima" ? "Máxima" : k === "alta" ? "Alta" : k === "media" ? "Média" : "Baixa"}
              </span>
            ))}
            <span className="h-3 w-px bg-border" />
            <span>{fonte === "google" ? "Dados: Google" : "Dados: OpenStreetMap"}</span>
          </div>
        )}
      </div>
    </section>
  );
}

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

function BotaoMapa({ rotulo, onClick, children }: { rotulo: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      title={rotulo}
      className="grid size-9 place-items-center rounded-full text-foreground transition-[background-color,transform] duration-150 ease-out-strong hover-fine:bg-muted active:scale-[0.92] coarse:size-11"
    >
      {children}
    </button>
  );
}

/** Ficha flutuante da empresa selecionada (canto do mapa; no celular, embaixo). */
function Ficha({
  lead: l,
  numero,
  fonte,
  onFechar,
  onNavegar,
  onEnviar,
}: {
  lead: Resultado;
  numero: number;
  fonte: "google" | "osm";
  onFechar: () => void;
  onNavegar?: (d: number) => void;
  onEnviar: (l: Resultado) => Promise<void>;
}) {
  const reduce = useReducedMotion();
  const [porque, setPorque] = React.useState(false);
  const [nota, setNota] = React.useState("");
  const [avaliacoes, setAvaliacoes] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const zap = l.telefone ? whatsappUrl(l.telefone, `Olá! Vi a ${l.nome} no Google e queria mostrar uma forma simples de conseguir mais avaliações.`) : null;
  const bloqueado = l.jaCliente || !!l.noFunil;

  // Conferiu no Google e anotou? A pontuação passa a ser a completa.
  const rating = lerNota(nota);
  const totalAv = avaliacoes.trim() === "" ? null : Math.trunc(Number(avaliacoes));
  const conferido = fonte === "osm" && totalAv != null && (totalAv === 0 || rating != null);
  const q = conferido ? qualificar({ ...l, rating, totalAvaliacoes: totalAv }) : { score: l.score, prioridade: l.prioridade, motivos: l.motivos };
  const p = PRIORIDADE[q.prioridade];

  return (
    <motion.article
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
      transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 380, damping: 32 }}
      aria-label={`Ficha de ${l.nome}`}
      className="glass-card absolute inset-x-3 bottom-3 z-[550] max-h-[calc(100%-6rem)] overflow-y-auto p-4 sm:inset-x-auto sm:right-3 sm:w-[400px] sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn("pin-chip grid size-10 shrink-0 place-items-center rounded-card font-mono text-13 font-semibold text-white", `pin-${q.prioridade}`)}
        >
          {String(numero).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[10px] tracking-[0.14em] text-primary uppercase">
            {l.categoria ?? "Empresa"}
            {l.distanciaKm != null && ` · ${l.distanciaKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`}
          </p>
          <h3 className="mt-0.5 text-16 leading-tight font-semibold tracking-[-0.01em] sm:text-20">{l.nome}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {onNavegar && (
            <>
              <BotaoMapa rotulo="Anterior" onClick={() => onNavegar(-1)}>
                <ChevronLeft className="size-4" strokeWidth={1.75} />
              </BotaoMapa>
              <BotaoMapa rotulo="Próxima" onClick={() => onNavegar(1)}>
                <ChevronRight className="size-4" strokeWidth={1.75} />
              </BotaoMapa>
            </>
          )}
          <BotaoMapa rotulo="Fechar" onClick={onFechar}>
            <X className="size-4" strokeWidth={1.75} />
          </BotaoMapa>
        </div>
      </div>

      {l.endereco && (
        <p className="mt-2 flex items-start gap-1.5 text-12 text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={1.75} />
          {l.endereco}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-11">
        {l.rating != null ? (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 ring-1 ring-border">
            <Star className="size-3 fill-current text-pending" strokeWidth={1.5} />
            <span className="font-mono font-medium tabular">{formatRating(l.rating)}</span>
            <span className="text-muted-foreground">({formatInt(l.totalAvaliacoes ?? 0)})</span>
          </span>
        ) : null}
        <Selo ok={!!l.telefone} icone={<Phone className="size-3" strokeWidth={1.75} />}>
          {zap ? "WhatsApp" : l.telefone ? "Telefone" : "Sem telefone"}
        </Selo>
        <Selo ok={!l.website} icone={<Globe className="size-3" strokeWidth={1.75} />}>
          {l.website ? "Tem site" : "Sem website"}
        </Selo>
        {l.instagram && (
          <a
            href={l.instagram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-accent-foreground"
          >
            <AtSign className="size-3" strokeWidth={1.75} /> Instagram
          </a>
        )}
        {l.jaCliente && <span className="rounded-full bg-profit-soft px-2 py-1 font-medium text-profit">Já é cliente</span>}
        {!l.jaCliente && l.noFunil && <span className="rounded-full bg-accent px-2 py-1 font-medium text-accent-foreground">{STATUS_FUNIL[l.noFunil]}</span>}
      </div>

      {/* Pontuação */}
      <div className="mt-4 flex items-center gap-3 rounded-card bg-background/50 p-3 ring-1 ring-border">
        <Medidor valor={q.score} tamanho={48} />
        <div className="min-w-0 flex-1">
          <span className={cn("inline-block rounded-full px-2 py-0.5 text-11 font-medium", p.cls)}>{p.label}</span>
          <p className="mt-0.5 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            {conferido ? "Qualificação completa" : "Qualificação"}
          </p>
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
        <div className="mt-2 rounded-card bg-muted/50 p-3">
          <Motivos motivos={q.motivos} score={q.score} />
        </div>
      )}

      {/* Mapa aberto: conferir nota no Google e anotar */}
      {fonte === "osm" && !bloqueado && (
        <div className="mt-3 grid gap-2 rounded-card border border-dashed border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-12 font-medium">Nota no Google</p>
            {l.mapsUrl && (
              <a href={l.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-12 font-medium text-primary">
                Conferir <ExternalLink className="size-3" strokeWidth={1.75} />
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              inputMode="decimal"
              placeholder="Nota (4,7)"
              aria-label="Nota no Google"
              className={cn(fieldClass, "h-9 font-mono text-13")}
            />
            <input
              value={avaliacoes}
              onChange={(e) => setAvaliacoes(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="Avaliações"
              aria-label="Número de avaliações"
              className={cn(fieldClass, "h-9 font-mono text-13")}
            />
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {zap && (
          <a
            href={zap}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-control bg-profit-soft px-3 text-13 font-medium text-profit transition-transform duration-150 active:scale-[0.96] coarse:h-11"
          >
            WhatsApp
          </a>
        )}
        {l.telefone && (
          <a
            href={`tel:${l.telefone.replace(/[^\d+]/g, "")}`}
            aria-label={`Ligar para ${l.nome}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-control px-3 font-mono text-12 ring-1 ring-border transition-[transform,background-color] duration-150 hover-fine:bg-muted active:scale-[0.96] coarse:h-11"
          >
            <Phone className="size-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">{l.telefone}</span>
          </a>
        )}
        {fonte === "google" && l.mapsUrl && (
          <a
            href={l.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1 px-1 text-12 font-medium text-subtle-foreground hover-fine:text-foreground coarse:h-11"
          >
            Maps <ExternalLink className="size-3" strokeWidth={1.5} />
          </a>
        )}
        {!bloqueado && (
          <Button
            variant="primary"
            className="ml-auto"
            disabled={enviando}
            onClick={async () => {
              setEnviando(true);
              await onEnviar(conferido ? { ...l, rating, totalAvaliacoes: totalAv, score: q.score, prioridade: q.prioridade, motivos: q.motivos } : l);
              setEnviando(false);
            }}
          >
            {enviando ? <Loader2 className="animate-spin motion-reduce:animate-none" strokeWidth={1.5} /> : <Send strokeWidth={1.5} />}
            Mandar para o funil
          </Button>
        )}
      </div>
    </motion.article>
  );
}

function Selo({ ok, icone, children }: { ok: boolean; icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 ring-1",
        ok ? "text-foreground ring-primary/40" : "text-muted-foreground ring-border",
      )}
    >
      {icone}
      {children}
    </span>
  );
}
