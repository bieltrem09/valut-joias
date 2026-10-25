"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Field, Input } from "@/components/ui/input";
import { RollingNumber } from "@/components/ui/rolling-number";
import { GridGlow } from "@/components/ui/grid-glow";
import { criarDespesa, excluirDespesas } from "@/app/actions";
import type { DespesaRow } from "@/lib/data/despesas";
import type { DespesaCategoria } from "@/lib/db/schema";
import { mediumDate, shortDate, todaySP } from "@/lib/dates";
import { formatBRL, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

const CATS: DespesaCategoria[] = ["Anúncios", "Ferramentas", "Frete", "Taxas", "Outros"];
// Ordem fixa: a cor segue a categoria, nunca o ranking.
const CAT_COLOR: Record<DespesaCategoria, string> = {
  Anúncios: "var(--cat-1)",
  Ferramentas: "var(--cat-2)",
  Frete: "var(--cat-3)",
  Taxas: "var(--cat-4)",
  Outros: "var(--cat-5)",
};

export function DespesasView({
  despesas,
  periodo,
  lucroLiquido,
  receita,
  taxasDeVenda,
}: {
  despesas: DespesaRow[];
  periodo: { de: string; ate: string; frase: string };
  lucroLiquido: number;
  receita: number;
  taxasDeVenda: number;
}) {
  const router = useRouter();
  const [rows, setRows] = React.useState(despesas);
  const [delta, setDelta] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  // Dados novos do servidor já incluem o que foi registrado: zera o otimismo.
  React.useEffect(() => {
    setRows(despesas);
    setDelta(0);
  }, [despesas, lucroLiquido]);

  const total = rows.reduce((a, d) => a + d.valor, 0);
  const porCat = CATS.map((c) => ({ categoria: c, valor: rows.filter((d) => d.categoria === c).reduce((a, d) => a + d.valor, 0) })).filter((c) => c.valor > 0);

  const registrar = async (input: { descricao: string; categoria: DespesaCategoria; valor: number; data: string }) => {
    const dentro = input.data >= periodo.de && input.data <= periodo.ate;
    const tempId = -Date.now();
    if (dentro) {
      setRows((r) => [{ id: tempId, ...input }, ...r]);
      setDelta((d) => d - input.valor);
    }
    const res = await criarDespesa(input);
    if (!res.ok) {
      setRows((r) => r.filter((d) => d.id !== tempId));
      if (dentro) setDelta((d) => d + input.valor);
      toast.error(res.error);
      return false;
    }
    toast.success("Despesa registrada", { description: dentro ? undefined : `Lançada em ${shortDate(input.data)}, fora do período que você está vendo.` });
    router.refresh();
    return true;
  };

  const excluir = async (ids: number[], remove: (ids: Array<string | number>) => void) => {
    const removidas = rows.filter((r) => ids.includes(r.id));
    remove(ids);
    const soma = removidas.reduce((a, d) => a + d.valor, 0);
    setDelta((d) => d + soma);
    const res = await excluirDespesas(ids);
    if (!res.ok) {
      setDelta((d) => d - soma);
      toast.error(res.error);
      router.refresh();
      return;
    }
    toast.success(ids.length === 1 ? "Despesa excluída" : `${ids.length} despesas excluídas`);
    router.refresh();
  };

  const columns: DataTableColumn<DespesaRow>[] = [
    {
      key: "descricao",
      header: "Descrição",
      cell: (d) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="size-2 shrink-0 rounded-full" style={{ background: CAT_COLOR[d.categoria] }} aria-hidden />
          <div className="min-w-0 leading-tight">
            <p className={cn("max-w-[320px] truncate text-14", d.id < 0 && "text-muted-foreground")}>{d.descricao}</p>
            <p className="text-12 text-muted-foreground sm:hidden">{d.categoria}</p>
          </div>
        </div>
      ),
    },
    { key: "categoria", header: "Categoria", hideBelow: "sm", cell: (d) => <span className="text-13 text-subtle-foreground">{d.categoria}</span> },
    { key: "data", header: "Data", cell: (d) => <span className="font-mono text-13 tabular text-subtle-foreground">{shortDate(d.data)}</span> },
    { key: "valor", header: "Valor", numeric: true, cell: (d) => formatBRL(d.valor) },
  ];

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="order-2 min-w-0 lg:order-1 lg:col-span-8">
          <DataTable
            caption="Despesas do período"
            variant="minimal"
            data={rows}
            columns={columns}
            pageSize={12}
            selectable
            initialSort={{ key: "data", dir: "desc" }}
            searchPlaceholder="Buscar despesa"
            quickFilter={{ key: "categoria", options: CATS.map((c) => ({ value: c, label: c })) }}
            totals={["valor"]}
            formatTotal={(_k, v) => formatBRL(v)}
            rowActions={(d) => [
              { label: "Excluir", destructive: true, icon: <Trash2 className="size-4" strokeWidth={1.5} />, onSelect: (_r, h) => excluir([d.id], h.remove) },
            ]}
            bulkActions={[
              {
                label: "Excluir",
                destructive: true,
                icon: <Trash2 className="size-4" strokeWidth={1.5} />,
                onSelect: (sel, h) =>
                  excluir(
                    sel.map((s) => s.id),
                    h.remove,
                  ),
              },
            ]}
            emptyState={
              <div className="relative grid justify-items-center gap-1 overflow-hidden px-10 py-6">
                <GridGlow />
                <p className="relative text-14 font-medium">Nenhum gasto {periodo.frase}</p>
                <p className="relative text-13 text-muted-foreground">Registre anúncio, frete ou ferramenta e o lucro se ajusta sozinho.</p>
              </div>
            }
            toolbarEnd={
              <Button variant="primary" onClick={() => setOpen(true)} className="shrink-0">
                <Plus strokeWidth={1.5} />
                <span className="hidden sm:inline">Registrar despesa</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            }
          />
        </div>

        <aside className="order-1 grid content-start gap-4 lg:order-2 lg:col-span-4">
          <section className="surface p-6" aria-labelledby="lucro-vivo">
            <h2 id="lucro-vivo" className="text-13 text-muted-foreground">
              Lucro líquido {periodo.frase}
            </h2>
            <p className={cn("mt-2 font-mono text-28 font-medium tracking-[-0.02em] tabular", lucroLiquido + delta < 0 && "text-cost")}>
              <RollingNumber value={lucroLiquido + delta} format={formatBRL} />
            </p>
            <p className="mt-1 text-12 text-muted-foreground">Já descontado tudo o que está ao lado.</p>
          </section>

          <section className="surface p-6" aria-labelledby="por-categoria">
            <div className="flex items-baseline justify-between">
              <h2 id="por-categoria" className="text-14 font-semibold">
                Por categoria
              </h2>
              {receita > 0 && <span className="text-12 text-muted-foreground">{formatPct(total / receita)} da receita</span>}
            </div>
            {porCat.length === 0 ? (
              <p className="mt-4 text-13 text-muted-foreground">Sem gastos para dividir.</p>
            ) : (
              <>
                <div className="relative mx-auto mt-4 aspect-square w-full max-w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={porCat}
                        dataKey="valor"
                        nameKey="categoria"
                        innerRadius="84%"
                        outerRadius="100%"
                        paddingAngle={2}
                        cornerRadius={4}
                        stroke="var(--card)"
                        strokeWidth={2}
                        startAngle={90}
                        endAngle={-270}
                        isAnimationActive={false}
                      >
                        {porCat.map((c) => (
                          <Cell key={c.categoria} fill={CAT_COLOR[c.categoria]} />
                        ))}
                      </Pie>
                      <Tooltip
                        isAnimationActive={false}
                        content={({ active, payload }) => {
                          const p = payload?.[0]?.payload as { categoria: string; valor: number } | undefined;
                          if (!active || !p) return null;
                          return (
                            <div className="rounded-[8px] bg-popover px-2.5 py-1.5 text-12 shadow-pop ring-1 ring-border">
                              {p.categoria} · <span className="font-mono tabular">{formatBRL(p.valor)}</span>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    <div>
                      <p className="text-12 text-muted-foreground">Total</p>
                      <p className="font-mono text-16 font-medium tabular">
                        <RollingNumber value={total} format={formatBRL} />
                      </p>
                    </div>
                  </div>
                </div>
                <ul className="mt-5 grid gap-2.5">
                  {porCat
                    .slice()
                    .sort((a, b) => b.valor - a.valor)
                    .map((c) => (
                      <li key={c.categoria} className="grid grid-cols-[10px_1fr_auto_44px] items-center gap-2.5 text-13">
                        <span className="size-2.5 rounded-[3px]" style={{ background: CAT_COLOR[c.categoria] }} aria-hidden />
                        <span>{c.categoria}</span>
                        <span className="font-mono tabular">{formatBRL(c.valor)}</span>
                        <span className="text-right font-mono text-12 tabular text-muted-foreground">{Math.round((c.valor / total) * 100)}%</span>
                      </li>
                    ))}
                </ul>
                {taxasDeVenda > 0 && (
                  <p className="mt-4 border-t border-border pt-3 text-12 text-muted-foreground">
                    + <span className="font-mono tabular">{formatBRL(taxasDeVenda)}</span> em taxas de cartão e boleto, descontadas direto das vendas.
                  </p>
                )}
              </>
            )}
          </section>
        </aside>
      </div>

      <NovaDespesa open={open} onOpenChange={setOpen} onSubmit={registrar} />
    </>
  );
}

/** "1.234,56" ou "1234.56" → 1234.56 */
function parseValor(s: string) {
  const t = s.replace(/[^\d,.-]/g, "");
  const norm = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  return Number(norm);
}

function NovaDespesa({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (d: { descricao: string; categoria: DespesaCategoria; valor: number; data: string }) => Promise<boolean>;
}) {
  const today = todaySP();
  const [categoria, setCategoria] = React.useState<DespesaCategoria>("Anúncios");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar despesa"
      description="Entra no lucro na hora."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="form-despesa" disabled={pending}>
            Registrar
          </Button>
        </>
      }
    >
      <form
        id="form-despesa"
        ref={formRef}
        noValidate
        className="grid gap-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const descricao = String(f.get("descricao") ?? "").trim();
          const valor = parseValor(String(f.get("valor") ?? ""));
          const data = String(f.get("data") ?? today);
          const errs: Record<string, string> = {};
          if (!descricao) errs.descricao = "Diga com o que foi o gasto.";
          if (!Number.isFinite(valor) || valor <= 0) errs.valor = "Use um valor maior que zero, como 89,90.";
          if (!data || data > today) errs.data = "Use hoje ou uma data anterior.";
          setErrors(errs);
          if (Object.keys(errs).length) return;
          // Fecha já: o número do lucro rola enquanto o servidor confirma.
          setPending(true);
          onOpenChange(false);
          const ok = await onSubmit({ descricao, categoria, valor, data });
          setPending(false);
          if (ok) formRef.current?.reset();
        }}
      >
        <Field label="Descrição" htmlFor="d-desc" error={errors.descricao}>
          <Input id="d-desc" name="descricao" placeholder="Meta Ads · campanha de outubro" autoComplete="off" aria-invalid={!!errors.descricao} />
        </Field>
        <fieldset className="grid gap-1.5">
          <legend className="mb-1.5 text-13 font-medium text-subtle-foreground">Categoria</legend>
          <div className="flex flex-wrap gap-1.5">
            {CATS.map((c) => (
              <label
                key={c}
                className={cn(
                  "flex h-9 cursor-pointer items-center gap-2 rounded-full px-3 text-13 ring-1 transition-[background-color,transform,box-shadow] duration-150 ease-out-strong active:scale-[0.96] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring coarse:h-11",
                  categoria === c ? "bg-accent font-medium text-accent-foreground ring-transparent" : "ring-border hover-fine:bg-muted",
                )}
              >
                <input type="radio" name="categoria" value={c} checked={categoria === c} onChange={() => setCategoria(c)} className="sr-only" />
                <span className="size-2 rounded-full" style={{ background: CAT_COLOR[c] }} aria-hidden />
                {c}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Valor" htmlFor="d-valor" error={errors.valor}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-13 text-muted-foreground">R$</span>
              <Input id="d-valor" name="valor" inputMode="decimal" placeholder="0,00" className="pl-10 font-mono tabular" aria-invalid={!!errors.valor} />
            </div>
          </Field>
          <Field label="Data" htmlFor="d-data" error={errors.data} hint={`Hoje é ${mediumDate(today)}.`}>
            <Input id="d-data" name="data" type="date" defaultValue={today} max={today} className="font-mono text-13" aria-invalid={!!errors.data} />
          </Field>
        </div>
      </form>
    </Sheet>
  );
}
