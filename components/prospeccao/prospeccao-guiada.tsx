"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { AlertTriangle, Check, ClipboardPaste, Clock, Crosshair, ExternalLink, Loader2, MapPin, Palette, Radar, Search, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, fieldClass } from "@/components/ui/input";
import { Orb } from "@/components/ui/orb";
import { adicionarLeadManual, registrarBusca, resolverLinkMaps } from "@/app/actions";
import { qualificar } from "@/lib/prospeccao";
import { chaveLead, lerLinkMaps, urlBuscaMaps, urlEmbedMaps, type LinkMaps } from "@/lib/maps-link";
import type { BuscaSalva } from "@/lib/data/leads";
import { cn } from "@/lib/utils";
import { PRIORIDADE } from "./prospeccao-view";

const NICHOS = ["hamburgueria", "pizzaria", "barbearia", "salão de beleza", "clínica odontológica", "pet shop", "academia", "açaí", "cafeteria", "estética"];
const SUGESTOES = [
  ...NICHOS,
  "restaurante japonês",
  "restaurante",
  "padaria",
  "sorveteria",
  "lanchonete",
  "doceria",
  "estúdio de pilates",
  "estúdio de tatuagem",
  "manicure",
  "lava-rápido",
  "oficina mecânica",
  "auto center",
  "ótica",
  "loja de roupas",
  "floricultura",
  "clínica veterinária",
  "fisioterapia",
  "psicólogo",
  "escola de idiomas",
  "autoescola",
  "imobiliária",
];

type Alvo = { segmento: string; local: string; perto: { lat: number; lng: number } | null; raioKm: number };

/** "4,7" ou "4.7" → 4.7; vazio → null. */
const lerNota = (v: string) => {
  const n = Number(v.replace(",", ".").trim());
  return v.trim() && Number.isFinite(n) ? n : null;
};

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Prospecção sem API paga. O mapa é o Google Maps de verdade, embutido (grátis, sem chave)
 * e tingido com as cores do painel. Toca no pino, lê nota e avaliações na ficha, anota ao lado.
 */
