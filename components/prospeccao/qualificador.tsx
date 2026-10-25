"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Folder, FolderOpen, Globe, MapPin, MapPinned, Phone, Send, Sparkles, Star, Trash2 } from "lucide-react";
import { excluirBusca } from "@/app/actions";
import type { LeadGoogle } from "@/app/api/prospeccao/buscar/route";
import type { BuscaSalva } from "@/lib/data/leads";
import { whatsappUrl } from "@/lib/prospeccao";
import { formatInt, formatRating } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PRIORIDADE, STATUS_FUNIL } from "./radar-ui";

const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" }).replace(".", "");

/**
 * Bancada de qualificação (só no computador): buscas salvas, o resumo do lote,
 * a barra para mandar ao funil em lote e os leads em cartões de duas colunas.
 */
export function Qualificador({
  buscas,
  lista,
  numeros,
  contexto,
  carregando,
  onRepetir,
  onFocar,
  onEnviar,
  onMelhoresPrimeiro,
  onSoWhatsapp,
}: {
  buscas: BuscaSalva[];
  lista: LeadGoogle[] | null;
  numeros: Map<string, number>;
  contexto: { segmento: string; onde: string } | null;
  carregando: boolean;
  onRepetir: (b: BuscaSalva) => void;
  onFocar: (id: string) => void;
  onEnviar: (ls: LeadGoogle[]) => Promise<void>;
  onMelhoresPrimeiro: () => void;
  onSoWhatsapp: () => void;
}) {
  const reduce = useReducedMotion();
  const trilho = React.useRef<HTMLDivElement>(null);
  const [salvas, setSalvas] = React.useState(buscas);
  const [marcados, setMarcados] = React.useState<Set<string>>(new Set());
  const [enviando, setEnviando] = React.useState(false);
  React.useEffect(() => setSalvas(buscas), [buscas]);
  React.useEffect(() => setMarcados(new Set()), [lista]);

  const leads = lista ?? [];
  const marcaveis = leads.filter((l) => !l.noFunil && !l.jaCliente);
  const maxima = leads.filter((l) => l.prioridade === "maxima").length;
  const alta = leads.filter((l) => l.prioridade === "alta").length;
  const zap = leads.filter((l) => l.telefone && whatsappUrl(l.telefone)).length;

  const rolar = (d: number) => trilho.current?.scrollBy({ left: d * 300, behavior: reduce ? "auto" : "smooth" });

  return (
    <section aria-label="Qualificador de leads" className="hidden gap-5 lg:grid">
      {/* Buscas salvas */}
      <div className="surface toque flex items-center gap-5 p-4">
        <div className="flex shrink-0 items-center gap-3 border-r border-border pr-5">
          <span className="grid size-11 place-items-center rounded-card bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_var(--primary)]">
            <FolderOpen className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-14 font-semibold">Buscas salvas</p>
            <p className="text-11 text-muted-foreground">Seu histórico de prospecção</p>
          </div>
          <span className="ml-1 grid h-8 min-w-8 place-items-center rounded-full px-2 font-mono text-12 tabular ring-1 ring-border">
            {String(salvas.length).padStart(2, "0")}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              Biblioteca <span className="ml-1 normal-case tracking-normal">· mais recentes primeiro</span>
            </p>
            <div className="flex gap-1">
              <BotaoIcone rotulo="Anteriores" onClick={() => rolar(-1)}>
                <ChevronLeft className="size-4" strokeWidth={1.75} />
              </BotaoIcone>
              <BotaoIcone rotulo="Próximas" onClick={() => rolar(1)}>
                <ChevronRight className="size-4" strokeWidth={1.75} />
              </BotaoIcone>
            </div>
          </div>
          {salvas.length === 0 ? (
            <p className="py-3 text-12 text-muted-foreground">As buscas que você fizer aparecem aqui para repetir com um clique.</p>
          ) : (
            <div ref={trilho} className="flex snap-x gap-3 overflow-x-auto no-scrollbar">
              {salvas.map((b, i) => (
                <div
                  key={b.id}
                  className={cn(
                    "group flex w-[270px] shrink-0 snap-start items-center gap-3 rounded-card p-3 ring-1 transition-[background-color,box-shadow] duration-150",
                    i === 0 ? "bg-accent/50 ring-primary/50" : "ring-border hover-fine:bg-muted/60",
                  )}
                >
                  <button type="button" onClick={() => onRepetir(b)} className="flex min-w-0 flex-1 items-center gap-3 text-left" title="Repetir esta busca">
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-control",
                        i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Folder className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-13 font-medium capitalize">
                        {b.segmento} <span className="text-muted-foreground normal-case">· {b.local}</span>
                      </span>
                      <span className="block text-11 text-muted-foreground">
                        {b.total} leads · {dataCurta(b.criadaEm)}
                      </span>
                    </span>
                  </button>
                  <span className="font-mono text-[10px] text-muted-foreground tabular">{String(i + 1).padStart(2, "0")}</span>
                  <BotaoIcone
                    rotulo="Apagar do histórico"
                    onClick={async () => {
                      setSalvas((s) => s.filter((x) => x.id !== b.id));
                      const r = await excluirBusca(b.id);
                      if (!r.ok) toast.error(r.error);
                    }}
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.75} />
                  </BotaoIcone>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {lista && (
        <>
          {/* Qualificador */}
          <div className="surface toque grid grid-cols-[minmax(0,1fr)_320px] overflow-hidden p-0">
            <div className="flex items-center gap-8 p-6">
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-1 rounded-full bg-gradient-to-b from-primary to-transparent" aria-hidden />
                <div className="max-w-md">
                  <p className="font-mono text-[10px] tracking-[0.14em] text-primary uppercase">/ Inteligência comercial Basik7</p>
                  <h2 className="mt-1 text-28 leading-tight font-semibold tracking-[-0.02em]">Qualificador de leads</h2>
                  <p className="mt-1 text-12 text-muted-foreground">
                    {contexto ? (
                      <>
                        <span className="text-foreground capitalize">{contexto.segmento}</span> · {contexto.onde}. Cada lead tem uma nota de 0 a 100 que diz
                        quem merece o primeiro contato.
                      </>
                    ) : (
                      "Cada lead tem uma nota de 0 a 100 que diz quem merece o primeiro contato."
                    )}
                  </p>
                </div>
              </div>
              <dl className="ml-auto grid grid-cols-3 divide-x divide-border border-y border-border">
                {[
                  ["01", maxima, "Prioridade máxima"],
                  ["02", alta, "Alta oportunidade"],
                  ["03", zap, "Com WhatsApp"],
                ].map(([n, v, l]) => (
                  <div key={l as string} className="flex items-end gap-2 px-5 py-4">
                    <span className="font-mono text-[10px] text-primary">{n}</span>
                    <div>
                      <dd className="font-mono text-28 leading-none font-semibold tabular">{v}</dd>
                      <dt className="mt-1 font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase">{l}</dt>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
            <div className="grid content-center gap-3 border-l border-border bg-card/60 p-5">
              <p className="flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-primary uppercase">
                / Comandos <span className="text-muted-foreground">{carregando ? "buscando…" : "disponível"}</span>
              </p>
              <button
                type="button"
                onClick={onMelhoresPrimeiro}
                className="flex items-center justify-between rounded-card bg-primary px-4 py-3 text-left text-primary-foreground shadow-[0_10px_30px_-12px_var(--primary)] transition-transform duration-150 active:scale-[0.98]"
              >
                <span>
                  <span className="block text-13 font-semibold">Melhores primeiro</span>
                  <span className="block text-11 opacity-80">Ordena pela nota para a placa</span>
                </span>
                <Sparkles className="size-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={onSoWhatsapp}
                className="flex items-center justify-between rounded-card px-4 py-3 text-left ring-1 ring-border transition-[background-color,transform] duration-150 hover-fine:bg-muted active:scale-[0.98]"
              >
                <span>
                  <span className="block text-13 font-semibold">Só com WhatsApp</span>
                  <span className="block text-11 text-muted-foreground">Quem dá para chamar agora</span>
                </span>
                <Phone className="size-4 text-primary" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Envio em lote */}
          <div className="surface flex items-center gap-4 px-5 py-4">
            <span className="grid size-9 place-items-center rounded-control bg-accent text-accent-foreground">
              <Send className="size-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-14 font-semibold">Envie só o que faz sentido para o funil</p>
              <p className="text-12 text-muted-foreground">Marque os leads abaixo. Eles entram em “Novo”, ainda sem virar clientes.</p>
            </div>
            {marcaveis.length > 0 && (
              <button
                type="button"
                onClick={() => setMarcados(marcados.size === marcaveis.length ? new Set() : new Set(marcaveis.map((l) => l.placeId)))}
                className="text-13 font-medium text-primary"
              >
                {marcados.size === marcaveis.length ? "Desmarcar" : "Marcar todos"}
              </button>
            )}
            <button
              type="button"
              disabled={!marcados.size || enviando}
              onClick={async () => {
                setEnviando(true);
                await onEnviar(leads.filter((l) => marcados.has(l.placeId)));
                setEnviando(false);
                setMarcados(new Set());
              }}
              className="flex h-11 items-center gap-2 rounded-card bg-primary px-5 text-13 font-semibold text-primary-foreground transition-[opacity,transform] duration-150 active:scale-[0.97] disabled:opacity-40"
            >
              <Send className="size-4" strokeWidth={1.75} /> Enviar {marcados.size} ao funil
            </button>
          </div>

          {/* Cartões */}
          {leads.length === 0 ? (
            <div className="surface px-6 py-10 text-center text-13 text-muted-foreground">Nenhum lead com esses filtros.</div>
          ) : (
            <ol className="grid grid-cols-2 gap-4">
              <AnimatePresence initial={false}>
                {leads.map((l, i) => (
                  <motion.li
                    key={l.placeId}
                    layout={!reduce}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 300, damping: 30, delay: Math.min(i, 8) * 0.03 }}
                  >
                    <CartaoLead
                      l={l}
                      numero={numeros.get(l.placeId) ?? i + 1}
                      marcado={marcados.has(l.placeId)}
                      onMarcar={(v) =>
                        setMarcados((s) => {
                          const n = new Set(s);
                          if (v) n.add(l.placeId);
                          else n.delete(l.placeId);
                          return n;
                        })
                      }
                      onFocar={() => onFocar(l.placeId)}
                      onEnviar={() => onEnviar([l])}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          )}
        </>
      )}
    </section>
  );
}

function CartaoLead({
  l,
  numero,
  marcado,
  onMarcar,
  onFocar,
  onEnviar,
}: {
  l: LeadGoogle;
  numero: number;
  marcado: boolean;
  onMarcar: (v: boolean) => void;
  onFocar: () => void;
  onEnviar: () => void;
}) {
  const p = PRIORIDADE[l.prioridade];
  const zap = l.telefone ? whatsappUrl(l.telefone, `Olá! Vi a ${l.nome} no Google e queria mostrar uma forma simples de conseguir mais avaliações.`) : null;
  const bloqueado = l.jaCliente || !!l.noFunil;
  const sinais = [
    l.telefone && { ok: true, t: zap ? "WhatsApp disponível" : "Telefone disponível" },
    { ok: !l.website, t: l.website ? "Tem site" : "Sem site próprio" },
    l.rating != null && { ok: l.rating >= 4.2, t: `Avaliação ${formatRating(l.rating)}` },
    l.instagram && { ok: true, t: "Instagram" },
  ].filter(Boolean) as { ok: boolean; t: string }[];

  return (
    <article className={cn("surface toque grid h-full gap-4 p-5 transition-shadow duration-150", marcado && "ring-2 ring-primary")}>
      <div className="flex items-start gap-4">
        <label className={cn("mt-3 grid size-5 shrink-0 place-items-center", bloqueado && "invisible")}>
          <input
            type="checkbox"
            checked={marcado}
            onChange={(e) => onMarcar(e.target.checked)}
            aria-label={`Marcar ${l.nome}`}
            className="size-4 accent-[var(--primary)]"
          />
        </label>
        <span
          className={cn("pin-chip grid size-12 shrink-0 place-items-center rounded-card font-mono text-14 font-semibold text-white", `pin-${l.prioridade}`)}
        >
          {String(numero).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[10px] tracking-[0.14em] text-primary uppercase">
            Top {String(numero).padStart(2, "0")} · {l.categoria ?? "Estabelecimento"}
          </p>
          <h3 className="mt-0.5 truncate text-20 leading-tight font-semibold tracking-[-0.01em]">{l.nome}</h3>
          <span className={cn("mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] uppercase", p.cls)}>{p.label}</span>
        </div>
        <div className="relative grid size-16 shrink-0 place-items-center rounded-full ring-1 ring-border">
          <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle
              cx="32"
              cy="32"
              r="29"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${(l.score / 100) * 182} 182`}
            />
          </svg>
          <span className="text-center leading-none">
            <span className="block font-mono text-16 font-semibold tabular">{l.score}</span>
            <span className="font-mono text-[8px] tracking-[0.12em] text-muted-foreground uppercase">Quali</span>
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 border-t border-border pt-4">
        <div className="flex gap-2.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} />
          <div className="min-w-0">
            <dt className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase">Localidade</dt>
            <dd className="mt-0.5 line-clamp-2 text-12">{l.endereco ?? "Endereço não informado"}</dd>
          </div>
        </div>
        <div className="flex gap-2.5 border-l border-border pl-4">
          <Phone className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} />
          <div className="min-w-0">
            <dt className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase">Contato</dt>
            <dd className="mt-0.5 truncate font-mono text-12">{l.telefone ?? "Sem telefone"}</dd>
          </div>
        </div>
      </dl>

      <ul className="flex flex-wrap gap-1.5">
        {sinais.map((s) => (
          <li
            key={s.t}
            className={cn(
              "inline-flex items-center gap-1 rounded-control px-2 py-1 text-11 ring-1",
              s.ok ? "text-foreground ring-primary/40" : "text-muted-foreground ring-border",
            )}
          >
            <Check className={cn("size-3", s.ok ? "text-primary" : "text-muted-foreground")} strokeWidth={2.5} /> {s.t}
          </li>
        ))}
        {l.noFunil && <li className="rounded-control bg-accent px-2 py-1 text-11 font-medium text-accent-foreground">{STATUS_FUNIL[l.noFunil]}</li>}
        {l.jaCliente && <li className="rounded-control bg-profit-soft px-2 py-1 text-11 font-medium text-profit">Já é cliente</li>}
      </ul>

      <div className="mt-auto flex items-center gap-3 border-t border-border pt-4">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-11 ring-1 ring-border">
          <Star className="size-3 fill-current text-pending" strokeWidth={1.5} />
          {l.rating != null ? (
            <>
              <span className="font-mono tabular">{formatRating(l.rating)}</span>
              <span className="text-muted-foreground">({formatInt(l.totalAvaliacoes ?? 0)})</span>
            </>
          ) : (
            <span className="text-muted-foreground">Nota no Maps</span>
          )}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-11 ring-1 ring-border">
          <Globe className="size-3 text-primary" strokeWidth={1.75} /> {l.website ? "Site" : "Sem site"}
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase">Qualificação</span>
          <span className="h-1 min-w-8 flex-1 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-gradient-to-r from-primary/60 to-primary" style={{ width: `${l.score}%` }} />
          </span>
          <span className="font-mono text-11 tabular">{l.score}%</span>
        </div>
        <BotaoIcone rotulo="Ver no mapa" onClick={onFocar}>
          <MapPinned className="size-4" strokeWidth={1.75} />
        </BotaoIcone>
        {zap && (
          <a
            href={zap}
            target="_blank"
            rel="noreferrer"
            aria-label={`WhatsApp de ${l.nome}`}
            className="grid size-9 place-items-center rounded-control bg-profit-soft text-profit transition-transform duration-150 active:scale-[0.92]"
          >
            <Phone className="size-4" strokeWidth={1.75} />
          </a>
        )}
        {!bloqueado && (
          <button
            type="button"
            onClick={onEnviar}
            className="flex h-9 items-center gap-1.5 rounded-control bg-primary px-3 text-12 font-semibold text-primary-foreground transition-transform duration-150 active:scale-[0.96]"
          >
            <Send className="size-3.5" strokeWidth={1.75} /> Funil
          </button>
        )}
      </div>
    </article>
  );
}

function BotaoIcone({ rotulo, onClick, children }: { rotulo: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      title={rotulo}
      className="grid size-8 shrink-0 place-items-center rounded-control text-muted-foreground ring-1 ring-border transition-[background-color,color,transform] duration-150 hover-fine:bg-muted hover-fine:text-foreground active:scale-[0.92]"
    >
      {children}
    </button>
  );
}
