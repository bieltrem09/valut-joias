"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUpRight, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusDot } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/input";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Money, VendaStatus } from "@/components/vendas/cells";
import { carregarDetalheEmpresa, definirBaseInstalacao, editarEmpresa, excluirEmpresa, registrarContagem } from "@/app/actions";
import type { EmpresaCardData, EmpresaDetalhe } from "@/lib/data/empresas";
import type { VendaRow } from "@/lib/data/vendas";
import { mediumDate, relativeDays, shortDate, type ISODate } from "@/lib/dates";
import { formatBRL, formatInt, formatRating } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Stars } from "./stars";

/** Gráfico em pedaço separado; o espaço fica reservado enquanto carrega. */
const CrescimentoChart = dynamic(() => import("./crescimento-chart").then((m) => m.CrescimentoChart), {
  ssr: false,
  loading: () => <div style={{ height: 220 }} aria-hidden />,
});

const vendaCols: DataTableColumn<VendaRow>[] = [
  { key: "data", header: "Data", cell: (r) => <span className="font-mono text-13 tabular">{shortDate(r.data)}</span> },
  { key: "status", header: "Status", cell: (r) => <VendaStatus status={r.status} /> },
  { key: "placas", header: "Placas", numeric: true, hideBelow: "sm" },
  { key: "valor", header: "Valor", numeric: true, cell: (r) => <Money value={r.valor} muted={r.status === "cancelada"} /> },
];

const STATUS_TONE = { Ativa: "profit", "Pendente de envio": "pending", Inativa: "neutral", Cancelada: "cost" } as const;

const parseNota = (s: string) => (s.trim() ? Number(s.replace(",", ".")) : null);

