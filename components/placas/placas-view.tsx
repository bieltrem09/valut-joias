"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Check, Copy, Download, Link2, Pencil, Power, Trash2, Truck } from "lucide-react";
import { DataTable, type DataTableColumn, type DataTableHelpers } from "@/components/ui/data-table";
import { StatusDot } from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { EmpresaCell, Money } from "@/components/vendas/cells";
import { addDays, mediumDate, shortDate, todaySP } from "@/lib/dates";
import { formatBRL, formatInt } from "@/lib/format";
import type { PlacaRow } from "@/lib/data/placas";
import { atualizarDestino, definirStatusPlacas, excluirPlacas, marcarEnviadas } from "@/app/actions";

/** Gráfico em pedaço separado: a página abre sem esperar a biblioteca de gráficos. */
const GraficoToques = dynamic(() => import("@/components/graficos").then((m) => m.GraficoToques), { ssr: false });

const STATUS_TONE = { Ativa: "profit", "Pendente de envio": "pending", Inativa: "neutral", Cancelada: "cost" } as const;

const ico = (C: React.ComponentType<{ className?: string; strokeWidth?: number }>) => <C className="size-4" strokeWidth={1.5} />;

export function PlacasView({ placas, baseUrl }: { placas: PlacaRow[]; baseUrl: string }) {
  const linkDa = (r: PlacaRow) => `${baseUrl}/r/${r.codigo}`;
  const router = useRouter();
  const [rows, setRows] = React.useState(placas);
  React.useEffect(() => setRows(placas), [placas]);
  const [editing, setEditing] = React.useState<PlacaRow | null>(null);

  const patch = (ids: number[], p: Partial<PlacaRow>) => setRows((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, ...p } : r)));

  const copiar = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toast.error("Não deu para copiar. Selecione o link e copie à mão.");
    }
  };

  const alternarStatus = async (row: PlacaRow) => {
    const novo = row.status === "Ativa" ? "Inativa" : "Ativa";
    patch([row.id], { status: novo });
    const r = await definirStatusPlacas([row.id], novo);
    if (!r.ok) {
      patch([row.id], { status: row.status });
      toast.error(r.error);
      return;
    }
    toast.success(novo === "Ativa" ? `${row.codigo} reativada` : `${row.codigo} desativada`, {
      description: novo === "Inativa" ? "Quem encostar o celular verá um aviso de placa pausada." : undefined,
    });
    router.refresh();
  };

  const columns: DataTableColumn<PlacaRow>[] = [
    {
      key: "codigo",
      header: "Placa",
      // Código vem primeiro: ordena por ele, mas a busca também acha pelo tipo.
      accessor: (r) => `${r.codigo} ${r.tipo}`,
      cell: (r) => (
        <div className="leading-tight">
          <p className="font-mono text-13 font-medium tabular">{r.codigo}</p>
          <p className="text-12 text-muted-foreground">{r.tipo}</p>
        </div>
      ),
    },
    {
      key: "empresa",
      header: "Cliente",
      cell: (r) => <EmpresaCell nome={r.empresa} cidade={r.cidade} categoria={r.categoria} fotoUrl={r.fotoUrl} />,
      hideBelow: "sm",
    },
    { key: "status", header: "Status", cell: (r) => <StatusDot tone={STATUS_TONE[r.status]}>{r.status}</StatusDot> },
    {
      key: "data",
      header: "Data",
      hideBelow: "lg",
      cell: (r) => <span className="font-mono text-13 tabular text-subtle-foreground">{shortDate(r.data)}</span>,
    },
    { key: "leituras", header: "Leituras", numeric: true, hideBelow: "md", cell: (r) => formatInt(r.leituras) },
    { key: "valor", header: "Valor", numeric: true, hideBelow: "md", cell: (r) => <Money value={r.valor} muted={r.status === "Cancelada"} /> },
    {
      key: "lucro",
      header: "Lucro",
      numeric: true,
      cell: (r) => (r.status === "Cancelada" ? <span className="text-muted-foreground">—</span> : <Money value={r.lucro} signed />),
    },
  ];

  return (
    <>
      <DataTable
        caption="Placas NFC vendidas"
        data={rows}
        columns={columns}
        searchPlaceholder="Buscar código, cliente ou tipo"
        quickFilter={{
          key: "status",
          options: [
            { value: "Ativa", label: "Ativas" },
            { value: "Pendente de envio", label: "Pendentes" },
            { value: "Inativa", label: "Inativas" },
            { value: "Cancelada", label: "Canceladas" },
          ],
        }}
        totals={["valor", "lucro", "leituras"]}
        formatTotal={(k, v) => (k === "leituras" ? formatInt(Math.round(v)) : formatBRL(v))}
        selectable
        pinFirstColumn
        stickyHeader
        maxHeight="70vh"
        pageSize={10}
        initialSort={{ key: "data", dir: "desc" }}
        renderDetail={(r) => <PlacaDetalhe placa={r} link={linkDa(r)} onCopy={copiar} />}
        rowActions={(r) => [
          { label: "Editar destino", icon: ico(Pencil), onSelect: () => setEditing(r) },
          { label: "Copiar link do chip", icon: ico(Link2), onSelect: () => copiar(linkDa(r)) },
          ...(r.status === "Ativa" || r.status === "Inativa"
            ? [
                {
                  label: r.status === "Ativa" ? "Desativar" : "Reativar",
                  icon: ico(Power),
                  destructive: r.status === "Ativa",
                  separatorBefore: true,
                  onSelect: () => alternarStatus(r),
                },
              ]
            : []),
        ]}
        bulkActions={[
          { label: "Exportar CSV", icon: ico(Download), onSelect: (sel) => exportarCSV(sel) },
          {
            label: "Marcar como enviadas",
            icon: ico(Truck),
            onSelect: async (sel, h) => {
              const alvo = sel.filter((r) => r.status === "Pendente de envio");
              if (!alvo.length) {
                toast("Nenhuma dessas está pendente de envio.");
                return;
              }
              patch(
                alvo.map((r) => r.id),
                { status: "Ativa", ativadaEm: todaySP() },
              );
              h.clearSelection();
              const res = await marcarEnviadas(alvo.map((r) => r.id));
              if (!res.ok) {
                toast.error(res.error);
                router.refresh();
                return;
              }
              toast.success(alvo.length === 1 ? "1 placa enviada e ativa" : `${alvo.length} placas enviadas e ativas`);
              router.refresh();
            },
          },
          { label: "Excluir", icon: ico(Trash2), destructive: true, onSelect: (sel, h) => excluir(sel, h) },
        ]}
        labels={{ noResultsHint: "Tente outro código, cliente ou status." }}
        emptyState={
          <div className="grid max-w-sm justify-items-center gap-1">
            <p className="text-14 font-medium">Nenhuma placa ainda</p>
            <p className="text-13 text-muted-foreground">Registre uma venda: cada placa ganha um código e um link próprio para gravar no chip.</p>
          </div>
        }
      />

      <EditarDestino
        placa={editing}
        onClose={() => setEditing(null)}
        onSaved={(id, url) => {
          patch([id], { destinoUrl: url });
          router.refresh();
        }}
      />
    </>
  );

  async function excluir(sel: PlacaRow[], h: DataTableHelpers) {
    const ids = sel.map((r) => r.id);
    // Sai da tela já (com a animação da tabela); se o servidor recusar, volta.
    h.remove(ids);
    const res = await excluirPlacas(ids);
    if (!res.ok) {
      toast.error(res.error);
      router.refresh();
      return;
    }
    setRows((rs) => rs.filter((r) => !ids.includes(r.id)));
    toast.success(ids.length === 1 ? `${sel[0].codigo} excluída` : `${ids.length} placas excluídas`);
    router.refresh();
  }
}

