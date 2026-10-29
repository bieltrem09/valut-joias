"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Link as LinkIcon, Loader2, MapPin, Search } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldClass } from "@/components/ui/input";
import { criarEmpresa, lerFichaGoogle } from "@/app/actions";
import { CompanyAvatar } from "@/components/ui/company-avatar";
import type { FichaGoogle } from "@/lib/ficha-google";
import { CATEGORIAS } from "@/lib/categorias";
import { formatRating } from "@/lib/format";
import { cn } from "@/lib/utils";

type Resultado = { placeId: string; nome: string; endereco: string; categoria: string | null; rating: number | null; total: number | null };

export function AddClienteSheet({ open, onOpenChange, googleEnabled }: { open: boolean; onOpenChange: (o: boolean) => void; googleEnabled: boolean }) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Adicionar cliente"
      description={
        googleEnabled
          ? "Busque pelo nome. O Google preenche foto, nota, endereço e telefone."
          : "Cole o link do Google do estabelecimento e o resto se preenche sozinho."
      }
    >
      {googleEnabled ? <BuscaGoogle onDone={() => onOpenChange(false)} /> : <FormManual onDone={() => onOpenChange(false)} />}
    </Sheet>
  );
}

function BuscaGoogle({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Resultado[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [active, setActive] = React.useState(0);
  const [saving, setSaving] = React.useState<string | null>(null);
  const listId = React.useId();

  React.useEffect(() => {
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      setLoading(true);
      setError(undefined);
      try {
        const res = await fetch(`/api/google/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal });
        const body = (await res.json()) as { results: Resultado[]; error?: string };
        setResults(body.results);
        setActive(0);
        if (body.error) setError(body.error);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("A busca falhou. Confira a conexão.");
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [q]);

  const escolher = async (r: Resultado) => {
    setSaving(r.placeId);
    const res = await criarEmpresa({ placeId: r.placeId, nome: r.nome });
    setSaving(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`${r.nome} adicionada`, { description: "Foto e avaliações vieram do Google." });
    router.refresh();
    onDone();
  };

  return (
    <div className="grid gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(results.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter" && results[active]) {
              e.preventDefault();
              escolher(results[active]);
            }
          }}
          placeholder="Ex.: Barbearia Navalha Campinas"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-label="Nome da empresa"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
          className={cn(fieldClass, "pl-9")}
        />
        {loading && (
          <Loader2
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground motion-reduce:animate-none"
            strokeWidth={1.5}
          />
        )}
      </div>
      <p className="text-12 text-muted-foreground">Dica: nome + cidade acha mais rápido.</p>
      {error && (
        <p role="alert" className="text-13 text-destructive">
          {error}
        </p>
      )}
      <ul id={listId} role="listbox" aria-label="Resultados do Google" className="grid gap-1">
        {results.map((r, i) => (
          <li
            key={r.placeId}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseEnter={() => setActive(i)}
            onClick={() => escolher(r)}
            className={cn("flex cursor-pointer items-start gap-3 rounded-control px-3 py-3 transition-colors duration-100", i === active && "bg-muted")}
          >
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-14 font-medium">{r.nome}</p>
              <p className="truncate text-12 text-muted-foreground">{r.endereco}</p>
            </div>
            {saving === r.placeId ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" strokeWidth={1.5} />
            ) : r.rating != null ? (
              <span className="shrink-0 font-mono text-12 tabular text-subtle-foreground">
                {formatRating(r.rating)} <span className="text-muted-foreground">({r.total})</span>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {q.trim().length >= 3 && !loading && results.length === 0 && !error && (
        <p className="text-13 text-muted-foreground">Nada com esse nome. Tente incluir a cidade.</p>
      )}
    </div>
  );
}

function FormManual({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string>();
  const [ficha, setFicha] = React.useState<FichaGoogle | null>(null);
  const form = React.useRef<HTMLFormElement>(null);

  // Preenche os campos com o que veio do Google (dá para corrigir antes de salvar).
  const preencher = (f: FichaGoogle) => {
    setFicha(f);
    const campos: Record<string, string | null> = { nome: f.nome, categoria: f.categoria, cidade: f.cidade, telefone: f.telefone };
    for (const [nome, valor] of Object.entries(campos)) {
      const el = form.current?.elements.namedItem(nome);
      if (el instanceof HTMLInputElement && valor) el.value = valor;
    }
  };

  return (
    <form
      ref={form}
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        start(async () => {
          const res = await criarEmpresa({
            nome: String(f.get("nome") ?? ""),
            categoria: String(f.get("categoria") ?? ""),
            cidade: String(f.get("cidade") ?? ""),
            contatoNome: String(f.get("contatoNome") ?? ""),
            contatoCargo: String(f.get("contatoCargo") ?? ""),
            telefone: String(f.get("telefone") ?? ""),
            google: ficha
              ? {
                  placeId: ficha.placeId,
                  endereco: ficha.endereco,
                  mapsUrl: ficha.mapsUrl,
                  linkAvaliacao: ficha.linkAvaliacao,
                  rating: ficha.rating,
                  totalAvaliacoes: ficha.totalAvaliacoes,
                  fotoUrl: ficha.fotoUrl,
                }
              : undefined,
          });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          toast.success("Cliente adicionado", ficha ? { description: "Dados, nota e foto vieram do Google." } : undefined);
          router.refresh();
          onDone();
        });
      }}
    >
      <LinkGoogle ficha={ficha} onFicha={preencher} onLimpar={() => setFicha(null)} />
      <Field label="Nome da empresa" htmlFor="ac-nome">
        <Input id="ac-nome" name="nome" required autoComplete="organization" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Categoria" htmlFor="ac-cat">
          <Input id="ac-cat" name="categoria" list="ac-cats" placeholder="Barbearia" />
          <datalist id="ac-cats">
            {CATEGORIAS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Cidade" htmlFor="ac-cidade">
          <Input id="ac-cidade" name="cidade" required placeholder="Campinas" autoComplete="address-level2" />
        </Field>
        <Field label="Telefone" htmlFor="ac-tel">
          <Input id="ac-tel" name="telefone" type="tel" placeholder="(19) 99999-0000" />
        </Field>
        <Field label="Quem comprou" htmlFor="ac-contato">
          <Input id="ac-contato" name="contatoNome" placeholder="Marina Duarte" autoComplete="name" />
        </Field>
        <Field label="Cargo" htmlFor="ac-cargo">
          <Input id="ac-cargo" name="contatoCargo" placeholder="Sócia" />
        </Field>
      </div>
      {error && (
        <p role="alert" className="text-13 text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={pending} className="justify-self-end">
        {pending ? (
          "Salvando…"
        ) : (
          <>
            <Check strokeWidth={1.5} /> Adicionar
          </>
        )}
      </Button>
    </form>
  );
}

/** Cola o link do Google (Maps, Perfil da Empresa ou link de avaliação) e o painel puxa a ficha sozinho. */
function LinkGoogle({ ficha, onFicha, onLimpar }: { ficha: FichaGoogle | null; onFicha: (f: FichaGoogle) => void; onLimpar: () => void }) {
  const [link, setLink] = React.useState("");
  const [lendo, setLendo] = React.useState(false);
  const [erro, setErro] = React.useState<string>();
  const ultimo = React.useRef("");

  const ler = async (valor: string) => {
    const v = valor.trim();
    if (!/https?:\/\//i.test(v) || v === ultimo.current) return;
    ultimo.current = v;
    setLendo(true);
    setErro(undefined);
    const r = await lerFichaGoogle(v);
    setLendo(false);
    if (!r.ok) return setErro(r.error);
    if (r.data) onFicha(r.data);
  };

  return (
    <div className="grid gap-3 rounded-control bg-muted/50 p-4 ring-1 ring-border">
      <Field
        label="Link do Google do estabelecimento"
        htmlFor="ac-link"
        hint={erro ? undefined : "Cole o link do Google Maps ou do Perfil da Empresa. O painel preenche nome, categoria, cidade, telefone, nota e foto."}
        error={erro}
      >
        <div className="relative">
          <LinkIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
          <Input
            id="ac-link"
            type="url"
            inputMode="url"
            autoFocus
            value={link}
            placeholder="https://maps.app.goo.gl/…"
            onChange={(e) => setLink(e.target.value)}
            onPaste={(e) => {
              const colado = e.clipboardData.getData("text");
              if (colado) window.setTimeout(() => ler(colado), 0);
            }}
            onBlur={() => ler(link)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                ler(link);
              }
            }}
            className="pl-9 pr-9 font-mono text-13"
          />
          {lendo && (
            <Loader2
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground motion-reduce:animate-none"
              strokeWidth={1.5}
            />
          )}
        </div>
      </Field>
      {lendo && <p className="text-12 text-muted-foreground">Buscando no Google…</p>}
      {ficha && !lendo && (
        <div className="flex items-center gap-3">
          <CompanyAvatar nome={ficha.nome} categoria={ficha.categoria ?? ""} src={ficha.fotoUrl} className="size-14" rounded="rounded-[10px]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-14 font-medium">{ficha.nome}</p>
            <p className="truncate text-12 text-muted-foreground">{ficha.endereco ?? ficha.cidade}</p>
            {ficha.rating != null && (
              <p className="font-mono text-12 tabular text-subtle-foreground">
                ★ {formatRating(ficha.rating)} <span className="text-muted-foreground">({ficha.totalAvaliacoes ?? 0} avaliações)</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onLimpar();
              setLink("");
              ultimo.current = "";
            }}
            className="shrink-0 text-12 text-muted-foreground underline underline-offset-4"
          >
            Trocar
          </button>
        </div>
      )}
    </div>
  );
}
