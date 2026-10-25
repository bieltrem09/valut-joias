"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusDot } from "@/components/ui/chip";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Money, VendaStatus } from "@/components/vendas/cells";
import { carregarDetalheEmpresa } from "@/app/actions";
import type { EmpresaCardData, EmpresaDetalhe } from "@/lib/data/empresas";
import type { VendaRow } from "@/lib/data/vendas";
import { mediumDate, relativeDays, shortDate, type ISODate } from "@/lib/dates";
import { formatBRL, formatInt } from "@/lib/format";
import { Rating, Stars } from "./stars";

const vendaCols: DataTableColumn<VendaRow>[] = [
  { key: "data", header: "Data", cell: (r) => <span className="font-mono text-13 tabular">{shortDate(r.data)}</span> },
  { key: "status", header: "Status", cell: (r) => <VendaStatus status={r.status} /> },
  { key: "placas", header: "Placas", numeric: true, hideBelow: "sm" },
  { key: "valor", header: "Valor", numeric: true, cell: (r) => <Money value={r.valor} muted={r.status === "cancelada"} /> },
];

const STATUS_TONE = { Ativa: "profit", "Pendente de envio": "pending", Inativa: "neutral", Cancelada: "cost" } as const;

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
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (!empresa) return;
    let alive = true;
    setDetalhe(null);
    carregarDetalheEmpresa(empresa.id).then((d) => alive && setDetalhe(d));
    return () => {
      alive = false;
    };
  }, [empresa]);

  const atualizar = async () => {
    if (!e) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/google/refresh/${e.id}`, { method: "POST" });
      const body = (await res.json()) as { ok: boolean; error?: string };
      if (!body.ok) throw new Error(body.error);
      toast.success("Dados do Google atualizados");
      router.refresh();
      setDetalhe(await carregarDetalheEmpresa(e.id));
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Não deu para atualizar agora.");
    } finally {
      setRefreshing(false);
    }
  };

  if (!e) return null;

  return (
    <Sheet open={!!empresa} onOpenChange={(o) => !o && onClose()} title={e.nome} description={`${e.categoria} · ${e.endereco ?? e.cidade}`}>
      <div className="grid gap-8">
        <dl className="grid grid-cols-3 divide-x divide-border rounded-control ring-1 ring-border">
          <Stat label="Faturado" value={formatBRL(e.faturamento)} />
          <Stat label="Placas" value={formatInt(e.placasCompradas)} />
          <Stat label="Cliente desde" value={shortDate(e.criadaEm)} />
        </dl>

        <section aria-labelledby="sh-google" className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h3 id="sh-google" className="text-14 font-semibold">
              No Google
            </h3>
            <Button
              size="sm"
              onClick={atualizar}
              disabled={refreshing || !googleEnabled || !e.vinculadaAoGoogle}
              title={!googleEnabled ? "Configure GOOGLE_PLACES_API_KEY para atualizar" : !e.vinculadaAoGoogle ? "Empresa sem vínculo com o Google" : undefined}
            >
              <RefreshCw strokeWidth={1.5} className={refreshing ? "animate-spin motion-reduce:animate-none" : undefined} />
              {refreshing ? "Atualizando…" : "Atualizar dados do Google"}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Rating rating={e.rating} total={e.totalAvaliacoes} />
            {e.deltaAvaliacoes != null && e.googleDesde && (
              <span className="text-13 text-muted-foreground">
                <span className="font-mono font-medium text-profit tabular">+{e.deltaAvaliacoes}</span> desde que a placa foi ativada, em{" "}
                {shortDate(e.googleDesde)}
              </span>
            )}
          </div>
          {detalhe && detalhe.historico.length > 1 && <HistoricoAvaliacoes pontos={detalhe.historico} desde={e.googleDesde} />}
          <p className="text-12 text-muted-foreground">
            {e.refreshedAt
              ? `Atualizado ${relativeDays(e.refreshedAt.slice(0, 10), today)}.`
              : !googleEnabled
                ? "Dados de exemplo. Com a chave do Google, isso vem direto do perfil da empresa."
                : "Ainda não sincronizado."}{" "}
            Dados: Google.
            {e.mapsUrl && (
              <>
                {" "}
                <a
                  href={e.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 font-medium text-subtle-foreground underline-offset-4 hover-fine:text-foreground hover-fine:underline"
                >
                  Ver no Maps <ArrowUpRight className="size-3" strokeWidth={1.5} />
                </a>
              </>
            )}
          </p>
        </section>

        <section aria-labelledby="sh-compras" className="grid gap-3">
          <h3 id="sh-compras" className="text-14 font-semibold">
            Histórico de compras
          </h3>
          {detalhe ? (
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
            <ListSkeleton rows={3} />
          )}
        </section>

        <section aria-labelledby="sh-placas" className="grid gap-3">
          <h3 id="sh-placas" className="text-14 font-semibold">
            Placas
          </h3>
          {detalhe ? (
            <ul className="divide-y divide-border rounded-control ring-1 ring-border">
              {detalhe.placas.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-mono text-13 font-medium tabular">{p.codigo}</p>
                    <p className="text-12 text-muted-foreground">{p.tipo}</p>
                  </div>
                  <div className="text-right">
                    <StatusDot tone={STATUS_TONE[p.status]}>{p.status}</StatusDot>
                    <p className="mt-0.5 font-mono text-11 text-muted-foreground tabular">{formatInt(p.leituras)} leituras</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ListSkeleton rows={2} />
          )}
        </section>

        <section aria-labelledby="sh-reviews" className="grid gap-3 pb-2">
          <h3 id="sh-reviews" className="text-14 font-semibold">
            Avaliações recentes
          </h3>
          {detalhe ? (
            detalhe.reviews.length ? (
              <ul className="grid gap-4">
                {detalhe.reviews.map((r) => (
                  <li key={r.id} className="grid gap-1.5">
                    <div className="flex items-center gap-2 text-12">
                      <span className="font-medium text-foreground">{r.autor}</span>
                      <Stars value={r.nota} />
                      <span className="font-mono text-11 text-muted-foreground">{mediumDate(r.data)}</span>
                    </div>
                    <p className="text-13 leading-relaxed text-subtle-foreground">{r.texto}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-13 text-muted-foreground">Nenhuma avaliação com texto ainda.</p>
            )
          ) : (
            <ListSkeleton rows={2} />
          )}
        </section>
      </div>
    </Sheet>
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

/** Linha do total de avaliações; a marca vertical é a ativação da placa. */
function HistoricoAvaliacoes({ pontos, desde }: { pontos: { data: string; total: number }[]; desde: string | null }) {
  const w = 480;
  const h = 64;
  const min = Math.min(...pontos.map((p) => p.total));
  const max = Math.max(...pontos.map((p) => p.total));
  const span = max - min || 1;
  const x = (i: number) => (i / (pontos.length - 1)) * w;
  const y = (v: number) => h - 4 - ((v - min) / span) * (h - 8);
  const d = pontos.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.total).toFixed(1)}`).join(" ");
  const idx = desde ? pontos.findIndex((p) => p.data >= desde) : -1;
  return (
    <figure className="grid gap-1">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-16 w-full overflow-visible"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Avaliações foram de ${min} para ${max}.`}
      >
        {idx > 0 && <line x1={x(idx)} x2={x(idx)} y1={0} y2={h} stroke="var(--border-strong)" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />}
        <path d={d} fill="none" stroke="var(--chart-2)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <figcaption className="flex justify-between font-mono text-11 text-muted-foreground">
        <span>{shortDate(pontos[0].data)}</span>
        {idx > 0 && <span>placa instalada</span>}
        <span>hoje</span>
      </figcaption>
    </figure>
  );
}
