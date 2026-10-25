"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { AlertTriangle, Check, ClipboardPaste, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldClass } from "@/components/ui/input";
import { adicionarLeadManual, resolverLinkMaps } from "@/app/actions";
import { qualificar } from "@/lib/prospeccao";
import { chaveLead, lerLinkMaps, type LinkMaps } from "@/lib/maps-link";
import { cn } from "@/lib/utils";
import { Medidor, Motivos, PRIORIDADE, lerNota, normNome } from "./radar-ui";

/**
 * Lead anotado à mão: para a empresa que não apareceu no mapa.
 * Cola o link do "Compartilhar" do Google Maps (ou digita o nome) e a nota que vê na ficha.
 */
export function AnotarLead({ noFunil, segmento }: { noFunil: { placeId: string; nome: string }[]; segmento: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
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
    const n = normNome(nome);
    if (!n) return null;
    const chave = link?.chave ? chaveLead({ chave: link.chave, nome }) : null;
    return noFunil.find((l) => (chave && l.placeId === chave) || normNome(l.nome) === n) ?? null;
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
      segmento,
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
    coladoRef.current?.focus({ preventScroll: true });
  };

  return (
    <form onSubmit={salvar} className="grid gap-4 md:grid-cols-2 md:gap-x-6" noValidate>
      <div className="grid content-start gap-4">
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
            placeholder="Opcional. No Maps: Compartilhar → Copiar"
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

        <div className="grid gap-2">
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
                className="flex items-center gap-1.5 overflow-hidden text-12 text-pending"
                role="status"
              >
                <AlertTriangle className="size-3.5 shrink-0" strokeWidth={1.5} /> {duplicado.nome} já está no funil.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

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
      </div>

      <div className="grid content-start gap-4">
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
        <Field label="Endereço" htmlFor="endereco" hint="Opcional">
          <Input id="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro" autoComplete="off" />
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-13 text-subtle-foreground">
          <input type="checkbox" checked={temSite} onChange={(e) => setTemSite(e.target.checked)} className="size-4 accent-[var(--primary)]" />
          Tem site próprio
        </label>

        <div className="grid gap-3 rounded-control bg-muted/60 p-4" aria-live="polite">
          {previa && p ? (
            <>
              <div className="flex items-center gap-3">
                <Medidor valor={previa.score} />
                <div className="grid gap-1">
                  <span className={cn("w-fit rounded-full px-2 py-0.5 text-12 font-medium", p.cls)}>{p.label}</span>
                  <span className="text-12 text-muted-foreground">pontos de 100 para a placa</span>
                </div>
              </div>
              <Motivos motivos={previa.motivos} score={previa.score} />
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
      </div>
    </form>
  );
}