export function ProspeccaoGuiada({ buscas, noFunil }: { buscas: BuscaSalva[]; noFunil: { placeId: string; nome: string }[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();

  /* ------------------------------ Busca ------------------------------ */
  const [segmento, setSegmento] = React.useState("");
  const [local, setLocal] = React.useState("Limeira, SP");
  const [modo, setModo] = React.useState<"cidade" | "perto">("cidade");
  const [raioKm, setRaioKm] = React.useState(3);
  const [voce, setVoce] = React.useState<{ lat: number; lng: number } | null>(null);
  const [localizando, setLocalizando] = React.useState(false);
  const [alvo, setAlvo] = React.useState<Alvo | null>(null);
  const [carregandoMapa, setCarregandoMapa] = React.useState(true);
  const [cores, setCores] = React.useState<"painel" | "original">("painel");
  const [recentes, setRecentes] = React.useState(() => dedupe(buscas.filter((b) => b.modo !== "area")));
  const buscaRef = React.useRef<HTMLInputElement>(null);
  const [montado, setMontado] = React.useState(false);
  React.useEffect(() => setMontado(true), []);

  // Se o Google demorar (rede lenta ou bloqueio), a esfera sai da frente mesmo assim.
  React.useEffect(() => {
    if (!carregandoMapa) return;
    const t = setTimeout(() => setCarregandoMapa(false), 8000);
    return () => clearTimeout(t);
  }, [carregandoMapa]);

  // "/" leva direto para a busca, como nos apps de busca.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        buscaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pegarLocalizacao = () =>
    new Promise<{ lat: number; lng: number }>((ok, falha) => {
      if (voce) return ok(voce);
      if (!navigator.geolocation) return falha(new Error("sem gps"));
      setLocalizando(true);
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setLocalizando(false);
          const c = { lat: p.coords.latitude, lng: p.coords.longitude };
          setVoce(c);
          ok(c);
        },
        (e) => {
          setLocalizando(false);
          falha(e);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
      );
    });

  const buscar = async (o?: Partial<Alvo> & { modo?: "cidade" | "perto" }) => {
    const seg = (o?.segmento ?? segmento).trim();
    if (!seg) {
      buscaRef.current?.focus();
      return toast.error("Diga o que procurar. Ex.: hamburgueria");
    }
    const m = o?.modo ?? modo;
    const loc = (o?.local ?? local).trim() || "Limeira, SP";
    const raio = o?.raioKm ?? raioKm;
    let perto: Alvo["perto"] = null;
    if (m === "perto") {
      try {
        perto = await pegarLocalizacao();
      } catch {
        toast.error("Não deu para pegar sua localização. Busquei na cidade.");
        setModo("cidade");
      }
    }
    setSegmento(seg);
    setAlvo({ segmento: seg, local: loc, perto, raioKm: raio });
    setCarregandoMapa(true);
    const onde = perto ? "Perto de você" : loc;
    setRecentes((r) =>
      dedupe([
        {
          id: -Date.now(),
          segmento: seg,
          local: onde,
          modo: perto ? "perto" : "cidade",
          raioKm: perto ? raio : null,
          total: 0,
          criadaEm: new Date().toISOString(),
        },
        ...r,
      ]),
    );
    registrarBusca({ segmento: seg, local: onde, modo: perto ? "perto" : "cidade", raioKm: perto ? raio : null }).catch(() => {});
  };

  const embed = alvo
    ? urlEmbedMaps({ segmento: alvo.segmento, local: alvo.local, perto: alvo.perto ?? undefined, raioKm: alvo.raioKm })
    : urlEmbedMaps({ local });
  const noApp = alvo ? urlBuscaMaps({ segmento: alvo.segmento, local: alvo.local, perto: alvo.perto ?? undefined }) : urlBuscaMaps({ segmento: "", local });

  /* ----------------------------- Captura ----------------------------- */
  const [colado, setColado] = React.useState("");
  const [link, setLink] = React.useState<LinkMaps | null>(null);
  const [lendo, setLendo] = React.useState(false);
  const [nome, setNome] = React.useState("");
  const [endereco, setEndereco] = React.useState("");
  const [nota, setNota] = React.useState("");
  const [avaliacoes, setAvaliacoes] = React.useState("");
  const [telefone, setTelefone] = React.useState("");
  const [temSite, setTemSite] = React.useState(false);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string>();
  const [podeColar, setPodeColar] = React.useState(false);
  const coladoRef = React.useRef<HTMLTextAreaElement>(null);
  const nomeRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => setPodeColar(!!navigator.clipboard?.readText), []);

  // Lê o que foi colado: na hora pelo texto; o link curto o servidor abre.
  const lerColado = async (texto: string) => {
    setColado(texto);
    if (!texto.trim()) return setLink(null);
    // Só sobrescreve o que veio do link anterior; o que a pessoa digitou fica.
    const anterior = link;
    const aplicar = (l: LinkMaps) => {
      if (l.nome) setNome((n) => (!n || n === anterior?.nome ? l.nome! : n));
      if (l.endereco) setEndereco((e) => (!e || e === anterior?.endereco ? l.endereco! : e));
    };
    const lido = lerLinkMaps(texto);
    setLink(lido);
    aplicar(lido);
    if (lido.curto) {
      setLendo(true);
      const r = await resolverLinkMaps(texto).catch(() => lido);
      setLendo(false);
      setLink(r);
      aplicar(r);
    }
  };

  const colarDaAreaDeTransferencia = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (!t.trim()) return toast.error("Nada copiado ainda. No Maps: Compartilhar → Copiar.");
      await lerColado(t);
      nomeRef.current?.focus();
    } catch {
      coladoRef.current?.focus();
      toast("Toque e segure no campo e escolha Colar.");
    }
  };

  // Já está no funil? Avisa enquanto digita, antes de salvar.
  const duplicado = React.useMemo(() => {
    const n = norm(nome);
    if (!n) return null;
    const chave = link?.chave ? chaveLead({ chave: link.chave, nome }) : null;
    return noFunil.find((l) => (chave && l.placeId === chave) || norm(l.nome) === n) ?? null;
  }, [nome, link, noFunil]);

  const total = avaliacoes.trim() === "" ? null : Math.trunc(Number(avaliacoes));
  const rating = lerNota(nota);
  const previa =
    nome.trim() && total != null && Number.isFinite(total)
      ? qualificar({
          placeId: "",
          nome,
          categoria: null,
          endereco: null,
          lat: null,
          lng: null,
          telefone: telefone.trim() || null,
          website: temSite ? "sim" : null,
          mapsUrl: null,
          rating,
          totalAvaliacoes: total,
          status: null,
        })
      : null;
  const p = previa ? PRIORIDADE[previa.prioridade] : null;

  const limpar = () => {
    setColado("");
    setLink(null);
    setNome("");
    setEndereco("");
    setNota("");
    setAvaliacoes("");
    setTelefone("");
    setTemSite(false);
    setErro(undefined);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(undefined);
    if (!nome.trim()) return setErro("Informe o nome da empresa.");
    if (total == null || !Number.isFinite(total) || total < 0) return setErro("Informe quantas avaliações aparecem no Google (0 se não tiver).");
    if (total > 0 && rating == null) return setErro("Informe a nota que aparece no Google. Ex.: 4,7");
    setSalvando(true);
    const r = await adicionarLeadManual({
      nome,
      segmento: alvo?.segmento ?? segmento,
      endereco: endereco || null,
      mapsUrl: link?.url ?? null,
      chave: link?.chave ?? null,
      lat: link?.lat ?? null,
      lng: link?.lng ?? null,
      telefone: telefone || null,
      temSite,
      rating,
      totalAvaliacoes: total,
    });
    setSalvando(false);
    if (!r.ok) return setErro(r.error);
    toast.success(`${nome.trim()} entrou no funil`, { description: previa ? `${previa.score} pontos · ${p?.label}` : undefined });
    limpar();
    router.refresh();
    // Pronto para a próxima: volta para o campo de colar.
    coladoRef.current?.focus({ preventScroll: true });
  };

  const energia = localizando ? 1 : alvo && carregandoMapa ? 0.9 : alvo ? 0.45 : 0.2;

  return (
    <div className="grid gap-5">
      {/* ------------------------- Barra de busca ------------------------- */}
      <section aria-label="Buscar empresas" className="surface relative overflow-hidden p-4 md:p-5">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-primary/20 blur-3xl" />
        <form
          className="relative grid gap-3 md:grid-cols-[auto_minmax(0,1.3fr)_minmax(0,1fr)_auto] md:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            buscar();
          }}
        >
          <Orb size={56} energia={energia} className="hidden md:block" label={localizando ? "Pegando sua localização" : "Radar de prospecção"} />
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" strokeWidth={1.5} />
            <input
              ref={buscaRef}
              value={segmento}
              onChange={(e) => setSegmento(e.target.value)}
              placeholder="O que procurar? Ex.: hamburgueria"
              aria-label="O que procurar"
              list="nichos"
              enterKeyHint="search"
              autoComplete="off"
              className={cn(fieldClass, "h-12 pr-10 pl-10 text-16 coarse:h-12")}
            />
            {segmento ? (
              <button
                type="button"
                onClick={() => {
                  setSegmento("");
                  buscaRef.current?.focus();
                }}
                aria-label="Limpar busca"
                className="absolute right-2 grid size-8 place-items-center rounded-full text-muted-foreground hover-fine:bg-muted hover-fine:text-foreground"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 hidden rounded-[6px] px-1.5 font-mono text-11 text-muted-foreground ring-1 ring-border md:block">
                /
              </kbd>
            )}
            <datalist id="nichos">
              {SUGESTOES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>

          {/* Onde: cidade/bairro ou perto de mim */}
          <div className="flex min-w-0 items-center gap-2">
            <LayoutGroup id="onde">
              <div role="radiogroup" aria-label="Onde buscar" className="flex shrink-0 gap-0.5 rounded-full bg-muted p-1">
                {(
                  [
                    ["cidade", MapPin, "Cidade"],
                    ["perto", Crosshair, "Perto"],
                  ] as const
                ).map(([k, Icone, l]) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={modo === k}
                    onClick={() => setModo(k)}
                    className={cn(
                      "relative flex h-9 items-center gap-1.5 rounded-full px-3 text-13 font-medium outline-hidden transition-[color,transform] duration-150 ease-out-strong active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring coarse:h-10",
                      modo === k ? "text-foreground" : "text-muted-foreground hover-fine:text-foreground",
                    )}
                  >
                    {modo === k && (
                      <motion.span
                        layoutId="onde-pill"
                        className="absolute inset-0 rounded-full bg-card shadow-hairline"
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icone className="relative size-3.5" strokeWidth={1.5} />
                    <span className="relative">{l}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
            {modo === "cidade" ? (
              <input
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Cidade ou bairro"
                aria-label="Cidade ou bairro"
                autoComplete="off"
                className={cn(fieldClass, "h-12 coarse:h-12")}
              />
            ) : (
              <Select value={raioKm} onChange={(e) => setRaioKm(Number(e.target.value))} aria-label="Raio" className="h-12 font-mono text-13 coarse:h-12">
                {[1, 3, 5, 10, 20].map((r) => (
                  <option key={r} value={r}>
                    até {r} km
                  </option>
                ))}
              </Select>
            )}
          </div>

          <Button type="submit" variant="primary" disabled={localizando} className="h-12 px-5 text-14 coarse:h-12">
            {localizando ? <Loader2 className="animate-spin motion-reduce:animate-none" strokeWidth={1.5} /> : <Radar strokeWidth={1.5} />}
            {localizando ? "Localizando…" : "Buscar"}
          </Button>
        </form>

        {/* Atalhos: nichos e buscas recentes */}
        <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
          {NICHOS.map((s) => (
            <Chip key={s} ativo={alvo?.segmento === s} onClick={() => buscar({ segmento: s })}>
              {s}
            </Chip>
          ))}
        </div>
        {recentes.length > 0 && (
          <div className="relative mt-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="flex shrink-0 items-center gap-1 text-12 text-muted-foreground">
              <Clock className="size-3.5" strokeWidth={1.5} /> Recentes
            </span>
            {recentes.slice(0, 6).map((r) => (
              <Chip
                key={`${r.segmento}|${r.local}`}
                discreto
                onClick={() =>
                  r.modo === "perto"
                    ? (setModo("perto"), buscar({ segmento: r.segmento, modo: "perto", raioKm: r.raioKm ?? raioKm }))
                    : (setModo("cidade"), setLocal(r.local), buscar({ segmento: r.segmento, local: r.local, modo: "cidade" }))
                }
              >
                {r.segmento} <span className="text-muted-foreground">· {r.local}</span>
              </Chip>
            ))}
          </div>
        )}
      </section>

      {/* --------------------------- Mapa + captura --------------------------- */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(340px,5fr)]">
        <section aria-label="Mapa do Google" className="surface flex h-[64vh] min-h-[460px] flex-col overflow-hidden p-0 lg:h-[680px]">
          {/* Barra do mapa: fica fora do mapa para não cobrir a ficha do Google */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2 text-13">
              <span className="relative grid size-5 shrink-0 place-items-center">
                <span className={cn("absolute size-2 rounded-full bg-primary", carregandoMapa && "animate-ping motion-reduce:animate-none")} />
                <span className="size-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
              </span>
              <span className="truncate">
                {alvo ? (
                  <>
                    <span className="font-medium">{alvo.segmento}</span>
                    <span className="text-muted-foreground"> · {alvo.perto ? `até ${alvo.raioKm} km de você` : alvo.local}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Escolha um nicho para ver as empresas</span>
                )}
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setCores((c) => (c === "painel" ? "original" : "painel"))}
                aria-pressed={cores === "original"}
                title={cores === "painel" ? "Ver com as cores originais do Google (melhor para fotos)" : "Voltar para as cores do painel"}
                className="flex h-8 items-center gap-1.5 rounded-full px-3 text-12 font-medium ring-1 ring-border transition-[background-color,transform] duration-150 ease-out-strong hover-fine:bg-muted active:scale-[0.96] coarse:h-10"
              >
                <Palette className="size-3.5" strokeWidth={1.5} />
                {cores === "painel" ? "Cores originais" : "Cores do painel"}
              </button>
              <a
                href={noApp}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-12 font-medium text-primary-foreground shadow-hairline transition-transform duration-150 ease-out-strong active:scale-[0.96] coarse:h-10"
              >
                <ExternalLink className="size-3.5" strokeWidth={1.5} /> Abrir no app
              </a>
            </div>
          </div>

          <div className="relative isolate flex-1">
            {/* Só no navegador: assim o onLoad nunca escapa antes da hidratação. */}
            {montado && (
              <iframe
                key={embed}
                src={embed}
                title={alvo ? `Google Maps: ${alvo.segmento}` : "Google Maps"}
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setCarregandoMapa(false)}
                className={cn("absolute inset-0 size-full border-0 transition-[filter] duration-300", cores === "painel" && "mapa-roxo")}
              />
            )}
            {/* Tinta roxa por cima: só cor, não bloqueia o toque no mapa. */}
            {cores === "painel" && <div aria-hidden className="mapa-roxo-tinta pointer-events-none absolute inset-0" />}

            {/* Carregando: a esfera aparece enquanto o Google desenha o mapa */}
            <AnimatePresence>
              {carregandoMapa && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="pointer-events-none absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-[2px]"
                >
                  <div className="grid justify-items-center gap-2">
                    <Orb size={120} energia={1} />
                    <p className="text-13 text-subtle-foreground">{alvo ? "Varrendo o mapa…" : "Abrindo o mapa…"}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ---------------------------- Captura ---------------------------- */}
        <section aria-labelledby="captura" className="surface p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="captura" className="text-16 font-semibold tracking-[-0.01em]">
              Anotar lead
            </h2>
            <span className="text-12 text-muted-foreground">
              <span className="font-mono tabular">{noFunil.length}</span> no funil
            </span>
          </div>
          <p className="mt-1 text-13 text-muted-foreground">Toque num pino do mapa: a ficha mostra a nota e o número de avaliações. Anote aqui.</p>

          <form onSubmit={salvar} className="mt-4 grid gap-4" noValidate>
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="colado" className="text-13 font-medium text-subtle-foreground">
                  Link do Google Maps
                </label>
                {podeColar && (
                  <button
                    type="button"
                    onClick={colarDaAreaDeTransferencia}
                    className="flex h-7 items-center gap-1 rounded-full px-2 text-12 font-medium text-primary hover-fine:bg-accent coarse:h-9"
                  >
                    <ClipboardPaste className="size-3.5" strokeWidth={1.5} /> Colar
                  </button>
                )}
              </div>
              <textarea
                ref={coladoRef}
                id="colado"
                value={colado}
                onChange={(e) => lerColado(e.target.value)}
                rows={2}
                placeholder="Opcional. Ex.: https://maps.app.goo.gl/…"
                className={cn(fieldClass, "h-auto resize-none py-2.5 leading-snug")}
              />
              <p className="flex items-center gap-1.5 text-12 text-muted-foreground" aria-live="polite">
                {lendo ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" strokeWidth={1.5} /> Lendo o link…
                  </>
                ) : link?.url ? (
                  <>
                    <Check className="size-3.5 text-profit" strokeWidth={2} /> Link guardado{link.lat != null ? " com a localização" : ""}.
                  </>
                ) : colado.trim() ? (
                  "Não achei um link do Maps. Tudo bem: preencha o nome."
                ) : (
                  "Com o link, o lead abre direto no Maps depois."
                )}
              </p>
            </div>

            <Field label="Nome da empresa" htmlFor="nome">
              <Input ref={nomeRef} id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Smash Burger" autoComplete="off" />
            </Field>
            <AnimatePresence initial={false}>
              {duplicado && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: reduce ? 0 : 0.2 }}
                  className="-mt-2 flex items-center gap-1.5 overflow-hidden text-12 text-pending"
                  role="status"
                >
                  <AlertTriangle className="size-3.5 shrink-0" strokeWidth={1.5} /> {duplicado.nome} já está no funil.
                </motion.p>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Nota" htmlFor="nota" hint="Ex.: 4,7">
                <Input id="nota" value={nota} onChange={(e) => setNota(e.target.value)} inputMode="decimal" placeholder="4,7" className="font-mono" />
              </Field>
              <Field label="Avaliações" htmlFor="avaliacoes" hint="0 se não tiver">
                <Input
                  id="avaliacoes"
                  value={avaliacoes}
                  onChange={(e) => setAvaliacoes(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  placeholder="38"
                  className="font-mono"
                />
              </Field>
            </div>
            <Field label="WhatsApp ou telefone" htmlFor="telefone" hint="Opcional, com DDD">
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                inputMode="tel"
                placeholder="(19) 99999-9999"
                autoComplete="off"
              />
            </Field>
            <details className="group -mt-1">
              <summary className="cursor-pointer list-none text-12 text-muted-foreground hover-fine:text-foreground">
                <span className="group-open:hidden">+ Endereço e site</span>
                <span className="hidden group-open:inline">− Endereço e site</span>
              </summary>
              <div className="mt-3 grid gap-3">
                <Field label="Endereço" htmlFor="endereco">
                  <Input id="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro" autoComplete="off" />
                </Field>
                <label className="flex cursor-pointer items-center gap-2 text-13 text-subtle-foreground">
                  <input type="checkbox" checked={temSite} onChange={(e) => setTemSite(e.target.checked)} className="size-4 accent-[var(--primary)]" />
                  Tem site próprio
                </label>
              </div>
            </details>

            {/* Pontuação ao vivo: o mesmo cálculo da busca automática. */}
            <div className="relative grid gap-3 overflow-hidden rounded-control bg-muted/60 p-4" aria-live="polite">
              {previa && p ? (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <Medidor valor={previa.score} />
                    <div className="grid gap-1">
                      <span className={cn("w-fit rounded-full px-2 py-0.5 text-12 font-medium", p.cls)}>{p.label}</span>
                      <span className="text-12 text-muted-foreground">pontos de 100 para a placa</span>
                    </div>
                  </div>
                  <ul className="grid gap-1 text-12">
                    {previa.motivos.map((m) => (
                      <li key={m.texto} className="flex items-baseline justify-between gap-3">
                        <span className="text-subtle-foreground">{m.texto}</span>
                        <span className={cn("font-mono tabular", m.pontos > 0 ? "text-profit" : m.pontos < 0 ? "text-cost" : "text-muted-foreground")}>
                          {m.pontos > 0 ? "+" : ""}
                          {m.pontos}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-12 text-muted-foreground">Preencha o nome e as avaliações para ver a pontuação de 0 a 100.</p>
              )}
            </div>

            {erro && (
              <p className="text-13 text-destructive" role="alert">
                {erro}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-end gap-2">
              {(colado || nome || nota || avaliacoes) && (
                <Button type="button" variant="ghost" onClick={limpar}>
                  Limpar
                </Button>
              )}
              <Button type="submit" variant="primary" disabled={salvando} className="min-w-44">
                {salvando ? <Loader2 className="animate-spin motion-reduce:animate-none" strokeWidth={1.5} /> : <Send strokeWidth={1.5} />}
                Mandar para o funil
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function Chip({ ativo, discreto, onClick, children }: { ativo?: boolean; discreto?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "h-7 shrink-0 rounded-full px-2.5 text-12 whitespace-nowrap ring-1 outline-hidden transition-[color,background-color,transform] duration-150 ease-out-strong active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring coarse:h-9",
        ativo
          ? "bg-primary text-primary-foreground ring-primary"
          : discreto
            ? "bg-card/60 text-subtle-foreground ring-border hover-fine:text-foreground"
            : "text-muted-foreground ring-border hover-fine:bg-accent hover-fine:text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Anel que enche conforme a pontuação. */
function Medidor({ valor }: { valor: number }) {
  const reduce = useReducedMotion();
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-14 place-items-center">
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
        <motion.circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - valor / 100) }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 22 }}
          style={{ filter: "drop-shadow(0 0 6px color-mix(in oklch, var(--primary) 70%, transparent))" }}
        />
      </svg>
      <span className="font-mono text-16 font-semibold tabular">{valor}</span>
    </div>
  );
}

function dedupe(bs: BuscaSalva[]): BuscaSalva[] {
  const vistos = new Set<string>();
  return bs.filter((b) => {
    const k = `${norm(b.segmento)}|${norm(b.local)}`;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}
