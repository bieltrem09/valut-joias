"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Loader2, Mic, Pause, RotateCcw, Square, Trash2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { excluirGravacao, salvarGravacao } from "@/app/mentora/actions";
import type { GravacaoInfo } from "@/lib/data/mentora";
import { notaVoz, prosodia } from "@/lib/fala-expressiva";
import type { Tom } from "@/lib/mentora";
import { cn } from "@/lib/utils";

/**
 * Quem fala no "Ouvir", nesta ordem:
 * 1. a sua gravação, se você gravou aquele roteiro;
 * 2. a voz de IA com emoção (ElevenLabs), se a chave estiver ligada;
 * 3. a voz do aparelho, frase por frase, com ritmo, altura e pausas de quem fala de verdade.
 */
type Voz = {
  gravacoes: Record<string, GravacaoInfo>;
  tocando: string | null;
  gerando: string | null;
  vozIa: boolean;
  tocar: (roteiroId: string, texto: string, tom: Tom) => void;
  parar: () => void;
  guardar: (roteiroId: string, g: GravacaoInfo | null) => void;
};

const Ctx = React.createContext<Voz | null>(null);
const LIMITE_S = 180;

/** A voz mais natural em português que o aparelho tiver (as "Natural"/"Google" soam humanas). */
function melhorVoz(): SpeechSynthesisVoice | null {
  const vozes = window.speechSynthesis.getVoices();
  return [...vozes].filter((v) => notaVoz(v) > 0).sort((a, b) => notaVoz(b) - notaVoz(a))[0] ?? null;
}

export function VozProvider({ inicial, vozIa, children }: { inicial: Record<string, GravacaoInfo>; vozIa: boolean; children: React.ReactNode }) {
  const [gravacoes, setGravacoes] = React.useState(inicial);
  const [tocando, setTocando] = React.useState<string | null>(null);
  const [gerando, setGerando] = React.useState<string | null>(null);
  const [iaLigada, setIaLigada] = React.useState(vozIa);
  const audio = React.useRef<HTMLAudioElement | null>(null);
  const falasIa = React.useRef(new Map<string, number>());
  /** Cada "Ouvir" ganha um número; quem for interrompido não continua falando. */
  const vez = React.useRef(0);

  // As vozes do aparelho carregam depois da página.
  React.useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }, []);

  const parar = React.useCallback(() => {
    vez.current++;
    audio.current?.pause();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setTocando(null);
    setGerando(null);
  }, []);

  const tocarArquivo = React.useCallback((roteiroId: string, url: string, minha: boolean) => {
    audio.current ??= new Audio();
    const a = audio.current;
    a.src = url;
    a.onended = () => setTocando(null);
    a.play().then(
      () => setTocando(roteiroId),
      () => toast.error(minha ? "Não deu para tocar a gravação." : "Não deu para tocar a voz."),
    );
  }, []);

  const falarNoAparelho = React.useCallback((roteiroId: string, texto: string, tom: Tom) => {
    if (!("speechSynthesis" in window)) return void toast("Seu navegador não lê em voz alta. Grave a sua voz neste roteiro.");
    const minhaVez = vez.current;
    const trechos = prosodia(texto, tom);
    const voz = melhorVoz();
    setTocando(roteiroId);
    const falar = (i: number) => {
      if (vez.current !== minhaVez) return;
      if (i >= trechos.length) return setTocando(null);
      const t = trechos[i];
      const u = new SpeechSynthesisUtterance(t.texto);
      u.lang = voz?.lang ?? "pt-BR";
      try {
        if (voz) u.voice = voz;
      } catch {
        // Voz que o navegador não aceita: fala com a padrão em pt-BR.
      }
      u.rate = t.rate;
      u.pitch = t.pitch;
      u.onend = () => setTimeout(() => falar(i + 1), t.pausaMs);
      u.onerror = () => vez.current === minhaVez && setTocando(null);
      window.speechSynthesis.speak(u);
    };
    falar(0);
  }, []);

  const tocar = React.useCallback(
    (roteiroId: string, texto: string, tom: Tom) => {
      parar();
      const g = gravacoes[roteiroId];
      if (g) return tocarArquivo(roteiroId, `/api/mentora/audio/${g.id}`, true);
      if (!iaLigada) return falarNoAparelho(roteiroId, texto, tom);

      const chave = `${tom}|${texto}`;
      const pronto = falasIa.current.get(chave);
      if (pronto) return tocarArquivo(roteiroId, `/api/mentora/fala/${pronto}`, false);
      const minhaVez = vez.current;
      setGerando(roteiroId);
      fetch("/api/mentora/falar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texto, tom }) })
        .then((r) => r.json() as Promise<{ ok: boolean; id?: number; error?: string }>)
        .then((r) => {
          if (vez.current !== minhaVez) return;
          setGerando(null);
          if (!r.ok || !r.id) throw new Error(r.error ?? "A voz de IA não respondeu.");
          falasIa.current.set(chave, r.id);
          tocarArquivo(roteiroId, `/api/mentora/fala/${r.id}`, false);
        })
        .catch((e: unknown) => {
          if (vez.current !== minhaVez) return;
          setGerando(null);
          const msg = e instanceof Error ? e.message : "A voz de IA não respondeu.";
          // Cota do mês acabou ou chave recusada: até resolver, usa a voz do aparelho sem perguntar de novo.
          if (/cota|chave/i.test(msg)) setIaLigada(false);
          toast(msg, { description: "Tocando com a voz do aparelho." });
          falarNoAparelho(roteiroId, texto, tom);
        });
    },
    [gravacoes, iaLigada, parar, tocarArquivo, falarNoAparelho],
  );

  const guardar = React.useCallback((roteiroId: string, g: GravacaoInfo | null) => {
    setGravacoes((m) => {
      const n = { ...m };
      if (g) n[roteiroId] = g;
      else delete n[roteiroId];
      return n;
    });
  }, []);

  React.useEffect(() => parar, [parar]);

  return <Ctx.Provider value={{ gravacoes, tocando, gerando, vozIa: iaLigada, tocar, parar, guardar }}>{children}</Ctx.Provider>;
}

