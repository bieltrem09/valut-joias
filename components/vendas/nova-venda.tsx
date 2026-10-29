"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageOff, Package, Plus, X } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { criarVenda } from "@/app/actions";
import { todaySP } from "@/lib/dates";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProdutoParaVenda } from "@/lib/data/estoque";

const TIPOS = ["Avaliação Google", "Instagram", "WhatsApp", "Pix", "Cardápio"] as const;
/** produtoId: a placa saiu do Estoque (baixa automática ao registrar). */
type Linha = { key: number; tipo: (typeof TIPOS)[number]; preco: string; produtoId: number | null };

const brl = (v: number) => (v ? v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");

/** "1.234,56" ou "1234.56" → 1234.56; vazio → 0 */
export function parseValor(s: string) {
  const t = s.replace(/[^\d,.-]/g, "");
  if (!t) return 0;
  return Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
}

export function NovaVendaButton({
  empresas,
  produtos = [],
  label = "Registrar venda",
}: {
  empresas: { id: number; nome: string; cidade: string }[];
  /** Placas do Estoque para escolher qual foi vendida. */
  produtos?: ProdutoParaVenda[];
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus strokeWidth={1.5} />
        {label}
      </Button>
      <NovaVendaSheet open={open} onOpenChange={setOpen} empresas={empresas} produtos={produtos} />
    </>
  );
}

function NovaVendaSheet({
  open,
  onOpenChange,
  empresas,
  produtos,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  empresas: { id: number; nome: string; cidade: string }[];
  produtos: ProdutoParaVenda[];
}) {
  const router = useRouter();
  const today = todaySP();
  const seq = React.useRef(1);
  const nova = (): Linha => ({ key: seq.current++, tipo: "Avaliação Google", preco: "", produtoId: null });

  const [empresaId, setEmpresaId] = React.useState("");
  const [data, setData] = React.useState(today);
  const [metodo, setMetodo] = React.useState<"Pix" | "Cartão" | "Boleto">("Pix");
  const [status, setStatus] = React.useState<"paga" | "pendente">("paga");
  const [linhas, setLinhas] = React.useState<Linha[]>(() => [nova()]);
  const [custoPlacas, setCustoPlacas] = React.useState("");
  /** Enquanto você não digita, o custo do material é a soma do custo das placas do Estoque. */
  const [custoManual, setCustoManual] = React.useState(false);
  const [gravacao, setGravacao] = React.useState("");
  const [frete, setFrete] = React.useState("");
  const [taxa, setTaxa] = React.useState("");
  const [entregue, setEntregue] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [pending, start] = React.useTransition();

  const porId = React.useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos]);
  const usados = new Map<number, number>();
  for (const l of linhas) if (l.produtoId) usados.set(l.produtoId, (usados.get(l.produtoId) ?? 0) + 1);
  const custoEstoque = linhas.reduce((a, l) => a + (l.produtoId ? (porId.get(l.produtoId)?.custo ?? 0) : 0), 0);
  const custoMaterial = custoManual ? custoPlacas : brl(custoEstoque);

  /** Toque numa placa do estoque: preenche a primeira linha vazia ou cria outra. */
  const escolherDoEstoque = (p: ProdutoParaVenda) => {
    if ((usados.get(p.id) ?? 0) >= p.quantidade) return void toast(`${p.nome}: todas as ${p.quantidade} do estoque já estão nesta venda.`);
    setLinhas((ls) => {
      const vazia = ls.find((l) => !l.produtoId && !l.preco.trim());
      const patch = { produtoId: p.id, preco: brl(p.preco) };
      return vazia
        ? ls.map((l) => (l.key === vazia.key ? { ...l, ...patch } : l))
        : [...ls, { ...nova(), tipo: ls.at(-1)?.tipo ?? "Avaliação Google", ...patch }];
    });
  };

  const total = linhas.reduce((a, l) => a + parseValor(l.preco), 0);
  const custos = parseValor(custoMaterial) + parseValor(gravacao) + parseValor(frete) + parseValor(taxa);
  const lucro = total - custos;

  const reset = () => {
    setEmpresaId("");
    setData(today);
    setMetodo("Pix");
    setStatus("paga");
    setLinhas([nova()]);
    setCustoPlacas("");
    setCustoManual(false);
    setGravacao("");
    setFrete("");
    setTaxa("");
    setEntregue(false);
    setError(undefined);
  };

  const set = (key: number, patch: Partial<Linha>) => setLinhas((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const submit = () => {
    setError(undefined);
    start(async () => {
      const res = await criarVenda({
        empresaId: Number(empresaId),
        data,
        status,
        metodo,
        placas: linhas.map((l) => ({ tipo: l.tipo, preco: parseValor(l.preco), produtoId: l.produtoId })),
        custoPlacas: parseValor(custoMaterial),
        custoGravacao: parseValor(gravacao),
        frete: parseValor(frete),
        taxaPagamento: parseValor(taxa),
        entregue,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const cods = res.data?.codigos ?? [];
      toast.success("Venda registrada", { description: cods.length ? `${cods.length === 1 ? "Placa" : "Placas"} ${cods.join(", ")}` : undefined });
      onOpenChange(false);
      reset();
      router.refresh();
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar venda"
      description="Escolha a placa e pronto: ela já leva à avaliação no Google do cliente."
      footer={
        empresas.length ? (
          <div className="flex w-full items-center justify-between gap-3">
            <div className="text-12 leading-tight text-muted-foreground">
              <p>
                Total <span className="font-mono text-14 font-medium text-foreground tabular">{formatBRL(total)}</span>
              </p>
              <p>
                Lucro <span className={cn("font-mono tabular", lucro < 0 ? "text-cost" : "text-profit")}>{formatBRL(lucro)}</span>
              </p>
            </div>
            <Button variant="primary" onClick={submit} disabled={pending}>
              {pending ? "Salvando…" : "Registrar"}
            </Button>
          </div>
        ) : undefined
      }
    >
      {empresas.length === 0 ? (
        <div className="grid gap-3 py-6 text-center">
          <p className="text-14 font-medium">Primeiro, cadastre o cliente</p>
          <p className="text-13 text-muted-foreground">A venda precisa estar ligada a uma empresa.</p>
          <Button asChild variant="primary" className="justify-self-center">
            <Link href="/clientes" onClick={() => onOpenChange(false)}>
              Ir para Clientes
            </Link>
          </Button>
        </div>
      ) : (
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-5 sm:grid-cols-[1fr_160px]">
            <Field label="Cliente" htmlFor="v-empresa">
              <Select id="v-empresa" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} required>
                <option value="" disabled>
                  Escolha…
                </option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                    {e.cidade ? ` · ${e.cidade}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Data" htmlFor="v-data">
              <Input id="v-data" type="date" value={data} max={today} onChange={(e) => setData(e.target.value)} className="font-mono text-13" />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Segmented label="Pagamento" value={metodo} onChange={setMetodo} options={["Pix", "Cartão", "Boleto"]} />
            <Segmented
              label="Situação"
              value={status}
              onChange={setStatus}
              options={["paga", "pendente"]}
              format={(v) => (v === "paga" ? "Já recebi" : "A receber")}
            />
          </div>

          <fieldset className="grid gap-3">
            <legend className="mb-2 text-13 font-medium text-subtle-foreground">Placas</legend>
            {produtos.length > 0 && <DoEstoque produtos={produtos} usados={usados} onEscolher={escolherDoEstoque} />}
            {linhas.map((l, i) => (
              <div key={l.key} className="grid gap-2 rounded-control p-3 ring-1 ring-border">
                {l.produtoId && porId.get(l.produtoId) && (
                  <div className="flex items-center gap-2 rounded-[8px] bg-accent/60 py-1 pr-1 pl-2 text-12 text-accent-foreground">
                    <Package className="size-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="min-w-0 flex-1 truncate">
                      Do estoque: <span className="font-medium">{porId.get(l.produtoId)!.nome}</span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Desligar a placa ${i + 1} do estoque`}
                      onClick={() => set(l.key, { produtoId: null })}
                      className="grid size-7 shrink-0 place-items-center rounded-full hover-fine:bg-background/50 coarse:size-9"
                    >
                      <X className="size-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-11 text-muted-foreground">#{i + 1}</span>
                  <Select
                    aria-label={`Tipo da placa ${i + 1}`}
                    value={l.tipo}
                    onChange={(e) => set(l.key, { tipo: e.target.value as Linha["tipo"] })}
                    className="h-9 flex-1 text-13"
                  >
                    {TIPOS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </Select>
                  <div className="relative w-28 shrink-0">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-12 text-muted-foreground">R$</span>
                    <Input
                      aria-label={`Preço da placa ${i + 1}`}
                      inputMode="decimal"
                      placeholder="0,00"
                      value={l.preco}
                      onChange={(e) => set(l.key, { preco: e.target.value })}
                      className="h-9 pl-8 font-mono text-13 tabular"
                    />
                  </div>
                  {linhas.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remover placa ${i + 1}`}
                      onClick={() => setLinhas((ls) => ls.filter((x) => x.key !== l.key))}
                      className="grid size-9 shrink-0 place-items-center rounded-[8px] text-muted-foreground transition-[transform,background-color] duration-150 hover-fine:bg-muted active:scale-[0.96] coarse:size-11"
                    >
                      <X className="size-4" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="justify-self-start"
              onClick={() => setLinhas((ls) => [...ls, { ...nova(), tipo: ls.at(-1)?.tipo ?? "Avaliação Google" }])}
            >
              <Plus strokeWidth={1.5} /> Adicionar placa
            </Button>
          </fieldset>

          <fieldset className="grid gap-3">
            <legend className="mb-2 text-13 font-medium text-subtle-foreground">O que você gastou nessa venda</legend>
            <div className="grid grid-cols-2 gap-3">
              <Money
                id="v-custo"
                label="Placas (material)"
                value={custoMaterial}
                onChange={(v) => {
                  setCustoManual(true);
                  setCustoPlacas(v);
                }}
                hint={!custoManual && custoEstoque > 0 ? "Somado do custo no Estoque." : undefined}
              />
              <Money id="v-grav" label="Gravação" value={gravacao} onChange={setGravacao} />
              <Money id="v-frete" label="Frete" value={frete} onChange={setFrete} />
              <Money
                id="v-taxa"
                label="Taxa do pagamento"
                value={taxa}
                onChange={setTaxa}
                hint={metodo === "Pix" ? "Pix costuma ser zero." : "Veja o valor no extrato."}
              />
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-start gap-3 rounded-control p-3 ring-1 ring-border has-[:checked]:bg-accent has-[:checked]:ring-transparent">
            <input type="checkbox" checked={entregue} onChange={(e) => setEntregue(e.target.checked)} className="mt-0.5 size-4 accent-[var(--primary)]" />
            <span className="grid gap-0.5">
              <span className="text-13 font-medium">As placas já foram entregues e instaladas</span>
              <span className="text-12 text-muted-foreground">Ficam ativas a partir da data da venda. Senão, entram como pendentes de envio.</span>
            </span>
          </label>

          {error && (
            <p role="alert" className="text-13 text-destructive">
              {error}
            </p>
          )}
        </form>
      )}
    </Sheet>
  );
}

/** Faixa com as placas do Estoque: toque para pôr na venda. */
function DoEstoque({ produtos, usados, onEscolher }: { produtos: ProdutoParaVenda[]; usados: Map<number, number>; onEscolher: (p: ProdutoParaVenda) => void }) {
  return (
    <div className="grid gap-1.5">
      <p className="text-12 text-muted-foreground">Do seu estoque · toque na placa que você vendeu</p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
        {produtos.map((p) => {
          const n = usados.get(p.id) ?? 0;
          const resta = p.quantidade - n;
          const esgotado = resta <= 0;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onEscolher(p)}
              disabled={p.quantidade <= 0}
              aria-label={`${p.nome}, ${p.quantidade} em estoque`}
              className={cn(
                "relative grid w-28 shrink-0 gap-1.5 rounded-control p-1.5 text-left ring-1 transition-[background-color,transform,box-shadow] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45",
                n > 0 ? "bg-accent/50 ring-primary" : "bg-card ring-border hover-fine:bg-muted",
              )}
            >
              <span className="relative block aspect-square overflow-hidden rounded-[8px] bg-muted">
                {p.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/estoque/foto/${p.foto}`} alt="" loading="lazy" className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center text-muted-foreground">
                    <ImageOff className="size-5" strokeWidth={1.25} />
                  </span>
                )}
                {n > 0 && (
                  <span className="absolute top-1 right-1 rounded-full bg-primary px-1.5 font-mono text-11 font-semibold text-primary-foreground">×{n}</span>
                )}
              </span>
              <span className="line-clamp-2 text-12 leading-tight font-medium">{p.nome}</span>
              <span className="flex items-baseline justify-between gap-1 text-11">
                <span className={cn(p.quantidade <= 0 ? "text-cost" : esgotado ? "text-pending" : "text-muted-foreground")}>
                  {p.quantidade <= 0 ? "Esgotado" : `${resta} de ${p.quantidade}`}
                </span>
                {p.preco > 0 && <span className="font-mono tabular">{formatBRL(p.preco)}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Money({ id, label, value, onChange, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-12 text-muted-foreground">R$</span>
        <Input
          id={id}
          inputMode="decimal"
          placeholder="0,00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 font-mono text-13 tabular"
        />
      </div>
    </Field>
  );
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  format = (v) => v,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: T[];
  format?: (v: T) => string;
}) {
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1.5 text-13 font-medium text-subtle-foreground">{label}</legend>
      <div className="flex gap-1 rounded-control bg-muted p-1">
        {options.map((o) => (
          <label
            key={o}
            className={cn(
              "flex h-8 flex-1 cursor-pointer items-center justify-center rounded-[8px] text-13 transition-[background-color,color,transform] duration-150 ease-out-strong active:scale-[0.96] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring coarse:h-10",
              value === o ? "bg-card font-medium text-foreground shadow-hairline" : "text-muted-foreground hover-fine:text-foreground",
            )}
          >
            <input type="radio" className="sr-only" checked={value === o} onChange={() => onChange(o)} />
            {format(o)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