export function ClienteSheet({
  empresa,
  today,
  googleEnabled,
  onClose,
}: {
  empresa: EmpresaCardData | null;
  today: ISODate;
  googleEnabled: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  // Mantém a última empresa enquanto o painel anima a saída.
  const last = React.useRef(empresa);
  if (empresa) last.current = empresa;
  const e = empresa ?? last.current;

  const [detalhe, setDetalhe] = React.useState<EmpresaDetalhe | null>(null);
  const [editando, setEditando] = React.useState(false);

  React.useEffect(() => {
    if (!empresa) return;
    let alive = true;
    setDetalhe(null);
    setEditando(false);
    carregarDetalheEmpresa(empresa.id).then((d) => alive && setDetalhe(d));
    return () => {
      alive = false;
    };
  }, [empresa?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!e) return null;

  return (
    <Sheet
      open={!!empresa}
      onOpenChange={(o) => !o && onClose()}
      title={e.nome}
      description={[e.categoria, e.endereco ?? e.cidade].filter(Boolean).join(" · ")}
    >
      {editando ? (
        <EditarCliente
          empresa={e}
          onDone={() => {
            setEditando(false);
            router.refresh();
          }}
          onCancel={() => setEditando(false)}
          onDeleted={() => {
            onClose();
            router.refresh();
          }}
        />
      ) : (
        <div className="grid gap-8">
          <dl className="grid grid-cols-3 divide-x divide-border rounded-control ring-1 ring-border">
            <Stat label="Faturado" value={formatBRL(e.faturamento)} />
            <Stat label="Placas" value={formatInt(e.placasCompradas)} />
            <Stat label="Cliente desde" value={shortDate(e.criadaEm)} />
          </dl>

          <Crescimento empresa={e} today={today} googleEnabled={googleEnabled} onChange={() => router.refresh()} />

          <section aria-labelledby="sh-compras" className="grid gap-3">
            <h3 id="sh-compras" className="text-14 font-semibold">
              Histórico de compras
            </h3>
            {detalhe ? (
              detalhe.vendas.length ? (
                <DataTable
                  caption={`Compras de ${e.nome}`}
                  data={detalhe.vendas}
                  columns={vendaCols}
                  variant="minimal"
                  search={false}
                  pageSize={5}
                  totals={["valor"]}
                  formatTotal={(_k, v) => formatBRL(v)}
                />
              ) : (
                <p className="text-13 text-muted-foreground">Nenhuma compra registrada.</p>
              )
            ) : (
              <ListSkeleton rows={2} />
            )}
          </section>

          {detalhe && detalhe.placas.length > 0 && (
            <section aria-labelledby="sh-placas" className="grid gap-3">
              <h3 id="sh-placas" className="text-14 font-semibold">
                Placas
              </h3>
              <ul className="divide-y divide-border rounded-control ring-1 ring-border">
                {detalhe.placas.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-mono text-13 font-medium tabular">{p.codigo}</p>
                      <p className="text-12 text-muted-foreground">{p.tipo}</p>
                    </div>
                    <div className="text-right">
                      <StatusDot tone={STATUS_TONE[p.status]}>{p.status}</StatusDot>
                      <p className="mt-0.5 font-mono text-11 text-muted-foreground tabular">
                        {formatInt(p.leituras)} {p.leituras === 1 ? "toque" : "toques"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {detalhe && detalhe.reviews.length > 0 && (
            <section aria-labelledby="sh-reviews" className="grid gap-3">
              <h3 id="sh-reviews" className="text-14 font-semibold">
                Avaliações recentes no Google
              </h3>
              <ul className="grid gap-4">
                {detalhe.reviews.map((r) => (
                  <li key={r.id} className="grid gap-1.5">
                    <div className="flex items-center gap-2 text-12">
                      <span className="font-medium text-foreground">{r.autor}</span>
                      <Stars value={r.nota} />
                      <span className="font-mono text-11 text-muted-foreground">{mediumDate(r.data)}</span>
                    </div>
                    {r.texto && <p className="text-13 leading-relaxed text-subtle-foreground">{r.texto}</p>}
                  </li>
                ))}
              </ul>
              <p className="text-11 text-muted-foreground">Dados: Google</p>
            </section>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 pb-2">
            {e.mapsUrl ? (
              <a
                href={e.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-13 font-medium text-subtle-foreground underline-offset-4 hover-fine:text-foreground hover-fine:underline"
              >
                Ver no Maps <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
              </a>
            ) : (
              <span />
            )}
            <Button size="sm" onClick={() => setEditando(true)}>
              <Pencil strokeWidth={1.5} /> Editar dados
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */

function Crescimento({
  empresa: e,
  today,
  googleEnabled,
  onChange,
}: {
  empresa: EmpresaCardData;
  today: ISODate;
  googleEnabled: boolean;
  onChange: () => void;
}) {
  const c = e.crescimento;
  const [refreshing, setRefreshing] = React.useState(false);
  const [anotando, setAnotando] = React.useState(false);
  const podeGoogle = googleEnabled && e.vinculadaAoGoogle;

  const atualizar = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/google/refresh/${e.id}`, { method: "POST" });
      const body = (await res.json()) as { ok: boolean; error?: string };
      if (!body.ok) throw new Error(body.error);
      toast.success("Medição feita agora");
      onChange();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Não deu para medir agora.");
    } finally {
      setRefreshing(false);
    }
  };

  const multiplicador = c.ritmoAntes && c.ritmoDepois && c.ritmoAntes > 0 ? c.ritmoDepois / c.ritmoAntes : null;

  return (
    <section aria-labelledby="sh-cres" className="grid gap-4 rounded-card p-5 ring-1 ring-border">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="sh-cres" className="eyebrow text-primary">
            Crescimento no Google
          </h3>
          <Manchete c={c} />
        </div>
        {podeGoogle && (
          <Button size="sm" variant="ghost" onClick={atualizar} disabled={refreshing} aria-label="Medir agora no Google" title="Medir agora no Google">
            <RefreshCw strokeWidth={1.5} className={refreshing ? "animate-spin motion-reduce:animate-none" : undefined} />
            <span className="hidden sm:inline">{refreshing ? "Medindo…" : "Medir agora"}</span>
          </Button>
        )}
      </div>

      {c.medicoes.length >= 2 ? (
        <CrescimentoChart c={c} />
      ) : c.medicoes.length === 1 ? (
        <p className="rounded-control bg-muted/60 px-4 py-3 text-13 text-muted-foreground">
          Primeira medição em {shortDate(c.medicoes[0].data)}: <span className="font-mono text-foreground tabular">{formatInt(c.medicoes[0].total)}</span>{" "}
          avaliações. A linha aparece a partir da segunda{podeGoogle ? ", que o painel faz sozinho amanhã" : ""}.
        </p>
      ) : null}

      {(c.notaAtual != null || c.ritmoDepois != null) && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {c.notaAtual != null && (
            <Mini label="Nota">
              {c.notaNaInstalacao != null && c.notaNaInstalacao !== c.notaAtual && (
                <span className="text-muted-foreground">{formatRating(c.notaNaInstalacao)} → </span>
              )}
              {formatRating(c.notaAtual)}
            </Mini>
          )}
          {c.ritmoDepois != null && <Mini label="Por semana, com placa">{c.ritmoDepois.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</Mini>}
          {c.ritmoAntes != null && (
            <Mini label="Por semana, antes">
              {c.ritmoAntes.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
              {multiplicador && multiplicador > 1.05 && (
                <span className="ml-1.5 text-12 text-profit">×{multiplicador.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</span>
              )}
            </Mini>
          )}
        </dl>
      )}

      {c.instalacao && (c.base == null || c.baseDepoisDaPlaca) && <BaseForm empresaId={e.id} instalacao={c.instalacao} onSaved={onChange} />}

      <div className="flex flex-wrap items-center justify-between gap-2 text-12 text-muted-foreground">
        <span>
          {c.atual
            ? `${c.medicoes.length} ${c.medicoes.length === 1 ? "medição" : "medições"} · última ${relativeDays(c.atual.data, today)} (${c.atual.fonte === "google" ? "Google" : "anotada"})`
            : podeGoogle
              ? "A primeira medição sai na próxima atualização."
              : "Sem medições ainda."}
        </span>
        {!anotando && (
          <button type="button" onClick={() => setAnotando(true)} className="font-medium text-primary underline-offset-4 hover-fine:underline">
            Anotar contagem de hoje
          </button>
        )}
      </div>

      {anotando && (
        <ContagemForm
          empresaId={e.id}
          onDone={(ok) => {
            setAnotando(false);
            if (ok) onChange();
          }}
        />
      )}

      {!podeGoogle && (
        <p className="text-12 text-muted-foreground">
          {googleEnabled
            ? "Esta empresa foi cadastrada à mão. Para medir sozinho todo dia, cadastre-a de novo pela busca do Google."
            : "Sem a chave do Google, as medições são as que você anotar. Com a chave, o painel mede sozinho todo dia."}
        </p>
      )}
    </section>
  );
}

function Manchete({ c }: { c: EmpresaCardData["crescimento"] }) {
  if (c.ganho != null && c.instalacao) {
    return (
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
        <span className="font-mono text-28 font-medium tracking-[-0.02em] text-profit tabular">+{formatInt(c.ganho)}</span>
        <span className="text-13 text-subtle-foreground">
          {c.ganho === 1 ? "avaliação" : "avaliações"}{" "}
          {c.baseDepoisDaPlaca && c.baseOrigem?.tipo === "medicao"
            ? `desde ${shortDate(c.baseOrigem.data)}, a primeira medição com a placa (no mínimo)`
            : `desde a placa, em ${c.diasDesde === 0 ? "menos de um dia" : `${c.diasDesde} ${c.diasDesde === 1 ? "dia" : "dias"}`}`}
        </span>
      </p>
    );
  }
  if (c.instalacao && c.base != null) {
    return (
      <p className="mt-2 text-14 text-subtle-foreground">
        Placa ativa desde {shortDate(c.instalacao)}, com {formatInt(c.base)} avaliações. A próxima medição mostra o ganho.
      </p>
    );
  }
  if (c.instalacao)
    return <p className="mt-2 text-14 text-subtle-foreground">Placa ativa desde {shortDate(c.instalacao)}. Falta saber quantas avaliações havia nesse dia.</p>;
  if (c.atual)
    return (
      <p className="mt-2 text-14 text-subtle-foreground">
        <span className="font-mono text-foreground tabular">{formatInt(c.atual.total)}</span> avaliações hoje. Ative uma placa de Avaliação Google e o ganho
        começa a contar.
      </p>
    );
  return <p className="mt-2 text-14 text-subtle-foreground">Sem placa de Avaliação Google ativa ainda.</p>;
}

function BaseForm({ empresaId, instalacao, onSaved }: { empresaId: number; instalacao: ISODate; onSaved: () => void }) {
  const [v, setV] = React.useState("");
  const [pending, start] = React.useTransition();
  return (
    <form
      className="grid gap-2 rounded-control bg-pending-soft p-4"
      onSubmit={(ev) => {
        ev.preventDefault();
        start(async () => {
          const r = await definirBaseInstalacao(empresaId, Number(v));
          if (!r.ok) return void toast.error(r.error);
          toast.success("Base registrada");
          onSaved();
        });
      }}
    >
      <label htmlFor="base-inst" className="text-13 text-foreground">
        Quantas avaliações a empresa tinha em {shortDate(instalacao)}, quando a placa foi instalada?
      </label>
      <div className="flex gap-2">
        <Input
          id="base-inst"
          inputMode="numeric"
          value={v}
          onChange={(ev) => setV(ev.target.value.replace(/\D/g, ""))}
          placeholder="Ex.: 212"
          className="h-9 w-32 font-mono tabular"
          required
        />
        <Button type="submit" size="sm" variant="primary" disabled={pending || !v}>
          Salvar
        </Button>
      </div>
      <p className="text-12 text-muted-foreground">Só preencha se você anotou. Sem esse número, o ganho conta a partir da primeira medição depois da placa.</p>
    </form>
  );
}

function ContagemForm({ empresaId, onDone }: { empresaId: number; onDone: (ok: boolean) => void }) {
  const [total, setTotal] = React.useState("");
  const [nota, setNota] = React.useState("");
  const [pending, start] = React.useTransition();
  return (
    <form
      className="grid gap-3 rounded-control bg-muted/60 p-4"
      onSubmit={(ev) => {
        ev.preventDefault();
        start(async () => {
          const r = await registrarContagem(empresaId, Number(total), parseNota(nota));
          if (!r.ok) return void toast.error(r.error);
          toast.success("Contagem anotada");
          onDone(true);
        });
      }}
    >
      <p className="text-13">Abra o perfil da empresa no Google e copie os números de hoje.</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Avaliações" htmlFor="ct-total">
          <Input
            id="ct-total"
            inputMode="numeric"
            value={total}
            onChange={(ev) => setTotal(ev.target.value.replace(/\D/g, ""))}
            placeholder="Ex.: 318"
            className="font-mono tabular"
            required
          />
        </Field>
        <Field label="Nota" htmlFor="ct-nota">
          <Input
            id="ct-nota"
            inputMode="decimal"
            value={nota}
            onChange={(ev) => setNota(ev.target.value)}
            placeholder="Ex.: 4,7"
            className="font-mono tabular"
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => onDone(false)}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" variant="primary" disabled={pending || !total}>
          Anotar
        </Button>
      </div>
    </form>
  );
}

function EditarCliente({
  empresa: e,
  onDone,
  onCancel,
  onDeleted,
}: {
  empresa: EmpresaCardData;
  onDone: () => void;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string>();
  const [confirmar, setConfirmar] = React.useState(false);

  React.useEffect(() => {
    if (!confirmar) return;
    const t = window.setTimeout(() => setConfirmar(false), 4000);
    return () => window.clearTimeout(t);
  }, [confirmar]);

  return (
    <form
      className="grid gap-5"
      onSubmit={(ev) => {
        ev.preventDefault();
        const f = new FormData(ev.currentTarget);
        start(async () => {
          const r = await editarEmpresa(e.id, {
            nome: String(f.get("nome") ?? ""),
            categoria: String(f.get("categoria") ?? ""),
            cidade: String(f.get("cidade") ?? ""),
            contatoNome: String(f.get("contatoNome") ?? ""),
            contatoCargo: String(f.get("contatoCargo") ?? ""),
            telefone: String(f.get("telefone") ?? ""),
          });
          if (!r.ok) return setError(r.error);
          toast.success("Dados salvos");
          onDone();
        });
      }}
    >
      <Field label="Nome" htmlFor="ed-nome">
        <Input id="ed-nome" name="nome" defaultValue={e.nome} required />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Categoria" htmlFor="ed-cat">
          <Input id="ed-cat" name="categoria" defaultValue={e.categoria} />
        </Field>
        <Field label="Cidade" htmlFor="ed-cidade">
          <Input id="ed-cidade" name="cidade" defaultValue={e.cidade} required />
        </Field>
        <Field label="Quem comprou" htmlFor="ed-contato">
          <Input id="ed-contato" name="contatoNome" defaultValue={e.contatoNome ?? ""} />
        </Field>
        <Field label="Cargo" htmlFor="ed-cargo">
          <Input id="ed-cargo" name="contatoCargo" defaultValue={e.contatoCargo ?? ""} />
        </Field>
        <Field label="Telefone" htmlFor="ed-tel">
          <Input id="ed-tel" name="telefone" type="tel" defaultValue={e.telefone ?? ""} />
        </Field>
      </div>
      {error && (
        <p role="alert" className="text-13 text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn("text-destructive hover-fine:bg-cost-soft hover-fine:text-destructive", confirmar && "bg-cost-soft")}
          disabled={pending}
          onClick={() => {
            if (!confirmar) return setConfirmar(true);
            start(async () => {
              const r = await excluirEmpresa(e.id);
              if (!r.ok) return void toast.error(r.error);
              toast.success(`${e.nome} excluída`, { description: "Vendas, placas e medições dela também saíram." });
              onDeleted();
            });
          }}
        >
          <Trash2 strokeWidth={1.5} />
          {confirmar ? "Toque de novo para excluir tudo" : "Excluir cliente"}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={pending}>
            Salvar
          </Button>
        </div>
      </div>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <dt className="text-12 text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate font-mono text-14 font-medium tabular">{value}</dd>
    </div>
  );
}

function Mini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-control bg-muted/60 px-3 py-2.5">
      <dt className="text-11 text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-mono text-16 font-medium tabular">{children}</dd>
    </div>
  );
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="grid gap-2" aria-busy aria-label="Carregando">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 rounded-control px-4 py-3 ring-1 ring-border">
          <div className="grid gap-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2.5 w-28" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