const useVoz = () => {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useVoz fora do VozProvider");
  return v;
};

export const useTotalGravacoes = () => Object.keys(useVoz().gravacoes).length;
export const useVozIa = () => useVoz().vozIa;

/** "Ouvir": a sua gravação, a voz de IA ou a voz do aparelho com emoção. */
export function BotaoOuvir({
  roteiroId,
  texto,
  tom,
  size = "sm",
  variant = "ghost",
}: {
  roteiroId: string;
  texto: string;
  tom: Tom;
  size?: "sm" | "md";
  variant?: "ghost" | "secondary";
}) {
  const { gravacoes, tocando, gerando, tocar, parar } = useVoz();
  const minha = !!gravacoes[roteiroId];
  const ativo = tocando === roteiroId || gerando === roteiroId;
  return (
    <Button size={size} variant={variant} onClick={() => (ativo ? parar() : tocar(roteiroId, texto, tom))} aria-pressed={ativo}>
      {gerando === roteiroId ? (
        <Loader2 className="animate-spin motion-reduce:animate-none" strokeWidth={1.5} />
      ) : ativo ? (
        <Pause strokeWidth={1.5} />
      ) : (
        <Volume2 strokeWidth={1.5} />
      )}
      {gerando === roteiroId ? "Preparando a voz…" : ativo ? "Parar" : minha ? "Ouvir minha voz" : "Ouvir"}
    </Button>
  );
}

