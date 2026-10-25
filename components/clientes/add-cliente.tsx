"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, MapPin, Search } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldClass } from "@/components/ui/input";
import { criarEmpresa } from "@/app/actions";
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
          : "Sem a chave do Google, preencha à mão. Dá para vincular depois."
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

  return (
    <form
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
          });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          toast.success("Cliente adicionado");
          router.refresh();
          onDone();
        });
      }}
    >
      <Field label="Nome da empresa" htmlFor="ac-nome">
        <Input id="ac-nome" name="nome" required autoFocus autoComplete="organization" />
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
