"use client";

import * as React from "react";
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
  ImageOff,
  Loader2,
  LocateFixed,
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
import { enviarAoFunil, registrarBusca } from "@/app/actions";
import { Qualificador } from "./qualificador";
import { buscarNoNavegador } from "@/lib/osm-cliente";
import { TODOS, ehTodos, juntarFontes, type LugarAberto } from "@/lib/osm";
import { GRUPOS_NICHOS, MAX_NICHOS_JUNTOS, NICHOS_DESTAQUE, TOTAL_NICHOS, alternarNicho, dividirNichos } from "@/lib/nichos";
import type { LeadGoogle } from "@/app/api/prospeccao/buscar/route";
import { distanciaKm, ordenar, qualificarAberto, whatsappUrl } from "@/lib/prospeccao";
import { urlBuscaMaps, urlEmbedMaps } from "@/lib/maps-link";
import { formatInt, formatRating } from "@/lib/format";
import type { BuscaSalva } from "@/lib/data/leads";
import { cn } from "@/lib/utils";
import { Medidor, Motivos, PRIORIDADE, STATUS_FUNIL } from "./radar-ui";

type Onde = { nome: string; centro: { lat: number; lng: number } } | null;

/** Lista do TomTom (pelo servidor). Erro não derruba a busca: volta { erro } e o mapa aberto assume. */
async function buscarTomTom(corpo: {
  segmento: string;
  local: string;
  modo: "cidade" | "perto";
  centro?: { lat: number; lng: number };
  raioKm: number;
}): Promise<{ lugares: LugarAberto[]; onde: Onde } | { erro: string }> {
  try {
    const res = await fetch("/api/prospeccao/tomtom", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
    const b = (await res.json().catch(() => null)) as { ok: boolean; error?: string; lugares?: LugarAberto[]; onde?: Onde } | null;
    if (!b?.ok || !b.lugares) return { erro: b?.error ?? "O TomTom não respondeu." };
    return { lugares: b.lugares, onde: b.onde ?? null };
  } catch {
    return { erro: "Sem conexão com o TomTom." };
  }
}

type Modo = "cidade" | "perto";
type Ordem = "score" | "distancia" | "avaliacoes" | "nota";
type Filtro = "whatsapp" | "semSite" | "aberto" | "notaAlta";
type Uso = { buscas: number; fotos: number; limites: { buscas: number; fotos: number } };

const FILTROS: [Filtro, string][] = [
  ["whatsapp", "WhatsApp"],
  ["semSite", "Sem site"],
  ["aberto", "Aberto agora"],
  ["notaAlta", "Nota 4,5+"],
];

/** Foto do Google passa pelo servidor (a chave fica lá); link direto (mapa aberto) vai como está. */
const foto = (f: string, w = 480) => (f.startsWith("places/") ? `/api/google/foto-lugar?n=${encodeURIComponent(f)}&w=${w}` : f);

/**
 * Prospecção: alvo à esquerda, estabelecimentos do Google com foto e tudo o que o Google sabe,
 * e o Google Maps de verdade à direita. Sem a chave, o mapa funciona e a lista mostra como ligar.
 */
export function Prospector({
  buscas,
  temGoogle,
  temTomTom,
  uso,
  funil,
}: {
  buscas: BuscaSalva[];
  temGoogle: boolean;
  /** Com a chave do TomTom, a lista vem de lá (bem mais completa) e o mapa aberto completa. */
  temTomTom: boolean;
  uso: Uso | null;
  /** placeId → etapa do funil, para marcar quem já está lá. */
  funil: Record<string, string>;
}) {
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
  /** Com vários nichos, o Google Maps mostra um por vez: este é o índice do que está no mapa. */
  const [nichoMapa, setNichoMapa] = React.useState(0);
  const nichosNoMapa = alvoMaps ? (ehTodos(alvoMaps.segmento) ? [alvoMaps.segmento] : dividirNichos(alvoMaps.segmento)) : [];
  const segMapa = nichosNoMapa[Math.min(nichoMapa, nichosNoMapa.length - 1)] ?? "";
  const escolhidos = dividirNichos(segmento);
  const [cores, setCores] = React.useState<"painel" | "original">("painel");
  const [carregandoMapa, setCarregandoMapa] = React.useState(true);
  const [montado, setMontado] = React.useState(false);
  /** A última lista veio do TomTom (ou só do mapa aberto)? */
  const [viaTomTom, setViaTomTom] = React.useState(false);
  React.useEffect(() => setMontado(true), []);
  React.useEffect(() => {
    if (!carregandoMapa) return;
    const t = setTimeout(() => setCarregandoMapa(false), 8000);
    return () => clearTimeout(t);
  }, [carregandoMapa]);

  const numeros = React.useMemo(() => new Map((resultados ?? []).map((l, i) => [l.placeId, i + 1])), [resultados]);
  /** Ramo escolhido no filtro (útil quando a busca traz todos os nichos). */
  const [ramo, setRamo] = React.useState("");
  /** Quantos itens a lista do painel mostra (o resto vem no "Ver mais"). */
  const [mostrar, setMostrar] = React.useState(80);
  const ramos = React.useMemo(() => {
    const cont = new Map<string, number>();
    for (const l of resultados ?? []) cont.set(l.categoria ?? "Outros", (cont.get(l.categoria ?? "Outros") ?? 0) + 1);
    return [...cont].sort((a, b) => b[1] - a[1]);
  }, [resultados]);
  const lista = React.useMemo(() => {
    let ls = resultados ?? [];
    if (ramo) ls = ls.filter((l) => (l.categoria ?? "Outros") === ramo);
    if (filtros.has("whatsapp")) ls = ls.filter((l) => l.telefone && whatsappUrl(l.telefone));
    if (filtros.has("semSite")) ls = ls.filter((l) => !l.website);
    if (filtros.has("aberto")) ls = ls.filter((l) => l.abertoAgora);
    if (filtros.has("notaAlta")) ls = ls.filter((l) => (l.rating ?? 0) >= 4.5);
    if (ordem === "nota") return [...ls].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.totalAvaliacoes ?? 0) - (a.totalAvaliacoes ?? 0));
    return ordenar(ls, ordem) as LeadGoogle[];
  }, [resultados, filtros, ordem, ramo]);
  React.useEffect(() => setMostrar(80), [resultados, filtros, ordem, ramo]);
  const atual = (resultados ?? []).find((l) => l.placeId === selecionado) ?? null;

  const embed = atual
    ? urlEmbedMaps({ lugar: [atual.nome, atual.endereco].filter(Boolean).join(", ") })
    : alvoMaps
      ? urlEmbedMaps({ segmento: segMapa, local: alvoMaps.local, perto: alvoMaps.perto, raioKm: alvoMaps.raio })
      : urlEmbedMaps({ local });
  const noApp = atual?.mapsUrl
    ? atual.mapsUrl
    : alvoMaps
      ? urlBuscaMaps({ segmento: segMapa, local: alvoMaps.local, perto: alvoMaps.perto ?? undefined })
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
    // Vários nichos juntos ("sorveteria, autopeças"): uma busca para cada, numa lista só.
    const nichos = ehTodos(seg) ? [seg] : dividirNichos(seg);
    setSegmento(seg);
    setErro(undefined);
    setCarregando(true);
    try {
      let centro: { lat: number; lng: number } | undefined;
      if (m === "perto") centro = await localizar();
      // O mapa do Google já mostra a busca enquanto a lista chega.
      // "Tudo perto de mim" no Google Maps vira uma busca ampla de comércio ao redor.
      setAlvoMaps({ segmento: ehTodos(seg) ? "comércio" : seg, local: loc, perto: centro ?? null, raio });
      setNichoMapa(0);
      setSelecionado(null);
      setCarregandoMapa(true);
      setContexto({ segmento: seg, onde: m === "perto" ? `até ${raio} km de você` : loc });
      // "Tudo perto de mim" vem do mapa aberto (+ TomTom): a busca do Google exige um ramo.
      if (!temGoogle || ehTodos(seg)) {
        // Sem a chave do Google: TomTom pelo servidor (quando há chave) + mapa aberto pelo navegador
        // (o servidor é bloqueado lá). O mapa aberto só completa: não segura a lista mais de 6 s.
        const umNicho = async (n: string): Promise<{ lugares: LugarAberto[]; onde: Onde; viaTT: boolean }> => {
          const aberto = buscarNoNavegador({ segmento: n, modo: m, local: loc, centro, raioKm: raio });
          const tt = temTomTom ? await buscarTomTom({ segmento: n, local: loc, modo: m, centro, raioKm: raio }) : null;
          if (tt && "lugares" in tt) {
            const extra = await Promise.race([aberto.catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), 6000))]);
            return { lugares: extra ? juntarFontes(tt.lugares, extra.lugares) : tt.lugares, onde: tt.onde ?? extra?.onde ?? null, viaTT: true };
          }
          if (tt) toast.message("TomTom fora do ar agora", { description: `${tt.erro} Usando só o mapa aberto.` });
          return { ...(await aberto), viaTT: false };
        };
        // Vários nichos: um de cada vez (o mapa aberto não gosta de buscas em paralelo) e junta tudo.
        let lugares: LugarAberto[] = [];
        let onde: Onde = null;
        let viaTT = false;
        for (const n of nichos) {
          const r = await umNicho(n).catch((e) => {
            if (nichos.length === 1) throw e;
            toast.message(`Não deu para buscar “${n}” agora`, { description: e instanceof Error ? e.message : undefined });
            return null;
          });
          if (!r) continue;
          lugares = juntarFontes(lugares, r.lugares);
          onde ??= r.onde;
          viaTT ||= r.viaTT;
        }
        setViaTomTom(viaTT);
        const ref = centro ?? onde?.centro ?? null;
        const leads: LeadGoogle[] = lugares
          .map((l) => ({
            ...l,
            ...qualificarAberto(l),
            mapsUrl: urlBuscaMaps({ segmento: l.nome, local: l.endereco ?? onde?.nome ?? loc }),
            distanciaKm: ref && l.lat != null && l.lng != null ? distanciaKm(ref, { lat: l.lat, lng: l.lng }) : null,
            fotos: l.fotoUrl ? [l.fotoUrl] : [],
            horario: l.horario ? [l.horario] : null,
            abertoAgora: null,
            preco: null,
            jaCliente: false,
            noFunil: funil[l.placeId] ?? null,
          }))
          .filter((l) => m !== "perto" || l.distanciaKm == null || l.distanciaKm <= raio);
        setResultados(ordenar(leads, m === "perto" ? "distancia" : "score") as LeadGoogle[]);
        setFiltros(new Set());
        setRamo("");
        setOrdem(m === "perto" ? "distancia" : "score");
        setContexto({ segmento: seg, onde: m === "perto" ? `até ${raio} km de você` : (onde?.nome ?? loc) });
        setAba("lista");
        irParaMapa();
        registrarBusca({
          segmento: seg,
          local: m === "perto" ? "Perto de você" : (onde?.nome ?? loc),
          modo: m,
          raioKm: m === "perto" ? raio : null,
          total: leads.length,
        }).catch(() => {});
        return;
      }
      const porId = new Map<string, LeadGoogle>();
      let ondeGoogle: { nome: string } | null = null;
      for (const n of nichos) {
        const res = await fetch("/api/prospeccao/buscar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segmento: n, local: loc, modo: m, centro, raioKm: raio }),
        });
        const body = (await res.json().catch(() => ({ ok: false }))) as { ok: boolean; error?: string; leads?: LeadGoogle[]; onde?: { nome: string } | null };
        if (!body.ok || !body.leads) {
          if (nichos.length === 1 || (porId.size === 0 && n === nichos.at(-1))) throw new Error(body.error ?? "O Google não respondeu. Tente de novo.");
          toast.message(`Não deu para buscar “${n}” agora`, { description: body.error });
          continue;
        }
        for (const l of body.leads) if (!porId.has(l.placeId)) porId.set(l.placeId, l);
        ondeGoogle ??= body.onde ?? null;
      }
      const leadsGoogle = [...porId.values()];
      setResultados(nichos.length > 1 ? (ordenar(leadsGoogle, m === "perto" ? "distancia" : "score") as LeadGoogle[]) : leadsGoogle);
      setFiltros(new Set());
      setRamo("");
      setOrdem(m === "perto" ? "distancia" : "score");
      setContexto({ segmento: seg, onde: m === "perto" ? `até ${raio} km de você` : (ondeGoogle?.nome ?? loc) });
      setAba("lista");
      irParaMapa();
      router.refresh(); // "Recentes" e o uso do mês
    } catch (e) {
      setErro(e instanceof Error ? e.message : "A busca falhou.");
    } finally {
      setCarregando(false);
    }
  };

  /** Toque no nicho: entra ou sai da busca (dá para juntar vários). */
  const escolherNicho = (n: string) => {
    const base = ehTodos(segmento) ? "" : segmento;
    if (!dividirNichos(base).includes(n) && dividirNichos(base).length >= MAX_NICHOS_JUNTOS)
      return void toast.message(`Até ${MAX_NICHOS_JUNTOS} nichos por busca`, { description: "Tire algum antes de pôr outro." });
    setSegmento(alternarNicho(base, n));
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

  const repetir = (b: BuscaSalva) => {
    const m: Modo = b.modo === "perto" ? "perto" : "cidade";
    setSegmento(b.segmento);
    setModo(m);
    if (m === "cidade") setLocal(b.local);
    if (b.raioKm) setRaioKm(b.raioKm);
    buscar({ segmento: b.segmento, local: b.local, modo: m, raioKm: b.raioKm });
  };

  /** Envio em lote (bancada do computador): só quem ainda não está no funil. */
  const enviarVarios = async (ls: LeadGoogle[]) => {
    const novos = ls.filter((l) => !l.noFunil && !l.jaCliente);
    if (!novos.length) return;
    const r = await enviarAoFunil(novos, contexto?.segmento ?? "");
    if (!r.ok) return void toast.error(r.error);
    const ids = new Set(novos.map((l) => l.placeId));
    setResultados((rs) => rs?.map((x) => (ids.has(x.placeId) ? { ...x, noFunil: "novo" } : x)) ?? null);
    toast.success(novos.length === 1 ? `${novos[0].nome} entrou no funil` : `${novos.length} leads entraram no funil`);
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
    <>
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
                <p className="font-mono text-11 tracking-[0.14em] text-primary uppercase">Basik7 / Google Maps</p>
                <h2 className="text-28 leading-none font-semibold tracking-[-0.03em]">Prospecção.</h2>
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
                        placeholder="Ex.: sorveteria, autopeças"
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
                    <p className="text-11 text-muted-foreground">
                      Os que mais compram a placa · <span className="text-subtle-foreground">toque em vários para buscar todos juntos</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {NICHOS_DESTAQUE.map((n) => (
                        <ChipNicho key={n} n={n} ativo={escolhidos.includes(n)} onClick={() => escolherNicho(n)} />
                      ))}
                    </div>
                    <details className="group/nichos rounded-card ring-1 ring-border open:bg-card/40">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-12 font-medium text-subtle-foreground hover-fine:text-foreground">
                        Mais nichos ({TOTAL_NICHOS})
                        <ChevronDown
                          className="size-4 transition-transform duration-200 group-open/nichos:rotate-180 motion-reduce:transition-none"
                          strokeWidth={1.5}
                        />
                      </summary>
                      <div className="grid gap-3 px-3 pt-1 pb-3">
                        {GRUPOS_NICHOS.map((g) => (
                          <div key={g.titulo} className="grid gap-1.5">
                            <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">{g.titulo}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {g.nichos.map((n) => (
                                <ChipNicho key={n} n={n} ativo={escolhidos.includes(n)} onClick={() => escolherNicho(n)} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
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

                <Etapa n="+" titulo="Todos os nichos de uma vez">
                  <div className="grid gap-3 rounded-card bg-accent/40 p-3 ring-1 ring-primary/30">
                    <div>
                      <p className="flex items-center gap-2 text-13 font-semibold">
                        <Globe className="size-4 text-primary" strokeWidth={1.75} /> A cidade inteira
                      </p>
                      <p className="mt-0.5 text-12 text-muted-foreground">
                        Todos os estabelecimentos de {local.trim() || "Limeira, SP"}, de qualquer ramo, sem limite de distância.
                      </p>
                      <button
                        type="button"
                        disabled={carregando}
                        onClick={() => {
                          setModo("cidade");
                          buscar({ segmento: TODOS, modo: "cidade", local: local.trim() || "Limeira, SP" });
                        }}
                        className={cn(
                          "mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-control text-13 font-semibold ring-1 transition-[background-color,transform] duration-150 active:scale-[0.98] disabled:opacity-60 coarse:h-11",
                          ehTodos(contexto?.segmento ?? "") && modo === "cidade"
                            ? "bg-primary text-primary-foreground ring-primary"
                            : "bg-card ring-border hover-fine:bg-muted",
                        )}
                      >
                        <Search className="size-4" strokeWidth={1.75} /> Buscar todos em {(local.trim() || "Limeira, SP").split(",")[0]}
                      </button>
                    </div>
                    <div className="border-t border-primary/20 pt-3">
                      <p className="flex items-center gap-2 text-13 font-semibold">
                        <LocateFixed className="size-4 text-primary" strokeWidth={1.75} /> Perto de mim
                      </p>
                      <p className="mt-0.5 text-12 text-muted-foreground">De qualquer ramo, a partir de onde você está agora. Escolha a distância:</p>
                      <div className="mt-2.5 grid grid-cols-4 gap-1.5" role="group" aria-label="Distância">
                        {[1, 2, 3, 5].map((km) => (
                          <button
                            key={km}
                            type="button"
                            disabled={carregando}
                            onClick={() => {
                              setModo("perto");
                              setRaioKm(km);
                              buscar({ segmento: TODOS, modo: "perto", raioKm: km });
                            }}
                            className={cn(
                              "h-10 rounded-control font-mono text-13 font-semibold ring-1 transition-[background-color,transform] duration-150 active:scale-[0.96] disabled:opacity-60 coarse:h-11",
                              ehTodos(contexto?.segmento ?? "") && modo === "perto" && raioKm === km
                                ? "bg-primary text-primary-foreground ring-primary"
                                : "bg-card ring-border hover-fine:bg-muted",
                            )}
                          >
                            {km} km
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Etapa>

                {buscas.length > 0 && (
                  <Etapa n="03" titulo="Recentes">
                    <ul className="grid gap-1">
                      {buscas.slice(0, 5).map((b) => (
                        <li key={b.id}>
                          <button
                            type="button"
                            onClick={() => repetir(b)}
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
            ) : !resultados ? (
              <p className="py-8 text-center text-13 text-muted-foreground">
                Escolha o que procurar e toque em “{temGoogle ? "Buscar no Google" : "Buscar estabelecimentos"}”.
              </p>
            ) : (
              <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-12 text-muted-foreground">
                    <span className="font-medium text-foreground capitalize">{contexto?.segmento}</span> · {contexto?.onde}
                  </p>
                  <Select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="h-8 w-auto text-12" aria-label="Ordenar">
                    <option value="score">Melhores para a placa</option>
                    <option value="distancia">Mais perto</option>
                    {temGoogle && <option value="avaliacoes">Menos avaliações</option>}
                    {temGoogle && <option value="nota">Melhor nota</option>}
                  </Select>
                </div>
                {ramos.length > 1 && (
                  <Select value={ramo} onChange={(e) => setRamo(e.target.value)} className="h-9 text-12" aria-label="Ramo">
                    <option value="">Todos os ramos ({resultados?.length ?? 0})</option>
                    {ramos.map(([r, n]) => (
                      <option key={r} value={r}>
                        {r} ({n})
                      </option>
                    ))}
                  </Select>
                )}
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtros">
                  {FILTROS.filter(([k]) => temGoogle || (k !== "aberto" && k !== "notaAlta")).map(([k, l]) => (
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
                  <span className="font-mono text-foreground tabular">{lista.length}</span> de {total} estabelecimentos ·{" "}
                  {temGoogle ? "dados do Google" : `${viaTomTom ? "TomTom + mapa aberto" : "mapa aberto"}; toque num deles para ver nota e fotos no Google`}
                </p>
                {lista.length === 0 ? (
                  <div className="rounded-card bg-background/50 p-5 text-center ring-1 ring-border">
                    <p className="text-14 font-medium">{total ? "Nenhum com esses filtros" : "Nenhum estabelecimento cadastrado nesse lugar"}</p>
                    {!total && (
                      <p className="mt-1 text-12 text-muted-foreground">
                        O mapa do Google ao lado mostra todos. Para os que faltarem aqui, use “Anote à mão”, abaixo.
                      </p>
                    )}
                    <button type="button" onClick={() => setFiltros(new Set())} className="mt-1 text-12 font-medium text-primary">
                      Limpar filtros
                    </button>
                  </div>
                ) : (
                  <ol className="grid gap-2">
                    {lista.slice(0, mostrar).map((l) => (
                      <li key={l.placeId}>
                        <ItemLista l={l} numero={numeros.get(l.placeId)!} ativo={selecionado === l.placeId} onClick={() => selecionar(l.placeId)} />
                      </li>
                    ))}
                  </ol>
                )}
                {lista.length > mostrar && (
                  <button
                    type="button"
                    onClick={() => setMostrar((m) => m + 80)}
                    className="h-10 rounded-card text-13 font-medium text-primary ring-1 ring-border hover-fine:bg-muted coarse:h-11"
                  >
                    Ver mais {Math.min(80, lista.length - mostrar)} de {lista.length - mostrar} restantes
                  </button>
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
              <span className="flex-1 text-left">
                {carregando
                  ? "Buscando estabelecimentos…"
                  : escolhidos.length > 1 && !ehTodos(segmento)
                    ? `Buscar os ${escolhidos.length} nichos juntos`
                    : temGoogle
                      ? "Buscar no Google"
                      : "Buscar estabelecimentos"}
              </span>
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
                  <span className="font-medium text-foreground">{segMapa}</span> · {contexto?.onde}
                </>
              ) : (
                "Escolha o que procurar"
              )}
            </p>
            {!atual && nichosNoMapa.length > 1 && (
              <div role="radiogroup" aria-label="Nicho no mapa" className="flex w-full flex-wrap gap-1.5 sm:order-last">
                {nichosNoMapa.map((n, i) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={n === segMapa}
                    onClick={() => {
                      setNichoMapa(i);
                      setCarregandoMapa(true);
                    }}
                    className={cn(
                      "h-7 rounded-full px-2.5 text-12 ring-1 transition-colors duration-150 coarse:h-9",
                      n === segMapa
                        ? "bg-primary text-primary-foreground ring-primary"
                        : "bg-card/60 text-subtle-foreground ring-border hover-fine:text-foreground",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
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
                title={atual ? `Google Maps: ${atual.nome}` : alvoMaps ? `Google Maps: ${segMapa}` : "Google Maps"}
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

      <Qualificador
        buscas={buscas}
        lista={resultados ? lista : null}
        numeros={numeros}
        contexto={contexto}
        carregando={carregando}
        onRepetir={repetir}
        onFocar={(id) => {
          selecionar(id);
          setAba("lista");
          // No celular o mapa fica abaixo do painel: rola direto para ele.
          const alvo = window.matchMedia("(min-width: 1024px)").matches ? mapaBox.current?.closest("section") : mapaBox.current;
          alvo?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        }}
        onEnviar={enviarVarios}
        onMelhoresPrimeiro={() => {
          setOrdem("score");
          setFiltros(new Set());
          setRamo("");
        }}
        onSoWhatsapp={() => setFiltros(new Set<Filtro>(["whatsapp"]))}
      />
    </>
  );
}

const botaoBarra =
  "h-8 rounded-full px-3 text-12 font-medium ring-1 ring-border transition-[background-color,transform] duration-150 hover-fine:bg-muted active:scale-[0.96] coarse:h-10";

function ChipNicho({ n, ativo, onClick }: { n: string; ativo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "h-7 rounded-full px-2.5 text-12 ring-1 transition-[color,background-color,transform] duration-150 ease-out-strong active:scale-[0.96] coarse:h-9",
        ativo ? "bg-primary text-primary-foreground ring-primary" : "bg-card/60 text-subtle-foreground ring-border hover-fine:text-foreground",
      )}
    >
      {n}
    </button>
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
            <span className="text-muted-foreground">{l.placeId.startsWith("osm:") ? "Nota: veja no Google" : "Sem avaliações"}</span>
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
          <div className="grid size-full place-items-center content-center gap-1 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklch,var(--primary)_30%,transparent),transparent_70%)] text-muted-foreground">
            <ImageOff className="size-6" strokeWidth={1.25} />
            <span className="text-11">Fotos na ficha do Google, no mapa</span>
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
              <span className="text-muted-foreground">Nota e avaliações: veja na ficha do Google, no mapa</span>
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
          {l.instagram && (
            <div className="flex min-w-0 gap-2">
              <AtSign className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={1.75} />
              <dd className="min-w-0 truncate">
                <a href={l.instagram} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover-fine:underline">
                  Instagram
                </a>
              </dd>
            </div>
          )}
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
