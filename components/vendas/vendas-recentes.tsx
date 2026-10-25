"use client";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
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

export function VendasRecentes({ vendas }: { vendas: VendaRow[] }) {
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
        emptyState={<p className="text-13 text-muted-foreground">Nenhuma venda neste período.</p>}
      />
    </section>
  );
}
