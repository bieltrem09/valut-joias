"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, CircleCheck, Clock, Trash2 } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { definirStatusVenda, excluirVendas } from "@/app/actions";
import { shortDate } from "@/lib/dates";
import { formatBRL } from "@/lib/format";
import type { VendaRow } from "@/lib/data/vendas";
import { EmpresaCell, Money, VendaStatus } from "./cells";

const columns: DataTableColumn<VendaRow>[] = [
  { key: "empresa", header: "Cliente", cell: (r) => <EmpresaCell nome={r.empresa} cidade={r.cidade} categoria={r.categoria} fotoUrl={r.fotoUrl} /> },
  { key: "data", header: "Data", cell: (r) => <span className="font-mono text-13 tabular text-subtle-foreground">{shortDate(r.data)}</span>, hideBelow: "sm" },
  { key: "status", header: "Status", hideBelow: "sm", cell: (r) => <VendaStatus status={r.status} /> },
  { key: "metodo", header: "Pagamento", hideBelow: "lg", cell: (r) => <span className="text-13 text-subtle-foreground">{r.metodo}</span> },
  { key: "placas", header: "Placas", numeric: true, hideBelow: "md" },
  { key: "valor", header: "Valor", numeric: true, cell: (r) => <Money value={r.valor} muted={r.status === "cancelada"} /> },
  {
    key: "lucro",
    header: "Lucro",
    numeric: true,
    hideBelow: "md",
    accessor: (r) => (r.status === "paga" ? r.lucro : 0),
    cell: (r) => (r.status === "paga" ? <Money value={r.lucro} signed /> : <span className="text-muted-foreground">—</span>),
  },
];

const ico = (C: React.ComponentType<{ className?: string; strokeWidth?: number }>) => <C className="size-4" strokeWidth={1.5} />;

export function VendasRecentes({ vendas }: { vendas: VendaRow[] }) {
  const router = useRouter();
  const mudar = async (v: VendaRow, status: VendaRow["status"], msg: string) => {
    const r = await definirStatusVenda(v.id, status);
    if (!r.ok) return toast.error(r.error);
    toast.success(msg);
    router.refresh();
  };
  const excluir = async (ids: number[], remove: (ids: Array<string | number>) => void) => {
    remove(ids);
    const r = await excluirVendas(ids);
    if (!r.ok) {
      toast.error(r.error);
      router.refresh();
      return;
    }
    toast.success(ids.length === 1 ? "Venda excluída" : `${ids.length} vendas excluídas`, { description: "As placas dessas vendas também saíram." });
    router.refresh();
  };
  return (
    <section aria-labelledby="vendas-recentes" className="grid gap-4">
      <div className="flex items-baseline justify-between">
        <h2 id="vendas-recentes" className="text-16 font-semibold tracking-[-0.01em]">
          Vendas recentes
        </h2>
        <span className="text-13 text-muted-foreground">
          <span className="font-mono tabular">{vendas.length}</span> no período
        </span>
      </div>
      <DataTable
        caption="Vendas recentes"
        className="toque"
        data={vendas}
        columns={columns}
        pageSize={6}
        searchPlaceholder="Buscar cliente"
        quickFilter={{
          key: "status",
          options: [
            { value: "paga", label: "Pagas" },
            { value: "pendente", label: "Pendentes" },
            { value: "cancelada", label: "Canceladas" },
          ],
        }}
        totals={["valor", "lucro"]}
        formatTotal={(_k, v) => formatBRL(v)}
        selectable
        rowActions={(v) => [
          ...(v.status !== "paga" ? [{ label: "Marcar como paga", icon: ico(CircleCheck), onSelect: () => mudar(v, "paga", "Venda marcada como paga") }] : []),
          ...(v.status === "paga"
            ? [{ label: "Voltar para a receber", icon: ico(Clock), onSelect: () => mudar(v, "pendente", "Venda voltou para a receber") }]
            : []),
          ...(v.status !== "cancelada" ? [{ label: "Cancelar venda", icon: ico(Ban), onSelect: () => mudar(v, "cancelada", "Venda cancelada") }] : []),
          { label: "Excluir", icon: ico(Trash2), destructive: true, separatorBefore: true, onSelect: (_r, h) => excluir([v.id], h.remove) },
        ]}
        bulkActions={[
          {
            label: "Excluir",
            icon: ico(Trash2),
            destructive: true,
            onSelect: (sel, h) =>
              excluir(
                sel.map((v) => v.id),
                h.remove,
              ),
          },
        ]}
        emptyState={<p className="text-13 text-muted-foreground">Nenhuma venda neste período. Use “Registrar venda” no topo.</p>}
      />
    </section>
  );
}
