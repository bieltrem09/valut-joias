"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Crosshair, ExternalLink, Link2, Loader2, MapPin, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldClass } from "@/components/ui/input";
import { GridGlow } from "@/components/ui/grid-glow";
import { Orb } from "@/components/ui/orb";
import { adicionarLeadManual, resolverLinkMaps } from "@/app/actions";
import { qualificar } from "@/lib/prospeccao";
import { lerLinkMaps, urlBuscaMaps, type LinkMaps } from "@/lib/maps-link";
import { cn } from "@/lib/utils";
import { PRIORIDADE } from "./prospeccao-view";

const SEGMENTOS = ["hamburgueria", "pizzaria", "barbearia", "salão de beleza", "clínica odontológica", "pet shop", "academia", "açaí"];

/** "4,7" ou "4.7" → 4.7; vazio → null. */
const lerNota = (v: string) => {
  const n = Number(v.replace(",", ".").trim());
  return v.trim() && Number.isFinite(n) ? n : null;
};

/**
 * Prospecção sem API paga: o dono busca no Google Maps comum, escolhe a empresa
 * e cola aqui o link do "Compartilhar". A nota e as avaliações ele lê na ficha.
 */
export function ProspeccaoGuiada() {
  const router = useRouter();
  const [segmento, setSegmento] = React.useState("");
  const [local, setLocal] = React.useState("Limeira, SP");
  const [localizando, setLocalizando] = React.useState(false);
  const [abriu, setAbriu] = React.useState(false);

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

  const abrirMaps = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setAbriu(true);
  };

  const buscarCidade = () => {
    if (!segmento.trim()) return toast.error("Diga o que procurar. Ex.: hamburgueria");
    abrirMaps(urlBuscaMaps({ segmento, local }));
  };

  const buscarPerto = () => {
    if (!segmento.trim()) return toast.error("Diga o que procurar. Ex.: hamburgueria");
    if (!navigator.geolocation) return abrirMaps(urlBuscaMaps({ segmento, local }));
    // Abre a aba já, para o navegador não bloquear o pop-up depois da espera do GPS.
    const aba = window.open("about:blank", "_blank");
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocalizando(false);
        const url = urlBuscaMaps({ segmento, perto: { lat: p.coords.latitude, lng: p.coords.longitude } });
        if (aba) aba.location.href = url;
        else window.open(url, "_blank", "noopener,noreferrer");
        setAbriu(true);
      },
      () => {
        setLocalizando(false);
        aba?.close();
        toast.error("Não deu para pegar sua localização. Busquei na cidade.");
        abrirMaps(urlBuscaMaps({ segmento, local }));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

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
    toast.success(`${nome.trim()} entrou no funil`);
    limpar();
    router.refresh();
  };

  const p = previa ? PRIORIDADE[previa.prioridade] : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* 1. Buscar no Maps */}
      <section aria-labelledby="passo-1" className="surface relative flex flex-col gap-4 overflow-hidden p-5">
        <GridGlow />
        <div className="relative flex items-center gap-4">
          <Orb size={96} energia={localizando ? 1 : abriu ? 0.55 : 0.2} label={abriu ? "Busca aberta no Google Maps" : "Radar pronto"} />
          <div>
            <p className="eyebrow text-primary">Passo 1</p>
            <h2 id="passo-1" className="mt-1 text-16 font-semibold tracking-[-0.01em]">
              Procure no Google Maps
            </h2>
            <p className="mt-1 text-13 text-muted-foreground">Abre o Maps de sempre, grátis, com a busca pronta.</p>
          </div>
        </div>

        <form
          className="relative grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            buscarCidade();
          }}
        >
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" strokeWidth={1.5} />
            <input
              value={segmento}
              onChange={(e) => setSegmento(e.target.value)}
              placeholder="O que procurar? Ex.: hamburgueria"
              aria-label="Segmento"
              className={cn(fieldClass, "pl-9")}
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SEGMENTOS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSegmento(s)}
                aria-pressed={segmento === s}
                className={cn(
                  "h-7 rounded-full px-2.5 text-12 ring-1 outline-hidden transition-[color,background-color,transform] duration-150 ease-out-strong active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring coarse:h-9",
                  segmento === s ? "bg-accent text-accent-foreground ring-primary/40" : "text-muted-foreground ring-border hover-fine:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <label className="relative flex items-center">
            <MapPin className="pointer-events-none absolute left-3 size-4 text-muted-foreground" strokeWidth={1.5} />
            <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Cidade" aria-label="Cidade" className={cn(fieldClass, "pl-9")} />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="submit" variant="primary">
              <ExternalLink strokeWidth={1.5} /> Buscar na cidade
            </Button>
            <Button type="button" onClick={buscarPerto} disabled={localizando}>
              {localizando ? <Loader2 className="animate-spin motion-reduce:animate-none" strokeWidth={1.5} /> : <Crosshair strokeWidth={1.5} />}
              Perto de mim
            </Button>
          </div>
        </form>

        <ol className="relative mt-auto grid gap-1.5 rounded-control bg-muted/60 p-3 text-12 text-subtle-foreground">
          <li>
            <span className="font-medium text-foreground">No Maps:</span> procure quem tem <span className="text-foreground">nota boa e poucas avaliações</span>
            .
          </li>
          <li>
            Toque na empresa → <span className="text-foreground">Compartilhar</span> → <span className="text-foreground">Copiar</span>.
          </li>
          <li>Volte aqui e cole no passo 2.</li>
        </ol>
      </section>

      {/* 2. Colar e mandar para o funil */}
      <section aria-labelledby="passo-2" className="surface p-5">
        <p className="eyebrow text-primary">Passo 2</p>
        <h2 id="passo-2" className="mt-1 text-16 font-semibold tracking-[-0.01em]">
          Cole aqui e mande para o funil
        </h2>

        <form onSubmit={salvar} className="mt-4 grid gap-4" noValidate>
          <div className="grid gap-1.5">
            <label htmlFor="colado" className="text-13 font-medium text-subtle-foreground">
              Link ou texto do “Compartilhar”
            </label>
            <div className="relative">
              <Link2 className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" strokeWidth={1.5} />
              <textarea
                id="colado"
                value={colado}
                onChange={(e) => lerColado(e.target.value)}
                rows={2}
                placeholder="Cole aqui. Ex.: https://maps.app.goo.gl/…"
                className={cn(fieldClass, "h-auto resize-none py-2.5 pl-9 leading-snug")}
              />
            </div>
            <p className="flex items-center gap-1.5 text-12 text-muted-foreground" aria-live="polite">
              {lendo ? (
                <>
                  <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" strokeWidth={1.5} /> Lendo o link…
                </>
              ) : link?.url ? (
                <>
                  <Check className="size-3.5 text-profit" strokeWidth={2} /> Link do Google Maps guardado
                  {link.lat != null ? " com a localização" : ""}.
                </>
              ) : colado.trim() ? (
                "Não achei um link do Google Maps. Tudo bem: preencha o nome abaixo."
              ) : (
                "Opcional, mas com ele o lead abre direto no Maps depois."
              )}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome da empresa" htmlFor="nome">
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Smash Burger" autoComplete="off" />
            </Field>
            <Field label="Endereço" htmlFor="endereco" hint="Opcional">
              <Input id="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro" autoComplete="off" />
            </Field>
            <Field label="Nota no Google" htmlFor="nota" hint="A estrela da ficha. Ex.: 4,7">
              <Input id="nota" value={nota} onChange={(e) => setNota(e.target.value)} inputMode="decimal" placeholder="4,7" className="font-mono" />
            </Field>
            <Field label="Nº de avaliações" htmlFor="avaliacoes" hint="O número entre parênteses. 0 se não tiver.">
              <Input
                id="avaliacoes"
                value={avaliacoes}
                onChange={(e) => setAvaliacoes(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="38"
                className="font-mono"
              />
            </Field>
            <Field label="WhatsApp ou telefone" htmlFor="telefone" hint="Opcional. Com DDD.">
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                inputMode="tel"
                placeholder="(19) 99999-9999"
                autoComplete="off"
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-2 self-center text-13 text-subtle-foreground sm:mt-5">
              <input type="checkbox" checked={temSite} onChange={(e) => setTemSite(e.target.checked)} className="size-4 accent-[var(--primary)]" />
              Tem site próprio
            </label>
          </div>

          {/* Pontuação ao vivo: o mesmo cálculo da busca automática. */}
          <div className="grid gap-3 rounded-control bg-muted/60 p-4" aria-live="polite">
            {previa && p ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-28 leading-none font-semibold tabular">{previa.score}</span>
                  <span className="text-12 text-muted-foreground">de 100</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-12 font-medium", p.cls)}>{p.label}</span>
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
            {(colado || nome) && (
              <Button type="button" variant="ghost" onClick={limpar}>
                Limpar
              </Button>
            )}
            <Button type="submit" variant="primary" disabled={salvando}>
              {salvando ? <Loader2 className="animate-spin motion-reduce:animate-none" strokeWidth={1.5} /> : <Send strokeWidth={1.5} />}
              Mandar para o funil
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
