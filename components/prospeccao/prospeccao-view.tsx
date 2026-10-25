"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { LayoutGroup, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowUpRight, ChevronDown, Crosshair, Loader2, MapPin, Phone, Radar, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, fieldClass } from "@/components/ui/input";
import { GridGlow } from "@/components/ui/grid-glow";
import { Orb } from "@/components/ui/orb";
import { Stars } from "@/components/clientes/stars";
import { enviarAoFunil } from "@/app/actions";
import { ordenar, whatsappUrl, type Lead } from "@/lib/prospeccao";
import { formatInt, formatRating } from "@/lib/format";
import type { BuscaSalva } from "@/lib/data/leads";
import { relativeDays, todaySP } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Area, MapaHandle, Pin } from "./mapa";

const Mapa = dynamic(() => import("./mapa").then((m) => m.Mapa), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted motion-reduce:animate-none" />,
});

type Modo = "cidade" | "perto" | "area";
type Resultado = Lead & { jaCliente: boolean; noFunil: string | null };
type Ordem = "score" | "distancia" | "avaliacoes";

// Centro de Limeira-SP: ponto de partida do mapa até a primeira busca.
const LIMEIRA = { lat: -22.5647, lng: -47.4017 };

export const PRIORIDADE = {
  maxima: { label: "Prioridade máxima", cls: "bg-profit-soft text-profit" },
  alta: { label: "Alta oportunidade", cls: "bg-accent text-accent-foreground" },
  media: { label: "Média", cls: "bg-pending-soft text-pending" },
  baixa: { label: "Baixa", cls: "bg-muted text-muted-foreground" },
} as const;

const STATUS_FUNIL: Record<string, string> = { novo: "No funil", contatado: "Contatado", negociando: "Negociando", fechado: "Fechado", perdido: "Perdido" };