function exportarCSV(rows: PlacaRow[]) {
  const head = ["Código", "Tipo", "Cliente", "Cidade", "Status", "Data", "Leituras", "Valor", "Lucro", "Destino"];
  const num = (n: number) => n.toFixed(2).replace(".", ",");
  const esc = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = rows.map((r) =>
    [r.codigo, r.tipo, r.empresa, r.cidade, r.status, r.data.split("-").reverse().join("/"), String(r.leituras), num(r.valor), num(r.lucro), r.destinoUrl]
      .map(esc)
      .join(";"),
  );
  // ; e BOM: abre certo no Excel em pt-BR.
  const blob = new Blob(["﻿" + [head.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `placas-basik7-${todaySP()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast.success(rows.length === 1 ? "1 placa exportada" : `${rows.length} placas exportadas`);
}

function PlacaDetalhe({ placa, link, onCopy }: { placa: PlacaRow; link: string; onCopy: (url: string) => void }) {
  const [copied, setCopied] = React.useState(false);
  const today = todaySP();
  const data = placa.leituras30d.map((n, i) => ({ data: addDays(today, i - 29), n }));
  const total30 = placa.leituras30d.reduce((a, b) => a + b, 0);
  const media = total30 / 30;

  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr_1.4fr]">
      <div className="grid justify-items-start gap-2">
        <div className="rounded-control bg-white p-3 ring-1 ring-border">
          <QRCodeSVG value={link} size={112} level="M" marginSize={0} fgColor="#0b1220" bgColor="#ffffff" title={`QR code de ${placa.codigo}`} />
        </div>
        <p className="max-w-[138px] text-11 text-muted-foreground">QR do verso. Aponta para o mesmo link do chip.</p>
      </div>

      <dl className="grid content-start gap-4 text-13">
        <div>
          <dt className="text-12 text-muted-foreground">Gravar no chip</dt>
          <dd className="mt-1 flex items-center gap-2">
            <code className="min-w-0 truncate rounded-[6px] bg-muted px-2 py-1 font-mono text-12 text-foreground">{link.replace(/^https?:\/\//, "")}</code>
            <button
              type="button"
              aria-label="Copiar link do chip"
              onClick={(e) => {
                e.stopPropagation();
                onCopy(link);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1400);
              }}
              className="grid size-8 shrink-0 place-items-center rounded-[8px] text-muted-foreground transition-[transform,background-color] duration-150 hover-fine:bg-muted hover-fine:text-foreground active:scale-[0.96] coarse:size-11"
            >
              {copied ? <Check className="size-4 text-profit" strokeWidth={1.5} /> : <Copy className="size-4" strokeWidth={1.5} />}
            </button>
          </dd>
          <p className="mt-1 text-12 text-muted-foreground">Cada toque passa por aqui, é contado e segue para o destino.</p>
        </div>
        <div>
          <dt className="text-12 text-muted-foreground">Destino atual</dt>
          <dd className="mt-1">
            <a
              href={placa.destinoUrl}
              target="_blank"
              rel="noreferrer"
              className="block truncate font-mono text-12 text-foreground underline decoration-border-strong underline-offset-4 hover-fine:decoration-foreground"
            >
              {placa.destinoUrl.replace(/^https?:\/\//, "")}
            </a>
          </dd>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-12 text-muted-foreground">Custo de produção</dt>
            <dd className="mt-1 font-mono tabular">{formatBRL(placa.custoProducao)}</dd>
          </div>
          <div>
            <dt className="text-12 text-muted-foreground">Ativada em</dt>
            <dd className="mt-1 font-mono tabular">{placa.ativadaEm ? mediumDate(placa.ativadaEm) : "—"}</dd>
          </div>
          <div>
            <dt className="text-12 text-muted-foreground">Cliente</dt>
            <dd className="mt-1">{placa.empresa}</dd>
          </div>
          <div>
            <dt className="text-12 text-muted-foreground">Vendida em</dt>
            <dd className="mt-1 font-mono tabular">{mediumDate(placa.data)}</dd>
          </div>
        </div>
      </dl>

      <div className="min-w-0">
        <div className="flex items-baseline justify-between">
          <p className="text-12 text-muted-foreground">Toques nos últimos 30 dias</p>
          <p className="font-mono text-12 tabular">
            {formatInt(total30)} <span className="text-muted-foreground">· {media.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}/dia</span>
          </p>
        </div>
        {total30 === 0 ? (
          <p className="mt-6 text-13 text-muted-foreground">
            {placa.status === "Pendente de envio"
              ? "Os toques começam a contar quando a placa estiver ativa."
              : "Nenhum toque ainda. Confira se o chip foi gravado com o link acima."}
          </p>
        ) : (
          <div className="mt-3 h-28" role="img" aria-label={`${total30} leituras em 30 dias`}>
            <GraficoToques data={data} />
          </div>
        )}
        <div className="mt-1 flex justify-between font-mono text-11 text-muted-foreground">
          <span>{shortDate(data[0].data)}</span>
          <span>hoje</span>
        </div>
      </div>
    </div>
  );
}

function EditarDestino({ placa, onClose, onSaved }: { placa: PlacaRow | null; onClose: () => void; onSaved: (id: number, url: string) => void }) {
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState<string>();
  const [pending, start] = React.useTransition();
  React.useEffect(() => {
    if (placa) {
      setUrl(placa.destinoUrl);
      setError(undefined);
    }
  }, [placa]);

  return (
    <Sheet
      open={!!placa}
      onOpenChange={(o) => !o && onClose()}
      title="Editar destino"
      description={placa ? `${placa.codigo} · ${placa.empresa}. A placa física continua a mesma; só muda para onde ela leva.` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="form-destino" disabled={pending}>
            {pending ? "Salvando…" : "Salvar destino"}
          </Button>
        </>
      }
    >
      <form
        id="form-destino"
        onSubmit={(e) => {
          e.preventDefault();
          if (!placa) return;
          start(async () => {
            const r = await atualizarDestino(placa.id, url);
            if (!r.ok) {
              setError(r.error);
              return;
            }
            onSaved(placa.id, url.trim());
            toast.success("Destino atualizado");
            onClose();
          });
        }}
        className="grid gap-5"
      >
        <Field label="Link de destino" htmlFor="destino" error={error} hint="Vale na hora: o próximo toque já vai para o link novo.">
          <Input
            id="destino"
            type="url"
            inputMode="url"
            autoComplete="off"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="font-mono text-13"
            aria-invalid={!!error}
          />
        </Field>
        <p className="rounded-control bg-muted/60 p-4 text-13 text-muted-foreground">
          O chip e o QR impresso continuam os mesmos: eles apontam para o link da placa, que redireciona para o destino novo.
        </p>
      </form>
    </Sheet>
  );
}
