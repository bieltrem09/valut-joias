"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { AlertTriangle, ImageOff, LayoutGrid, List, Minus, Package, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, fieldClass } from "@/components/ui/input";
import { RollingNumber } from "@/components/ui/rolling-number";
import { GridGlow } from "@/components/ui/grid-glow";
import { moverEstoque } from "@/app/estoque/actions";
import type { ProdutoComFotos } from "@/lib/data/estoque";
import { margem, resumoEstoque, situacao } from "@/lib/estoque";
import { formatBRL, formatInt, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProdutoSheet, SituacaoChip } from "./produto-sheet";

type Ordem = "nome" | "quantidade" | "valor" | "recentes";
type Filtro = "todos" | "alerta";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function EstoqueView({ produtos }: { produtos: ProdutoComFotos[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [busca, setBusca] = React.useState("");
  const [categoria, setCategoria] = React.useState<string | null>(null);
  const [filtro, setFiltro] = React.useState<Filtro>("todos");
  const [ordem, setOrdem] = React.useState<Ordem>("nome");
  const [visao, setVisao] = React.useState<"grade" | "lista">("grade");
  const [aberto, setAberto] = React.useState<{ id: number | null } | null>(null);
  // Ajuste rápido (+/−) aparece na hora; o servidor confirma depois.
  const [otimista, setOtimista] = React.useState<Record<number, number>>({});

  React.useEffect(() => setOtimista({}), [produtos]);
  React.useEffect(() => {
    try {
      const v = localStorage.getItem("estoque-visao");
      if (v === "lista" || v === "grade") setVisao(v);
    } catch {}
  }, []);

  const lista = React.useMemo(() => produtos.map((p) => (otimista[p.id] != null ? { ...p, quantidade: otimista[p.id] } : p)), [produtos, otimista]);
  const r = resumoEstoque(lista);
  const categorias = React.useMemo(
    () => [...new Set(produtos.map((p) => p.categoria).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [produtos],
  );

  const q = norm(busca.trim());
  const visiveis = lista
    .filter((p) => !categoria || p.categoria === categoria)
    .filter((p) => filtro === "todos" || situacao(p.quantidade, p.estoqueMinimo) !== "ok")
    .filter(
      (p) => !q || norm([p.nome, p.sku, p.categoria, p.descricao, p.fornecedor, ...p.atributos.map((a) => a.valor)].filter(Boolean).join(" ")).includes(q),
    )
    .sort((a, b) =>
      ordem === "quantidade"
        ? a.quantidade - b.quantidade
        : ordem === "valor"
          ? b.quantidade * b.preco - a.quantidade * a.preco
          : ordem === "recentes"
            ? b.criadoEm.localeCompare(a.criadoEm)
            : a.nome.localeCompare(b.nome, "pt-BR"),
    );

  const ajustar = async (p: ProdutoComFotos, d: 1 | -1) => {
    const atual = otimista[p.id] ?? p.quantidade;
    if (d < 0 && atual <= 0) return toast("Já está zerado.");
    setOtimista((o) => ({ ...o, [p.id]: atual + d }));
    const res = await moverEstoque(p.id, d > 0 ? "entrada" : "saida", 1, d > 0 ? "Ajuste rápido" : "Venda");
    if (!res.ok) {
      setOtimista((o) => ({ ...o, [p.id]: atual }));
      return void toast.error(res.error);
    }
    setOtimista((o) => ({ ...o, [p.id]: res.data!.saldo }));
    router.refresh();
  };

  const selecionado = aberto?.id != null ? (produtos.find((p) => p.id === aberto.id) ?? null) : null;
  const alertas = r.baixos + r.esgotados;

  return (
    <div className="grid gap-5">
      {/* Totais */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          rotulo="Produtos"
          valor={r.produtos}
          formato={formatInt}
          legenda={`${formatInt(r.unidades)} ${r.unidades === 1 ? "unidade" : "unidades"} em mãos`}
        />
        <Kpi rotulo="Valor para vender" valor={r.valorVenda} formato={formatBRL} legenda={`lucro possível ${formatBRL(r.lucroPotencial)}`} destaque />
        <Kpi rotulo="Custo do estoque" valor={r.valorCusto} formato={formatBRL} legenda="dinheiro parado em produto" />
        <button
          type="button"
          onClick={() => setFiltro((f) => (f === "alerta" ? "todos" : "alerta"))}
          aria-pressed={filtro === "alerta"}
          disabled={!alertas && filtro !== "alerta"}
          className={cn(
            "surface p-4 text-left transition-[box-shadow,transform] duration-150 ease-out-strong active:scale-[0.99] disabled:cursor-default md:p-5",
            filtro === "alerta" && "ring-2 ring-pending",
          )}
        >
          <dt className="flex items-center gap-1.5 text-12 text-muted-foreground">
            <AlertTriangle className={cn("size-3.5", alertas ? "text-pending" : "")} strokeWidth={1.75} /> Precisa repor
          </dt>
          <dd className="mt-2 font-mono text-28 leading-none font-semibold tabular">{alertas}</dd>
          <p className="mt-2 text-12 text-muted-foreground">
            {alertas ? `${r.esgotados} esgotados · ${r.baixos} no mínimo` : "nada acabando"}
            {filtro === "alerta" && " · mostrando só eles"}
          </p>
        </button>
      </dl>

      {/* Ferramentas */}
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex min-w-0 flex-1 basis-60 items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" strokeWidth={1.5} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, código, cor…"
              aria-label="Buscar produto"
              className={cn(fieldClass, "pr-9 pl-9")}
            />
            {busca && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setBusca("")}
                className="absolute right-1.5 grid size-7 place-items-center rounded-full text-muted-foreground hover-fine:bg-muted"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            )}
          </label>
          <Select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar" className="w-auto">
            <option value="nome">A–Z</option>
            <option value="quantidade">Menos em estoque</option>
            <option value="valor">Mais valor parado</option>
            <option value="recentes">Mais recentes</option>
          </Select>
          <div className="flex rounded-control bg-muted p-0.5" role="group" aria-label="Visualização">
            {(
              [
                ["grade", LayoutGrid, "Grade"],
                ["lista", List, "Lista"],
              ] as const
            ).map(([k, Icone, l]) => (
              <button
                key={k}
                type="button"
                aria-pressed={visao === k}
                aria-label={l}
                title={l}
                onClick={() => {
                  setVisao(k);
                  try {
                    localStorage.setItem("estoque-visao", k);
                  } catch {}
                }}
                className={cn(
                  "grid size-9 place-items-center rounded-[10px] transition-colors duration-150 coarse:size-10",
                  visao === k ? "bg-card text-foreground shadow-hairline" : "text-muted-foreground",
                )}
              >
                <Icone className="size-4" strokeWidth={1.5} />
              </button>
            ))}
          </div>
          <Button variant="primary" onClick={() => setAberto({ id: null })}>
            <Plus strokeWidth={1.5} /> Adicionar produto
          </Button>
        </div>
        {categorias.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {[null, ...categorias].map((c) => (
              <button
                key={c ?? "todas"}
                type="button"
                onClick={() => setCategoria(c)}
                aria-pressed={categoria === c}
                className={cn(
                  "h-8 shrink-0 rounded-full px-3 text-13 whitespace-nowrap ring-1 transition-[background-color,color,transform] duration-150 ease-out-strong active:scale-[0.96] coarse:h-10",
                  categoria === c
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "bg-card/70 text-subtle-foreground ring-border hover-fine:text-foreground",
                )}
              >
                {c ?? "Todas"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Produtos */}
      {produtos.length === 0 ? (
        <div className="surface relative grid justify-items-center overflow-hidden px-6 py-16 text-center">
          <GridGlow />
          <span className="relative grid size-14 place-items-center rounded-card bg-accent text-accent-foreground">
            <Package className="size-6" strokeWidth={1.5} />
          </span>
          <p className="relative mt-4 text-16 font-semibold">Seu estoque está vazio</p>
          <p className="relative mt-1 max-w-sm text-13 text-muted-foreground">
            Cadastre o primeiro produto com foto, preço e quantidade. O painel avisa quando estiver acabando.
          </p>
          <Button variant="primary" className="relative mt-5" onClick={() => setAberto({ id: null })}>
            <Plus strokeWidth={1.5} /> Adicionar produto
          </Button>
        </div>
      ) : visiveis.length === 0 ? (
        <div className="surface px-6 py-12 text-center">
          <p className="text-14 font-medium">Nenhum produto com esse filtro</p>
          <button
            type="button"
            className="mt-2 text-13 font-medium text-primary"
            onClick={() => {
              setBusca("");
              setCategoria(null);
              setFiltro("todos");
            }}
          >
            Limpar filtros
          </button>
        </div>
      ) : visao === "grade" ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {visiveis.map((p, i) => (
              <motion.li
                key={p.id}
                // Sem animação de posição: ela media todos os itens a cada toque e deixava a tela lenta.
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 300, damping: 30, delay: Math.min(i, 8) * 0.03 }}
              >
                <CartaoProduto p={p} onAbrir={() => setAberto({ id: p.id })} onAjustar={(d) => ajustar(p, d)} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <ul className="surface divide-y divide-border p-0">
          {visiveis.map((p) => (
            <LinhaProduto key={p.id} p={p} onAbrir={() => setAberto({ id: p.id })} onAjustar={(d) => ajustar(p, d)} />
          ))}
        </ul>
      )}

      <ProdutoSheet open={!!aberto} onOpenChange={(o) => !o && setAberto(null)} produto={selecionado} categorias={categorias} />
    </div>
  );
}

function Kpi({
  rotulo,
  valor,
  formato,
  legenda,
  destaque,
}: {
  rotulo: string;
  valor: number;
  formato: (n: number) => string;
  legenda: string;
  destaque?: boolean;
}) {
  return (
    <div className={cn("surface relative overflow-hidden p-4 md:p-5", destaque && "ring-1 ring-primary/40")}>
      {destaque && <div aria-hidden className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-primary/25 blur-2xl" />}
      <dt className="relative text-12 text-muted-foreground">{rotulo}</dt>
      <dd className="relative mt-2 font-mono text-20 leading-none font-semibold tabular md:text-28">
        <RollingNumber value={valor} format={formato} />
      </dd>
      <p className="relative mt-2 truncate text-12 text-muted-foreground">{legenda}</p>
    </div>
  );
}

function Capa({ p, className }: { p: ProdutoComFotos; className?: string }) {
  return p.fotos[0] ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/api/estoque/foto/${p.fotos[0]}`} alt={p.nome} loading="lazy" decoding="async" className={cn("size-full object-cover", className)} />
  ) : (
    <div
      className={cn(
        "grid size-full place-items-center bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklch,var(--primary)_25%,transparent),transparent_70%)] text-muted-foreground",
        className,
      )}
    >
      <ImageOff className="size-6" strokeWidth={1.25} />
    </div>
  );
}

function Contador({ p, onAjustar, compacto }: { p: ProdutoComFotos; onAjustar: (d: 1 | -1) => void; compacto?: boolean }) {
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => onAjustar(-1)}
        disabled={p.quantidade <= 0}
        aria-label={`Tirar 1 de ${p.nome}`}
        className="grid size-8 place-items-center rounded-full ring-1 ring-border transition-[background-color,transform] duration-150 hover-fine:bg-muted active:scale-[0.9] disabled:opacity-40 coarse:size-10"
      >
        <Minus className="size-3.5" strokeWidth={1.75} />
      </button>
      <span className={cn("text-center font-mono font-semibold tabular", compacto ? "min-w-10 text-14" : "min-w-12 text-16")} aria-live="polite">
        {formatInt(p.quantidade)}
        <span className="ml-0.5 text-11 font-normal text-muted-foreground">{p.unidade}</span>
      </span>
      <button
        type="button"
        onClick={() => onAjustar(1)}
        aria-label={`Somar 1 a ${p.nome}`}
        className="grid size-8 place-items-center rounded-full ring-1 ring-border transition-[background-color,transform] duration-150 hover-fine:bg-muted active:scale-[0.9] coarse:size-10"
      >
        <Plus className="size-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}

function CartaoProduto({ p, onAbrir, onAjustar }: { p: ProdutoComFotos; onAbrir: () => void; onAjustar: (d: 1 | -1) => void }) {
  const sit = situacao(p.quantidade, p.estoqueMinimo);
  const m = margem(p.preco, p.custo);
  return (
    <article className="surface group flex h-full flex-col overflow-hidden p-0">
      <button
        type="button"
        onClick={onAbrir}
        className="relative block aspect-[4/3] overflow-hidden text-left outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Abrir ${p.nome}`}
      >
        <Capa p={p} className="transition-transform duration-500 ease-out-strong hover-fine:group-hover:scale-[1.04] motion-reduce:transition-none" />
        <span className="absolute top-2 left-2">
          <SituacaoChip situacao={sit} minimo={p.estoqueMinimo} />
        </span>
        {p.fotos.length > 1 && (
          <span className="absolute right-2 bottom-2 rounded-full bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-subtle-foreground backdrop-blur">
            {p.fotos.length} fotos
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-2 p-3 md:p-4">
        <button type="button" onClick={onAbrir} className="min-w-0 text-left">
          <p className="truncate font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
            {[p.categoria, p.sku].filter(Boolean).join(" · ") || "Produto"}
          </p>
          <h3 className="mt-0.5 line-clamp-2 text-14 leading-snug font-semibold tracking-[-0.01em]">{p.nome}</h3>
        </button>
        <div className="mt-auto flex items-baseline justify-between gap-2">
          <span className="font-mono text-16 font-semibold tabular">{formatBRL(p.preco)}</span>
          {m != null && <span className={cn("text-11", m < 0 ? "text-cost" : "text-muted-foreground")}>margem {formatPct(m)}</span>}
        </div>
        <Contador p={p} onAjustar={onAjustar} />
      </div>
    </article>
  );
}

function LinhaProduto({ p, onAbrir, onAjustar }: { p: ProdutoComFotos; onAbrir: () => void; onAjustar: (d: 1 | -1) => void }) {
  const sit = situacao(p.quantidade, p.estoqueMinimo);
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 md:px-4">
      <button type="button" onClick={onAbrir} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="size-12 shrink-0 overflow-hidden rounded-control ring-1 ring-border">
          <Capa p={p} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-14 font-medium">{p.nome}</span>
          <span className="block truncate text-12 text-muted-foreground">
            {[p.sku, p.categoria].filter(Boolean).join(" · ") || "—"} · <span className="font-mono tabular">{formatBRL(p.preco)}</span>
          </span>
        </span>
      </button>
      <span className="hidden sm:block">
        <SituacaoChip situacao={sit} minimo={p.estoqueMinimo} />
      </span>
      <Contador p={p} onAjustar={onAjustar} compacto />
    </li>
  );
}