export function ProspeccaoView({ buscas }: { buscas: BuscaSalva[] }) {
  const router = useRouter();
  const mapa = React.useRef<MapaHandle>(null);
  const [segmento, setSegmento] = React.useState("");
  const [local, setLocal] = React.useState("Limeira, SP");
  const [modo, setModo] = React.useState<Modo>("cidade");
  const [raioKm, setRaioKm] = React.useState(5);
  const [soNaCidade, setSoNaCidade] = React.useState(true);
  const [voce, setVoce] = React.useState<{ lat: number; lng: number } | null>(null);

  const [carregando, setCarregando] = React.useState(false);
  const [erro, setErro] = React.useState<string>();
  const [resultados, setResultados] = React.useState<Resultado[] | null>(null);
  const [contexto, setContexto] = React.useState<{ segmento: string; onde: string } | null>(null);
  const [ordem, setOrdem] = React.useState<Ordem>("score");
  const [selecionado, setSelecionado] = React.useState<string | null>(null);
  const [marcados, setMarcados] = React.useState<Set<string>>(new Set());
  const [mostrar, setMostrar] = React.useState(12);
  const [enquadrar, setEnquadrar] = React.useState<{ key: string; bounds?: Area; centro?: { lat: number; lng: number }; zoom?: number } | null>(null);
  const [enviando, setEnviando] = React.useState(false);

  const lista = React.useMemo(() => (resultados ? ordenar(resultados, ordem) : []), [resultados, ordem]) as Resultado[];
  const pins: Pin[] = React.useMemo(
    () => lista.filter((l) => l.lat != null && l.lng != null).map((l) => ({ id: l.placeId, lat: l.lat!, lng: l.lng!, nome: l.nome, prioridade: l.prioridade })),
    [lista],
  );

  const localizar = () =>
    new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Seu navegador não informa a localização."));
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        (e) => reject(new Error(e.code === 1 ? "Permita o acesso à localização para buscar perto de você." : "Não deu para achar sua localização agora.")),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });

  const buscar = async (override?: { segmento: string; local: string; modo: Modo; raioKm?: number | null }) => {
    const seg = (override?.segmento ?? segmento).trim();
    const m = override?.modo ?? modo;
    const loc = override?.local ?? local;
    const raio = override?.raioKm ?? raioKm;
    if (!seg) return setErro("Diga o que procurar, como “hamburgueria”.");
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
        body: JSON.stringify({ segmento: seg, local: loc, modo: m, centro, raioKm: raio, area, soNaCidade }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: string;
        leads?: Resultado[];
        cidade?: { nome: string; viewport: { low: { latitude: number; longitude: number }; high: { latitude: number; longitude: number } } } | null;
      };
      if (!body.ok || !body.leads) throw new Error(body.error ?? "A busca falhou.");

      setResultados(body.leads);
      setMarcados(new Set());
      setSelecionado(null);
      setMostrar(12);
      setOrdem(m === "perto" ? "distancia" : "score");
      setContexto({ segmento: seg, onde: m === "cidade" ? (body.cidade?.nome ?? loc) : m === "perto" ? `até ${raio} km de você` : "área do mapa" });

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
      } else if (body.cidade) {
        const v = body.cidade.viewport;
        setEnquadrar({ key: `c${Date.now()}`, bounds: { south: v.low.latitude, west: v.low.longitude, north: v.high.latitude, east: v.high.longitude } });
      }
      router.refresh(); // atualiza o histórico de buscas
    } catch (e) {
      setErro(e instanceof Error ? e.message : "A busca falhou.");
    } finally {
      setCarregando(false);
    }
  };

  const enviar = async (ids: string[]) => {
    const sel = lista.filter((l) => ids.includes(l.placeId) && !l.noFunil && !l.jaCliente);
    if (!sel.length) return toast("Esses já estão no funil ou já são clientes.");
    setEnviando(true);
    const r = await enviarAoFunil(sel, contexto?.segmento ?? "");
    setEnviando(false);
    if (!r.ok) return void toast.error(r.error);
    setResultados((rs) => rs?.map((l) => (ids.includes(l.placeId) && !l.jaCliente ? { ...l, noFunil: l.noFunil ?? "novo" } : l)) ?? null);
    setMarcados(new Set());
    toast.success(r.data?.novos === 1 ? "1 lead no funil" : `${r.data?.novos} leads no funil`, {
      description: "Eles entram em “Novo”, ainda sem virar clientes.",
    });
    router.refresh();
  };

  const stats = resultados && {
    total: resultados.length,
    maxima: resultados.filter((l) => l.prioridade === "maxima").length,
    semSite: resultados.filter((l) => !l.website).length,
    celular: resultados.filter((l) => l.telefone && whatsappUrl(l.telefone)).length,
  };
  const potencial = stats && stats.total ? Math.round(resultados!.reduce((a, l) => a + l.score, 0) / stats.total) : null;
  const marcaveis = lista.filter((l) => !l.noFunil && !l.jaCliente);

  return (
    <div className="grid gap-5">
      {/* Busca */}
      <form
        className="surface relative grid gap-4 overflow-hidden p-4 md:grid-cols-[auto_1fr] md:gap-x-6 md:p-5"
        onSubmit={(e) => {
          e.preventDefault();
          buscar();
        }}
      >
        {/* Radar: a esfera fica calma esperando e se agita enquanto varre o Google. */}
        <div className="flex items-center gap-3 md:row-span-3 md:flex-col md:justify-center md:gap-1">
          <Orb size={112} energia={carregando ? 1 : 0.2} label={carregando ? "Varrendo o Google" : "Radar pronto"} />
          <p className="text-12 text-muted-foreground md:text-center" aria-live="polite">
            {carregando ? "Varrendo o Google…" : resultados ? `${resultados.length} encontrados` : "Radar pronto"}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_auto]">
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" strokeWidth={1.5} />
            <input
              value={segmento}
              onChange={(e) => setSegmento(e.target.value)}
              placeholder="O que procurar? Ex.: hamburgueria"
              aria-label="Segmento"
              className={cn(fieldClass, "pl-9")}
              list="segmentos"
            />
            <datalist id="segmentos">
              {[
                "hamburgueria",
                "pizzaria",
                "barbearia",
                "clínica odontológica",
                "pet shop",
                "salão de beleza",
                "academia",
                "cafeteria",
                "restaurante japonês",
                "estúdio de pilates",
              ].map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className="relative flex items-center">
            <MapPin className="pointer-events-none absolute left-3 size-4 text-muted-foreground" strokeWidth={1.5} />
            <input
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Cidade"
              aria-label="Cidade"
              disabled={modo !== "cidade"}
              className={cn(fieldClass, "pl-9 disabled:opacity-60")}
            />
          </label>
          <Button type="submit" variant="primary" disabled={carregando} className="md:min-w-48">
            {carregando ? <Loader2 className="animate-spin motion-reduce:animate-none" strokeWidth={1.5} /> : <Radar strokeWidth={1.5} />}
            {carregando ? "Mapeando…" : "Mapear oportunidades"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <LayoutGroup id="modo">
            <div role="radiogroup" aria-label="Onde buscar" className="flex gap-0.5 rounded-full bg-muted p-1">
              {(
                [
                  ["cidade", "Cidade inteira"],
                  ["perto", "Perto de mim"],
                  ["area", "Área do mapa"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={modo === k}
                  onClick={() => setModo(k)}
                  className={cn(
                    "relative h-8 rounded-full px-3 text-13 font-medium outline-hidden transition-[color,transform] duration-150 ease-out-strong active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring coarse:h-10",
                    modo === k ? "text-foreground" : "text-muted-foreground hover-fine:text-foreground",
                  )}
                >
                  {modo === k && (
                    <motion.span
                      layoutId="modo-pill"
                      className="absolute inset-0 rounded-full bg-card shadow-hairline"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative">{l}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
          {modo === "perto" && (
            <label className="flex items-center gap-2 text-13 text-subtle-foreground">
              Raio
              <Select value={raioKm} onChange={(e) => setRaioKm(Number(e.target.value))} className="h-9 w-24 font-mono text-13" aria-label="Raio em km">
                {[1, 2, 3, 5, 10, 20].map((r) => (
                  <option key={r} value={r}>
                    {r} km
                  </option>
                ))}
              </Select>
            </label>
          )}
          {modo === "cidade" && (
            <label className="flex cursor-pointer items-center gap-2 text-13 text-subtle-foreground">
              <input type="checkbox" checked={soNaCidade} onChange={(e) => setSoNaCidade(e.target.checked)} className="size-4 accent-[var(--primary)]" />
              Só endereços dentro da cidade
            </label>
          )}
          <p className="text-12 text-muted-foreground md:ml-auto">
            {modo === "cidade"
              ? "Varre a cidade inteira (até 60 empresas)."
              : modo === "perto"
                ? "Usa a localização do seu aparelho e ordena pelo mais perto."
                : "Mova e aproxime o mapa: a busca fica dentro do que está na tela."}
          </p>
        </div>
        {erro && (
          <p role="alert" className="text-13 text-destructive">
            {erro}
          </p>
        )}
      </form>

      {/* Mapa + lista */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="relative h-[340px] overflow-hidden rounded-card ring-1 ring-border md:h-[460px] lg:sticky lg:top-24 lg:col-span-7 lg:h-[calc(100dvh-8rem)] lg:max-h-[720px]">
          <Mapa
            ref={mapa}
            centro={LIMEIRA}
            pins={pins}
            selecionado={selecionado}
            onSelecionar={(id) => {
              setSelecionado(id);
              const idx = lista.findIndex((l) => l.placeId === id);
              if (idx >= mostrar) setMostrar(idx + 1);
              requestAnimationFrame(() => document.getElementById(`lead-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
            }}
            enquadrar={enquadrar}
            raio={modo === "perto" && voce ? { ...voce, km: raioKm } : null}
            voce={voce}
          />
          {stats && (
            <div className="pointer-events-none absolute left-3 top-3 z-[400] grid gap-0.5 rounded-control bg-card/95 px-3 py-2 shadow-pop ring-1 ring-border">
              <p className="eyebrow text-muted-foreground">{contexto?.onde}</p>
              <p className="text-13">
                <span className="font-mono font-medium tabular">{stats.total}</span> {stats.total === 1 ? "empresa encontrada" : "empresas encontradas"}
              </p>
              {potencial != null && (
                <p className="text-12 text-muted-foreground">
                  Potencial médio <span className="font-mono text-foreground tabular">{potencial}</span>/100
                </p>
              )}
            </div>
          )}
          <Legenda />
          {modo === "perto" && !voce && (
            <button
              type="button"
              onClick={async () => {
                try {
                  const c = await localizar();
                  setVoce(c);
                  setEnquadrar({ key: `v${Date.now()}`, centro: c, zoom: 14 });
                } catch (e) {
                  setErro((e as Error).message);
                }
              }}
              className="absolute right-3 top-3 z-[400] inline-flex h-9 items-center gap-1.5 rounded-control bg-card px-3 text-13 font-medium shadow-pop ring-1 ring-border transition-transform duration-150 active:scale-[0.96]"
            >
              <Crosshair className="size-4" strokeWidth={1.5} /> Onde estou
            </button>
          )}
        </div>

        <div className="grid content-start gap-4 lg:col-span-5">
          {!resultados ? (
            <Inicio
              buscas={buscas}
              onRepetir={(b) => {
                setSegmento(b.segmento);
                setModo(b.modo);
                if (b.modo === "cidade") setLocal(b.local);
                if (b.raioKm) setRaioKm(b.raioKm);
                buscar({ segmento: b.segmento, local: b.local, modo: b.modo, raioKm: b.raioKm });
              }}
            />
          ) : (
            <>
              <dl className="grid grid-cols-4 divide-x divide-border rounded-card bg-card ring-1 ring-border">
                {[
                  ["Mapeadas", stats!.total],
                  ["Máxima", stats!.maxima],
                  ["Sem site", stats!.semSite],
                  ["Celular", stats!.celular],
                ].map(([k, v]) => (
                  <div key={k} className="px-3 py-3">
                    <dt className="text-11 text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 font-mono text-20 font-medium tabular">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="h-9 w-auto text-13" aria-label="Ordenar">
                  <option value="score">Melhores primeiro</option>
                  <option value="distancia">Mais perto primeiro</option>
                  <option value="avaliacoes">Menos avaliações primeiro</option>
                </Select>
                <div className="flex items-center gap-2">
                  {marcaveis.length > 0 && (
                    <button
                      type="button"
                      className="text-13 font-medium text-primary underline-offset-4 hover-fine:underline"
                      onClick={() => setMarcados(marcados.size === marcaveis.length ? new Set() : new Set(marcaveis.map((l) => l.placeId)))}
                    >
                      {marcados.size === marcaveis.length ? "Desmarcar" : "Marcar todos"}
                    </button>
                  )}
                  <Button size="sm" variant="primary" disabled={!marcados.size || enviando} onClick={() => enviar([...marcados])}>
                    <Send strokeWidth={1.5} /> Enviar {marcados.size || ""} ao funil
                  </Button>
                </div>
              </div>

              {lista.length === 0 ? (
                <div className="surface relative overflow-hidden px-6 py-12 text-center">
                  <GridGlow />
                  <p className="relative text-14 font-medium">Nenhuma empresa nessa busca</p>
                  <p className="relative mt-1 text-13 text-muted-foreground">Tente outro termo, aumente o raio ou desmarque “só dentro da cidade”.</p>
                </div>
              ) : (
                <ol className="grid gap-3">
                  {lista.slice(0, mostrar).map((l, i) => (
                    <LeadCard
                      key={l.placeId}
                      lead={l}
                      posicao={i + 1}
                      ativo={selecionado === l.placeId}
                      marcado={marcados.has(l.placeId)}
                      onMarcar={(v) =>
                        setMarcados((s) => {
                          const n = new Set(s);
                          if (v) n.add(l.placeId);
                          else n.delete(l.placeId);
                          return n;
                        })
                      }
                      onFocar={() => setSelecionado(l.placeId)}
                      onEnviar={() => enviar([l.placeId])}
                    />
                  ))}
                </ol>
              )}
              {lista.length > mostrar && (
                <Button variant="secondary" onClick={() => setMostrar((m) => m + 12)}>
                  Mostrar mais <span className="font-mono text-12 text-muted-foreground tabular">+{Math.min(12, lista.length - mostrar)}</span>
                </Button>
              )}
              <p className="text-11 text-muted-foreground">Dados: Google. Nota, avaliações, telefone e site como estão no perfil público hoje.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Legenda() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-[400] flex gap-3 rounded-control bg-card/95 px-3 py-2 text-11 text-subtle-foreground shadow-hairline ring-1 ring-border">
      {(
        [
          ["var(--profit)", "Máxima"],
          ["var(--chart-1)", "Alta"],
          ["var(--chart-4)", "Média"],
          ["var(--chart-5)", "Baixa"],
        ] as const
      ).map(([c, l]) => (
        <span key={l} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: c }} aria-hidden />
          {l}
        </span>
      ))}
    </div>
  );
}

function Inicio({ buscas, onRepetir }: { buscas: BuscaSalva[]; onRepetir: (b: BuscaSalva) => void }) {
  const hoje = todaySP();
  return (
    <div className="grid gap-4">
      <div className="surface p-5">
        <p className="text-14 font-medium">Como a pontuação funciona</p>
        <ul className="mt-3 grid gap-2 text-13 text-subtle-foreground">
          <li>
            <span className="font-medium text-foreground">Poucas avaliações</span> para o movimento: é onde a placa mais faz diferença.
          </li>
          <li>
            <span className="font-medium text-foreground">Nota alta</span>: cliente satisfeito, que avalia bem quando lembram de pedir.
          </li>
          <li>
            <span className="font-medium text-foreground">Celular público</span>: dá para chamar no WhatsApp na hora.
          </li>
          <li>
            <span className="font-medium text-foreground">Sem site</span>: a ficha do Google é a vitrine do negócio.
          </li>
        </ul>
      </div>
      {buscas.length > 0 && (
        <div className="surface p-5">
          <p className="text-14 font-medium">Buscas recentes</p>
          <ul className="mt-3 divide-y divide-border">
            {buscas.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => onRepetir(b)}
                  className="flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors duration-150 hover-fine:text-primary"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-13 font-medium capitalize">{b.segmento}</span>
                    <span className="block truncate text-12 text-muted-foreground">
                      {b.local} · {relativeDays(b.criadaEm.slice(0, 10), hoje)}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-12 text-muted-foreground tabular">{b.total} leads</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-11 text-muted-foreground">Repetir uma busca consulta o Google de novo, com dados de hoje.</p>
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead: l,
  posicao,
  ativo,
  marcado,
  onMarcar,
  onFocar,
  onEnviar,
}: {
  lead: Resultado;
  posicao: number;
  ativo: boolean;
  marcado: boolean;
  onMarcar: (v: boolean) => void;
  onFocar: () => void;
  onEnviar: () => void;
}) {
  const [aberto, setAberto] = React.useState(false);
  const p = PRIORIDADE[l.prioridade];
  const zap = l.telefone ? whatsappUrl(l.telefone) : null;
  const bloqueado = l.jaCliente || !!l.noFunil;

  return (
    <li id={`lead-${l.placeId}`} onMouseEnter={onFocar} className={cn("surface grid gap-3 p-4 transition-shadow duration-150", ativo && "ring-2 ring-primary")}>
      <div className="flex items-start gap-3">
        <label className={cn("mt-0.5 grid size-5 shrink-0 place-items-center", bloqueado && "invisible")}>
          <input
            type="checkbox"
            checked={marcado}
            onChange={(e) => onMarcar(e.target.checked)}
            aria-label={`Marcar ${l.nome}`}
            className="size-4 accent-[var(--primary)]"
          />
        </label>
        <button type="button" onClick={onFocar} className="min-w-0 flex-1 text-left">
          <p className="font-mono text-11 text-muted-foreground tabular">
            {String(posicao).padStart(2, "0")}
            {l.categoria ? ` · ${l.categoria}` : ""}
            {l.distanciaKm != null ? ` · ${l.distanciaKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km` : ""}
          </p>
          <p className="mt-0.5 truncate text-16 font-semibold tracking-[-0.01em]">{l.nome}</p>
          {l.endereco && <p className="mt-0.5 line-clamp-2 text-12 text-muted-foreground">{l.endereco}</p>}
        </button>
        <div className="shrink-0 text-right">
          <p className="font-mono text-20 font-medium leading-none tabular">{l.score}</p>
          <span className={cn("mt-1.5 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-11 font-medium", p.cls)}>{p.label}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-8 text-12">
        {l.rating != null ? (
          <span className="inline-flex items-center gap-1.5">
            <Stars value={l.rating} />
            <span className="font-mono font-medium tabular">{formatRating(l.rating)}</span>
            <span className="text-muted-foreground">({formatInt(l.totalAvaliacoes ?? 0)})</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Sem avaliações</span>
        )}
        {!l.website && <span className="rounded-full bg-muted px-2 py-0.5 text-subtle-foreground">Sem site</span>}
        {l.jaCliente && <span className="rounded-full bg-profit-soft px-2 py-0.5 font-medium text-profit">Já é cliente</span>}
        {!l.jaCliente && l.noFunil && (
          <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">{STATUS_FUNIL[l.noFunil] ?? "No funil"}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-8">
        {zap && (
          <a
            href={zap}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-profit-soft px-2.5 text-12 font-medium text-profit transition-transform duration-150 active:scale-[0.96] coarse:h-11"
          >
            WhatsApp
          </a>
        )}
        {l.telefone && (
          <a
            href={`tel:${l.telefone.replace(/[^\d+]/g, "")}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 font-mono text-12 ring-1 ring-border transition-[transform,background-color] duration-150 hover-fine:bg-muted active:scale-[0.96] coarse:h-11"
          >
            <Phone className="size-3.5" strokeWidth={1.5} />
            {l.telefone}
          </a>
        )}
        {l.mapsUrl && (
          <a
            href={l.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-[8px] px-2 text-12 font-medium text-subtle-foreground hover-fine:text-foreground coarse:h-11"
          >
            Maps <ArrowUpRight className="size-3" strokeWidth={1.5} />
          </a>
        )}
        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          aria-expanded={aberto}
          className="ml-auto inline-flex h-8 items-center gap-1 px-1 text-12 text-muted-foreground hover-fine:text-foreground coarse:h-11"
        >
          Por que {l.score}?
          <ChevronDown className={cn("size-3.5 transition-transform duration-200 motion-reduce:transition-none", aberto && "rotate-180")} strokeWidth={1.5} />
        </button>
        {!bloqueado && (
          <Button size="sm" onClick={onEnviar}>
            <Send strokeWidth={1.5} /> Funil
          </Button>
        )}
      </div>

      {aberto && (
        <ul className="ml-8 grid gap-1.5 rounded-control bg-muted/60 p-3 text-12">
          {l.motivos.map((m) => (
            <li key={m.texto} className="flex items-baseline justify-between gap-3">
              <span className="text-subtle-foreground">{m.texto}</span>
              <span className={cn("font-mono tabular", m.pontos > 0 ? "text-profit" : m.pontos < 0 ? "text-cost" : "text-muted-foreground")}>
                {m.pontos > 0 ? "+" : ""}
                {m.pontos}
              </span>
            </li>
          ))}
          <li className="flex items-baseline justify-between gap-3 border-t border-border pt-1.5">
            <span className="text-subtle-foreground">Base</span>
            <span className="font-mono text-muted-foreground tabular">+5</span>
          </li>
        </ul>
      )}
    </li>
  );
}