const tipoSuportado = () =>
  ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"].find(
    (t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t),
  );

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Gravar a sua voz para um roteiro: gravar → ouvir a prévia → salvar (ou regravar). */
export function Gravador({ roteiroId }: { roteiroId: string }) {
  const { gravacoes, guardar, parar: pararTudo } = useVoz();
  const existente = gravacoes[roteiroId];
  const [estado, setEstado] = React.useState<"parado" | "gravando" | "revisar" | "salvando">("parado");
  const [segundos, setSegundos] = React.useState(0);
  const [previa, setPrevia] = React.useState<{ blob: Blob; url: string } | null>(null);
  const rec = React.useRef<MediaRecorder | null>(null);
  const relogio = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const inicio = React.useRef(0);

  const limpar = React.useCallback(() => {
    if (relogio.current) clearInterval(relogio.current);
    rec.current?.stream.getTracks().forEach((t) => t.stop());
    rec.current = null;
  }, []);
  React.useEffect(() => () => limpar(), [limpar]);
  React.useEffect(() => () => void (previa && URL.revokeObjectURL(previa.url)), [previa]);

  const comecar = async () => {
    const tipo = tipoSuportado();
    if (!tipo || !navigator.mediaDevices?.getUserMedia) return void toast.error("Este navegador não grava áudio. Tente pelo Chrome ou pelo Safari atualizado.");
    pararTudo();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      const negado = e instanceof DOMException && e.name === "NotAllowedError";
      return void toast.error(negado ? "Permita o microfone para gravar." : "Não achamos um microfone.", {
        description: negado ? "No navegador: cadeado ao lado do endereço → Microfone → Permitir." : undefined,
      });
    }
    const partes: Blob[] = [];
    const r = new MediaRecorder(stream, { mimeType: tipo });
    r.ondataavailable = (ev) => ev.data.size && partes.push(ev.data);
    r.onstop = () => {
      const blob = new Blob(partes, { type: tipo.split(";")[0] });
      setPrevia({ blob, url: URL.createObjectURL(blob) });
      setEstado("revisar");
      limpar();
    };
    rec.current = r;
    r.start();
    inicio.current = Date.now();
    setSegundos(0);
    setEstado("gravando");
    relogio.current = setInterval(() => {
      const s = (Date.now() - inicio.current) / 1000;
      setSegundos(s);
      if (s >= LIMITE_S) r.stop();
    }, 250);
  };

  const parar = () => rec.current?.state === "recording" && rec.current.stop();

  const salvar = async () => {
    if (!previa) return;
    setEstado("salvando");
    const fd = new FormData();
    fd.set("roteiroId", roteiroId);
    fd.set("segundos", String(Math.round(segundos * 10) / 10));
    fd.set("audio", new File([previa.blob], `${roteiroId}.${previa.blob.type.includes("mp4") ? "m4a" : "webm"}`, { type: previa.blob.type }));
    const r = await salvarGravacao(fd);
    if (!r.ok) {
      toast.error(r.error);
      return setEstado("revisar");
    }
    guardar(roteiroId, { id: r.data!.id, segundos });
    setPrevia(null);
    setEstado("parado");
    toast.success("Sua voz foi salva neste roteiro", { description: "O botão Ouvir agora toca a sua gravação." });
  };

  const apagar = async () => {
    pararTudo();
    const r = await excluirGravacao(roteiroId);
    if (!r.ok) return void toast.error(r.error);
    guardar(roteiroId, null);
    toast("Gravação apagada", { description: "O Ouvir volta a usar a voz do aparelho." });
  };

  if (estado === "gravando")
    return (
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-8 items-center gap-2 rounded-full bg-cost/15 px-3 text-12 font-medium text-cost coarse:h-10"
          role="status"
          aria-live="polite"
        >
          <span className="size-2 animate-pulse rounded-full bg-cost motion-reduce:animate-none" aria-hidden />
          Gravando <span className="font-mono tabular">{mmss(segundos)}</span>
        </span>
        <Button size="sm" variant="secondary" onClick={parar}>
          <Square strokeWidth={1.5} /> Parar
        </Button>
      </div>
    );

  if ((estado === "revisar" || estado === "salvando") && previa)
    return (
      <div className="flex w-full flex-wrap items-center gap-2 rounded-card bg-accent/50 p-2">
        <audio src={previa.url} controls className="h-9 min-w-0 flex-1 basis-48" aria-label="Prévia da sua gravação" />
        <Button size="sm" variant="primary" onClick={salvar} disabled={estado === "salvando"}>
          <Check strokeWidth={1.75} /> {estado === "salvando" ? "Salvando…" : "Salvar"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setPrevia(null);
            void comecar();
          }}
          disabled={estado === "salvando"}
        >
          <RotateCcw strokeWidth={1.5} /> Regravar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setPrevia(null);
            setEstado("parado");
          }}
          disabled={estado === "salvando"}
        >
          Descartar
        </Button>
      </div>
    );

  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="ghost" onClick={comecar} className={cn(!existente && "text-primary")}>
        <Mic strokeWidth={1.5} /> {existente ? "Regravar" : "Gravar minha voz"}
      </Button>
      {existente && (
        <button
          type="button"
          onClick={apagar}
          aria-label="Apagar minha gravação"
          title="Apagar minha gravação"
          className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover-fine:bg-muted hover-fine:text-foreground coarse:size-10"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
