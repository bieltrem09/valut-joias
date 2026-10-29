"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import {
  AlertTriangle,
  AtSign,
  Calculator,
  Check,
  ClipboardList,
  Copy,
  ExternalLink,
  Globe,
  ImageOff,
  MapPin,
  MessageCircle,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Star,
  Store,
  Timer,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field, Input, Select, fieldClass } from "@/components/ui/input";
import { GridGlow } from "@/components/ui/grid-glow";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Sheet } from "@/components/ui/sheet";
import { parseValor } from "@/components/vendas/nova-venda";
import { favoritarFornecedor, mudarStatusPedido } from "@/app/fornecedores/actions";
import type { Fornecedor, Oferta, PedidoCompra } from "@/lib/data/fornecedores";
import {
  STATUS_PEDIDO,
  TIPOS_PLACA,
  atrasado,
  buscasFornecedor,
  custoUnitario,
  linkInstagram,
  mensagemPedido,
  simularLote,
  urlRastreio,
} from "@/lib/fornecedores";
import { whatsappUrl } from "@/lib/prospeccao";
import { formatBRL, formatInt, formatPct } from "@/lib/format";
import { diffDays, shortDate, todaySP } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ChegouSheet, FornecedorSheet, OfertaSheet, PedidoSheet, type RascunhoPedido } from "./formularios";

type Aba = "vitrine" | "fornecedores" | "pedidos" | "achar";
type Ordem = "preco" | "recentes";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** WhatsApp do fornecedor (celular ou fixo com DDD: o wa.me aceita os dois em contas Business). */
function waDoFornecedor(f: Fornecedor | undefined, texto: string) {
  if (!f?.whatsapp) return null;
  const d = f.whatsapp.replace(/\D/g, "").replace(/^55/, "");
  return whatsappUrl(f.whatsapp, texto) ?? (d.length >= 10 ? `https://wa.me/55${d}?text=${encodeURIComponent(texto)}` : null);
}

export function FornecedoresView({
  fornecedores,
  ofertas,
  pedidos,
  produtos,
  precoMedio,
  nomeDono,
}: {
  fornecedores: Fornecedor[];
  ofertas: Oferta[];
  pedidos: PedidoCompra[];
  produtos: { id: number; nome: string; quantidade: number; estoqueMinimo: number }[];
  precoMedio: number | null;
  nomeDono: string | null;
}) {
  const reduce = useReducedMotion();
  const hoje = todaySP();
  const [aba, setAba] = React.useState<Aba>("vitrine");
  const [busca, setBusca] = React.useState("");
  const [tipo, setTipo] = React.useState<string | null>(null);
  const [ordem, setOrdem] = React.useState<Ordem>("preco");
  const [precoVendaTxt, setPrecoVendaTxt] = React.useState("");
  const [fornAberto, setFornAberto] = React.useState<{ id: number | null } | null>(null);
  const [ofertaAberta, setOfertaAberta] = React.useState<{ id: number | null; fornecedorId?: number | null } | null>(null);
  const [pedidoAberto, setPedidoAberto] = React.useState<{ id: number | null; rascunho?: RascunhoPedido } | null>(null);
  const [simular, setSimular] = React.useState<Oferta | null>(null);
  const [chegou, setChegou] = React.useState<PedidoCompra | null>(null);

  // Preço de venda para calcular o lucro: o que você digitou (guardado neste aparelho) ou a média das suas vendas.
  React.useEffect(() => {
    try {
      const v = localStorage.getItem("fornecedores-preco-venda");
      if (v) return setPrecoVendaTxt(v);
    } catch {}
    if (precoMedio) setPrecoVendaTxt(precoMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }, [precoMedio]);
  const precoVenda = parseValor(precoVendaTxt);

  const fornPorId = React.useMemo(() => new Map(fornecedores.map((f) => [f.id, f])), [fornecedores]);
  const maisBarata = ofertas.length ? ofertas.reduce((a, b) => (b.preco > 0 && (a.preco <= 0 || b.preco < a.preco) ? b : a)) : null;

  const naoCancelados = pedidos.filter((p) => p.status !== "cancelado");
  const mes = hoje.slice(0, 7);
  const gastoMes = naoCancelados.filter((p) => p.data.startsWith(mes)).reduce((a, p) => a + p.valorTotal + p.frete, 0);
  const gastoTotal = naoCancelados.reduce((a, p) => a + p.valorTotal + p.frete, 0);
  const placasCompradas = naoCancelados.reduce((a, p) => a + p.quantidade, 0);
  const aCaminho = pedidos.filter((p) => p.status === "pedido" || p.status === "enviado");
  const atrasados = aCaminho.filter((p) => atrasado(p, hoje));
  const acabando = produtos.filter((p) => p.quantidade <= 0 || (p.estoqueMinimo > 0 && p.quantidade <= p.estoqueMinimo));

  const q = norm(busca.trim());
  const visiveis = ofertas
    .filter((o) => !tipo || o.tipo === tipo)
    .filter((o) => !q || norm([o.nome, o.descricao, o.tipo, o.material, fornPorId.get(o.fornecedorId)?.nome].filter(Boolean).join(" ")).includes(q))
    .sort((a, b) => (ordem === "recentes" ? b.criadoEm.localeCompare(a.criadoEm) : a.preco - b.preco));
  const tiposUsados = TIPOS_PLACA.filter((t) => ofertas.some((o) => o.tipo === t));

  const fornSel = fornAberto?.id != null ? (fornPorId.get(fornAberto.id) ?? null) : null;
  const ofertaSel = ofertaAberta?.id != null ? (ofertas.find((o) => o.id === ofertaAberta.id) ?? null) : null;
  const pedidoSel = pedidoAberto?.id != null ? (pedidos.find((p) => p.id === pedidoAberto.id) ?? null) : null;

  const novaPlaca = (fornecedorId?: number | null) => {
    if (!fornecedores.length) {
      toast("Cadastre o fornecedor primeiro", { description: "Depois é só colar o link da placa." });
      return setFornAberto({ id: null });
    }
    setOfertaAberta({ id: null, fornecedorId });
  };
  const novoPedido = (rascunho?: RascunhoPedido) => {
    if (!fornecedores.length) {
      toast("Cadastre o fornecedor primeiro");
      return setFornAberto({ id: null });
    }
    setPedidoAberto({ id: null, rascunho });
  };

  const ABAS: [Aba, string, number | null][] = [
    ["vitrine", "Vitrine de placas", ofertas.length],
    ["fornecedores", "Fornecedores", fornecedores.length],
    ["pedidos", "Pedidos", aCaminho.length || null],
    ["achar", "Achar fornecedor", null],
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      {/* Totais */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          rotulo="Placa mais barata"
          valor={maisBarata?.preco ?? 0}
          formato={formatBRL}
          legenda={maisBarata ? `${fornPorId.get(maisBarata.fornecedorId)?.nome ?? ""} · ${maisBarata.nome}` : "cadastre as placas"}
          destaque
        />
        <Kpi rotulo="Gasto com placas no mês" valor={gastoMes} formato={formatBRL} legenda={`${formatBRL(gastoTotal)} desde o início`} />
        <Kpi
          rotulo="Custo médio por placa"
          valor={placasCompradas ? gastoTotal / placasCompradas : 0}
          formato={formatBRL}
          legenda={placasCompradas ? `${formatInt(placasCompradas)} placas compradas, com frete` : "registre suas compras"}
        />
        <button
          type="button"
          onClick={() => setAba("pedidos")}
          className={cn("surface p-4 text-left transition-transform duration-150 active:scale-[0.99] md:p-5", atrasados.length > 0 && "ring-2 ring-pending")}
        >
          <dt className="flex items-center gap-1.5 text-12 text-muted-foreground">
            <Truck className={cn("size-3.5", atrasados.length ? "text-pending" : "")} strokeWidth={1.75} /> A caminho
          </dt>
          <dd className="mt-2 font-mono text-20 leading-none font-semibold tabular md:text-28">{aCaminho.length}</dd>
          <p className="mt-2 truncate text-12 text-muted-foreground">{atrasados.length ? `${atrasados.length} passou da previsão` : "nenhum atrasado"}</p>
        </button>
      </dl>

      {/* Hora de repor */}
      {acabando.length > 0 && (
        <div className="surface flex flex-wrap items-center gap-3 p-4 ring-1 ring-pending/50">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pending-soft text-pending">
            <AlertTriangle className="size-4" strokeWidth={1.75} />
          </span>
          <p className="min-w-0 flex-1 text-13">
            <span className="font-semibold">Hora de repor:</span>{" "}
            <span className="text-subtle-foreground">
              {acabando
                .slice(0, 3)
                .map((p) => `${p.nome} (${p.quantidade})`)
                .join(", ")}
              {acabando.length > 3 ? ` e mais ${acabando.length - 3}` : ""} no estoque.
            </span>
          </p>
          <Button size="sm" variant="primary" onClick={() => setAba("vitrine")}>
            <ShoppingCart strokeWidth={1.5} /> Ver placas para comprar
          </Button>
        </div>
      )}

      {/* Abas */}
      <div className="flex flex-wrap items-center gap-2">
        <LayoutGroup id="abas-fornecedores">
          <div role="tablist" className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-muted p-1 no-scrollbar">
            {ABAS.map(([k, l, n]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={aba === k}
                onClick={() => setAba(k)}
                className={cn(
                  "relative h-9 shrink-0 rounded-full px-3.5 text-13 font-medium whitespace-nowrap outline-hidden focus-visible:ring-2 focus-visible:ring-ring coarse:h-10",
                  aba === k ? "text-foreground" : "text-muted-foreground hover-fine:text-foreground",
                )}
              >
                {aba === k && (
                  <motion.span
                    layoutId="aba-fornecedores"
                    className="absolute inset-0 rounded-full bg-card shadow-hairline"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative">
                  {l}
                  {n ? <span className="ml-1.5 font-mono text-11 text-muted-foreground tabular">{n}</span> : null}
                </span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        <div className="ml-auto flex flex-wrap gap-2">
          {aba === "fornecedores" ? (
            <Button variant="primary" onClick={() => setFornAberto({ id: null })}>
              <Plus strokeWidth={1.5} /> Fornecedor
            </Button>
          ) : aba === "pedidos" ? (
            <Button variant="primary" onClick={() => novoPedido()}>
              <Plus strokeWidth={1.5} /> Registrar compra
            </Button>
          ) : aba === "vitrine" ? (
            <Button variant="primary" onClick={() => novaPlaca()}>
              <Plus strokeWidth={1.5} /> Placa
            </Button>
          ) : null}
        </div>
      </div>

      {aba === "vitrine" && (
        <section aria-label="Vitrine de placas" className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative flex min-w-0 flex-1 basis-56 items-center">
              <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar placa, material, fornecedor…"
                aria-label="Buscar placa"
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
              <option value="preco">Mais barata (mais lucro) primeiro</option>
              <option value="recentes">Mais recentes</option>
            </Select>
            <label className="flex h-10 items-center gap-2 rounded-control bg-card pr-1 pl-3 text-13 text-muted-foreground ring-1 ring-border coarse:h-11">
              Vendo por R$
              <input
                value={precoVendaTxt}
                onChange={(e) => {
                  setPrecoVendaTxt(e.target.value);
                  try {
                    localStorage.setItem("fornecedores-preco-venda", e.target.value);
                  } catch {}
                }}
                inputMode="decimal"
                placeholder="0,00"
                aria-label="Por quanto você vende cada placa"
                className="h-8 w-20 rounded-[10px] bg-muted px-2 font-mono text-14 text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </div>
          {tiposUsados.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {[null, ...tiposUsados].map((t) => (
                <button
                  key={t ?? "todos"}
                  type="button"
                  onClick={() => setTipo(t)}
                  aria-pressed={tipo === t}
                  className={cn(
                    "h-8 shrink-0 rounded-full px-3 text-13 whitespace-nowrap ring-1 transition-[background-color,color,transform] duration-150 active:scale-[0.96] coarse:h-10",
                    tipo === t ? "bg-primary text-primary-foreground ring-primary" : "bg-card/70 text-subtle-foreground ring-border hover-fine:text-foreground",
                  )}
                >
                  {t ?? "Todos os tipos"}
                </button>
              ))}
            </div>
          )}

          {ofertas.length === 0 ? (
            <Vazio
              icone={ShoppingCart}
              titulo="Sua vitrine de compras está vazia"
              texto="Cole o link da placa do fornecedor: o painel puxa a foto, o nome e o preço. Depois é só tocar em Comprar."
              acao={
                <Button variant="primary" onClick={() => novaPlaca()}>
                  <Plus strokeWidth={1.5} /> {fornecedores.length ? "Adicionar placa" : "Começar pelo fornecedor"}
                </Button>
              }
            />
          ) : visiveis.length === 0 ? (
            <div className="surface px-6 py-10 text-center text-14">
              Nenhuma placa com esse filtro.{" "}
              <button
                type="button"
                className="font-medium text-primary"
                onClick={() => {
                  setBusca("");
                  setTipo(null);
                }}
              >
                Limpar
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-3">
              <AnimatePresence initial={false}>
                {visiveis.map((o, i) => (
                  <motion.li
                    key={o.id}
                    // Sem animação de posição: ela media todos os itens a cada toque e deixava a tela lenta.
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 300, damping: 30, delay: Math.min(i, 8) * 0.03 }}
                  >
                    <CartaoPlaca
                      o={o}
                      f={fornPorId.get(o.fornecedorId)}
                      precoVenda={precoVenda}
                      maisBarata={maisBarata?.id === o.id && ofertas.length > 1}
                      nomeDono={nomeDono}
                      onEditar={() => setOfertaAberta({ id: o.id })}
                      onSimular={() => setSimular(o)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </section>
      )}

      {aba === "fornecedores" && (
        <section aria-label="Fornecedores" className="grid gap-3">
          {fornecedores.length === 0 ? (
            <Vazio
              icone={Store}
              titulo="Nenhum fornecedor ainda"
              texto="Guarde aqui quem vende as placas: WhatsApp, site, prazo, pedido mínimo e a sua nota. Não sabe por onde começar? Veja a aba Achar fornecedor."
              acao={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="primary" onClick={() => setFornAberto({ id: null })}>
                    <Plus strokeWidth={1.5} /> Adicionar fornecedor
                  </Button>
                  <Button onClick={() => setAba("achar")}>
                    <Search strokeWidth={1.5} /> Achar fornecedor
                  </Button>
                </div>
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
              {fornecedores.map((f) => (
                <li key={f.id}>
                  <CartaoFornecedor
                    f={f}
                    ofertas={ofertas.filter((o) => o.fornecedorId === f.id)}
                    pedidos={pedidos.filter((p) => p.fornecedorId === f.id && p.status !== "cancelado")}
                    nomeDono={nomeDono}
                    onEditar={() => setFornAberto({ id: f.id })}
                    onNovaPlaca={() => novaPlaca(f.id)}
                    onPedido={() => novoPedido({ fornecedorId: f.id })}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {aba === "pedidos" && (
        <ListaPedidos
          pedidos={pedidos}
          fornPorId={fornPorId}
          hoje={hoje}
          onNovo={() => novoPedido()}
          onEditar={(p) => setPedidoAberto({ id: p.id })}
          onChegou={setChegou}
        />
      )}

      {aba === "achar" && <AcharFornecedor onAdicionar={() => setFornAberto({ id: null })} />}

      <FornecedorSheet open={!!fornAberto} onOpenChange={(o) => !o && setFornAberto(null)} fornecedor={fornSel} />
      <OfertaSheet
        open={!!ofertaAberta}
        onOpenChange={(o) => !o && setOfertaAberta(null)}
        oferta={ofertaSel}
        fornecedores={fornecedores}
        fornecedorInicial={ofertaAberta?.fornecedorId}
      />
      <PedidoSheet
        open={!!pedidoAberto}
        onOpenChange={(o) => !o && setPedidoAberto(null)}
        pedido={pedidoSel}
        rascunho={pedidoAberto?.rascunho}
        fornecedores={fornecedores}
        ofertas={ofertas}
      />
      <SimuladorSheet
        oferta={simular}
        f={simular ? fornPorId.get(simular.fornecedorId) : undefined}
        precoVenda={precoVenda}
        nomeDono={nomeDono}
        onOpenChange={(o) => !o && setSimular(null)}
        onRegistrar={(r) => {
          setSimular(null);
          novoPedido(r);
        }}
      />
      <ChegouSheet pedido={chegou} onOpenChange={(o) => !o && setChegou(null)} produtos={produtos} precoVenda={precoVenda} />
    </div>
  );
}

/* ---------------------------------- Peças ---------------------------------- */

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

function Vazio({ icone: Icone, titulo, texto, acao }: { icone: typeof Store; titulo: string; texto: string; acao: React.ReactNode }) {
  return (
    <div className="surface relative grid justify-items-center overflow-hidden px-6 py-14 text-center">
      <GridGlow />
      <span className="relative grid size-14 place-items-center rounded-card bg-accent text-accent-foreground">
        <Icone className="size-6" strokeWidth={1.5} />
      </span>
      <p className="relative mt-4 text-16 font-semibold">{titulo}</p>
      <p className="relative mt-1 max-w-md text-13 text-muted-foreground">{texto}</p>
      <div className="relative mt-5">{acao}</div>
    </div>
  );
}

function FotoPlaca({ o, className }: { o: Oferta; className?: string }) {
  const [falhou, setFalhou] = React.useState(false);
  const src = o.foto ?? o.imagemUrl;
  if (!src || falhou)
    return (
      <div
        className={cn(
          "grid size-full place-items-center content-center gap-1.5 bg-[radial-gradient(circle_at_50%_40%,var(--accent),var(--muted)_70%)] text-muted-foreground",
          className,
        )}
      >
        <ImageOff className="size-6" strokeWidth={1.25} />
        <span className="text-11">Sem foto · toque para pôr</span>
      </div>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={o.nome}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFalhou(true)}
      className={cn("size-full object-cover", className)}
    />
  );
}

function CartaoPlaca({
  o,
  f,
  precoVenda,
  maisBarata,
  nomeDono,
  onEditar,
  onSimular,
}: {
  o: Oferta;
  f: Fornecedor | undefined;
  precoVenda: number;
  maisBarata: boolean;
  nomeDono: string | null;
  onEditar: () => void;
  onSimular: () => void;
}) {
  const lucro = precoVenda > 0 && o.preco > 0 ? precoVenda - o.preco : null;
  const wa = waDoFornecedor(
    f,
    mensagemPedido({ fornecedor: f?.nome ?? "", placa: o.nome, quantidade: o.qtdMinima > 1 ? o.qtdMinima : null, link: o.link, nome: nomeDono }),
  );
  return (
    <article className="surface group flex h-full flex-col overflow-hidden p-0">
      <button type="button" onClick={onEditar} className="relative block aspect-[4/3] overflow-hidden bg-muted text-left" aria-label={`Editar ${o.nome}`}>
        <FotoPlaca o={o} className="transition-transform duration-500 ease-out-strong hover-fine:group-hover:scale-[1.04] motion-reduce:transition-none" />
        <span className="absolute top-2 left-2 flex flex-wrap gap-1">
          {maisBarata && <Chip tone="profit">Mais barata</Chip>}
          {o.tipo && <Chip className="bg-background/85 backdrop-blur">{o.tipo}</Chip>}
        </span>
        <span className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-background/85 text-subtle-foreground opacity-100 backdrop-blur transition-opacity duration-150 hover-fine:opacity-0 hover-fine:group-hover:opacity-100">
          <Pencil className="size-3.5" strokeWidth={1.75} />
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="min-w-0">
          <p className="truncate font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">{[f?.nome, o.material].filter(Boolean).join(" · ")}</p>
          <h3 className="mt-0.5 line-clamp-2 text-14 leading-snug font-semibold tracking-[-0.01em]">{o.nome}</h3>
          {o.descricao && <p className="mt-1 line-clamp-3 text-12 leading-relaxed text-muted-foreground">{o.descricao}</p>}
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-1 pt-1">
          <p>
            <span className="font-mono text-20 font-semibold tabular">{formatBRL(o.preco)}</span>
            <span className="text-12 text-muted-foreground"> /un{o.qtdMinima > 1 ? ` · mín. ${o.qtdMinima}` : ""}</span>
          </p>
          {lucro != null && (
            <Chip tone={lucro > 0 ? "profit" : "cost"} title={`Vendendo a ${formatBRL(precoVenda)}`}>
              {lucro > 0 ? "+" : ""}
              {formatBRL(lucro)} por placa
            </Chip>
          )}
        </div>
        {f?.prazoDias != null && (
          <p className="flex items-center gap-1 text-11 text-muted-foreground">
            <Timer className="size-3" strokeWidth={1.75} /> chega em ~{f.prazoDias} {f.prazoDias === 1 ? "dia" : "dias"}
            {f.frete ? ` · ${f.frete}` : ""}
          </p>
        )}
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 pt-1">
          {(o.link ?? f?.linkCompra) ? (
            <Button asChild variant="primary" size="sm">
              <a href={(o.link ?? f?.linkCompra)!} target="_blank" rel="noreferrer">
                <ShoppingCart strokeWidth={1.75} /> Comprar
              </a>
            </Button>
          ) : (
            <Button size="sm" onClick={onEditar}>
              <Plus strokeWidth={1.5} /> Pôr o link
            </Button>
          )}
          {wa && (
            <Button asChild size="icon-sm" title="Pedir no WhatsApp">
              <a href={wa} target="_blank" rel="noreferrer" aria-label={`Pedir ${o.nome} no WhatsApp`}>
                <MessageCircle strokeWidth={1.75} />
              </a>
            </Button>
          )}
          <Button size="icon-sm" onClick={onSimular} title="Simular compra" aria-label={`Simular compra de ${o.nome}`}>
            <Calculator strokeWidth={1.75} />
          </Button>
        </div>
      </div>
    </article>
  );
}

function Estrelas({ nota }: { nota: number | null }) {
  if (!nota) return null;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Nota ${nota} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("size-3", n <= nota ? "fill-pending text-pending" : "text-muted-foreground/50")} strokeWidth={1.5} />
      ))}
    </span>
  );
}

function CartaoFornecedor({
  f,
  ofertas,
  pedidos,
  nomeDono,
  onEditar,
  onNovaPlaca,
  onPedido,
}: {
  f: Fornecedor;
  ofertas: Oferta[];
  pedidos: PedidoCompra[];
  nomeDono: string | null;
  onEditar: () => void;
  onNovaPlaca: () => void;
  onPedido: () => void;
}) {
  const router = useRouter();
  const [fav, setFav] = React.useState(f.favorito);
  React.useEffect(() => setFav(f.favorito), [f.favorito]);
  const wa = waDoFornecedor(f, mensagemPedido({ fornecedor: f.nome, nome: nomeDono }));
  const ig = linkInstagram(f.instagram);
  const gasto = pedidos.reduce((a, p) => a + p.valorTotal + p.frete, 0);
  const placas = pedidos.reduce((a, p) => a + p.quantidade, 0);
  const menor = ofertas.filter((o) => o.preco > 0).sort((a, b) => a.preco - b.preco)[0];
  return (
    <article className={cn("surface flex h-full flex-col gap-3 p-4 md:p-5", fav && "ring-1 ring-primary/40")}>
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-card bg-accent font-semibold text-accent-foreground">
          {f.nome
            .split(/\s+/)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join("")}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-16 font-semibold tracking-[-0.01em]">{f.nome}</h3>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-12 text-muted-foreground">
            {f.cidade && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" strokeWidth={1.75} /> {f.cidade}
              </span>
            )}
            <Estrelas nota={f.nota} />
          </p>
        </div>
        <button
          type="button"
          aria-pressed={fav}
          aria-label={fav ? "Tirar dos favoritos" : "Marcar como favorito"}
          title={fav ? "Favorito" : "Marcar como favorito"}
          onClick={async () => {
            setFav(!fav);
            const r = await favoritarFornecedor(f.id, !fav);
            if (!r.ok) setFav(fav);
            router.refresh();
          }}
          className="grid size-9 place-items-center rounded-control transition-transform duration-150 active:scale-[0.9] hover-fine:bg-muted coarse:size-11"
        >
          <Star className={cn("size-4", fav ? "fill-primary text-primary" : "text-muted-foreground")} strokeWidth={1.5} />
        </button>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {(
          [
            ["Prazo", f.prazoDias != null ? `${f.prazoDias} d` : "—"],
            ["Mínimo", f.pedidoMinimo != null ? `${f.pedidoMinimo} un` : "—"],
            ["A partir de", menor ? formatBRL(menor.preco) : "—"],
          ] as const
        ).map(([r, v]) => (
          <div key={r} className="rounded-control bg-muted/60 px-2 py-2">
            <dt className="text-[10px] tracking-[0.08em] text-muted-foreground uppercase">{r}</dt>
            <dd className="mt-0.5 truncate font-mono text-13 font-semibold tabular">{v}</dd>
          </div>
        ))}
      </dl>

      {(f.frete || f.observacoes) && (
        <p className="line-clamp-3 text-12 leading-relaxed text-subtle-foreground">
          {[f.frete && `Frete: ${f.frete}`, f.observacoes].filter(Boolean).join(" · ")}
        </p>
      )}
      <p className="text-12 text-muted-foreground">
        {ofertas.length} {ofertas.length === 1 ? "placa na vitrine" : "placas na vitrine"} ·{" "}
        {pedidos.length
          ? `${pedidos.length} ${pedidos.length === 1 ? "compra" : "compras"}, ${formatInt(placas)} placas, ${formatBRL(gasto)}`
          : "nenhuma compra ainda"}
      </p>

      <div className="mt-auto flex flex-wrap gap-2">
        {f.linkCompra ? (
          <>
            <Button asChild variant="primary" size="sm">
              <a href={f.linkCompra} target="_blank" rel="noreferrer">
                <ShoppingCart strokeWidth={1.75} /> Comprar
              </a>
            </Button>
            <Button
              size="icon-sm"
              title="Copiar o link da compra"
              aria-label={`Copiar o link da compra de ${f.nome}`}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(f.linkCompra!);
                  toast.success("Link da compra copiado");
                } catch {
                  toast.error("Não deu para copiar. Abra o link e copie pelo navegador.");
                }
              }}
            >
              <Copy strokeWidth={1.5} />
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={onEditar}>
            <Plus strokeWidth={1.5} /> Pôr link da compra
          </Button>
        )}
        {wa && (
          <Button asChild variant={f.linkCompra ? "secondary" : "primary"} size="sm">
            <a href={wa} target="_blank" rel="noreferrer">
              <MessageCircle strokeWidth={1.75} /> Pedir orçamento
            </a>
          </Button>
        )}
        {f.site && (
          <Button asChild size="sm">
            <a href={f.site} target="_blank" rel="noreferrer">
              <Globe strokeWidth={1.5} /> Loja
            </a>
          </Button>
        )}
        {ig && (
          <Button asChild size="icon-sm" title="Instagram">
            <a href={ig} target="_blank" rel="noreferrer" aria-label={`Instagram de ${f.nome}`}>
              <AtSign strokeWidth={1.5} />
            </a>
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onNovaPlaca}>
          <Plus strokeWidth={1.5} /> Placa
        </Button>
        <Button size="sm" variant="ghost" onClick={onPedido}>
          <ClipboardList strokeWidth={1.5} /> Compra
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={onEditar} aria-label={`Editar ${f.nome}`} title="Editar">
          <Pencil strokeWidth={1.5} />
        </Button>
      </div>
    </article>
  );
}

function ListaPedidos({
  pedidos,
  fornPorId,
  hoje,
  onNovo,
  onEditar,
  onChegou,
}: {
  pedidos: PedidoCompra[];
  fornPorId: Map<number, Fornecedor>;
  hoje: string;
  onNovo: () => void;
  onEditar: (p: PedidoCompra) => void;
  onChegou: (p: PedidoCompra) => void;
}) {
  const router = useRouter();
  const [filtro, setFiltro] = React.useState<"abertos" | "todos">("abertos");
  const abertos = pedidos.filter((p) => p.status === "pedido" || p.status === "enviado");
  const lista = filtro === "abertos" ? abertos : pedidos;

  const mudar = async (p: PedidoCompra, status: "enviado" | "cancelado" | "pedido") => {
    const r = await mudarStatusPedido(p.id, status);
    if (!r.ok) return void toast.error(r.error);
    toast.success(status === "enviado" ? "Marcado como a caminho" : status === "cancelado" ? "Pedido cancelado" : "Pedido reaberto");
    router.refresh();
  };

  if (!pedidos.length)
    return (
      <Vazio
        icone={Package}
        titulo="Nenhuma compra registrada"
        texto="Anote cada compra de placas: o painel mostra quanto saiu cada uma com frete, avisa quando atrasa e dá entrada no estoque quando chegar."
        acao={
          <Button variant="primary" onClick={onNovo}>
            <Plus strokeWidth={1.5} /> Registrar compra
          </Button>
        }
      />
    );

  return (
    <section aria-label="Pedidos" className="grid gap-3">
      <div className="flex gap-1.5">
        {(
          [
            ["abertos", `Em aberto (${abertos.length})`],
            ["todos", `Todos (${pedidos.length})`],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            aria-pressed={filtro === k}
            onClick={() => setFiltro(k)}
            className={cn(
              "h-8 rounded-full px-3 text-13 ring-1 transition-colors duration-150 coarse:h-10",
              filtro === k ? "bg-primary text-primary-foreground ring-primary" : "bg-card/70 text-subtle-foreground ring-border hover-fine:text-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>
      {lista.length === 0 ? (
        <div className="surface px-6 py-10 text-center text-14 text-muted-foreground">Nada em aberto: tudo que você pediu já chegou.</div>
      ) : (
        <ul className="surface divide-y divide-border p-0">
          {lista.map((p) => {
            const f = fornPorId.get(p.fornecedorId);
            const st = STATUS_PEDIDO[p.status];
            const late = atrasado(p, hoje);
            const rastreio = urlRastreio(p.rastreio);
            const faltam = p.previsao ? diffDays(p.previsao, hoje) : null;
            return (
              <li key={p.id} className="grid gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <button type="button" onClick={() => onEditar(p)} className="min-w-0 text-left">
                  <span className="flex flex-wrap items-center gap-2">
                    <Chip tone={late ? "cost" : st.tom}>{late ? "Atrasado" : st.rotulo}</Chip>
                    <span className="truncate text-14 font-medium">
                      {p.quantidade} × {p.descricao}
                    </span>
                  </span>
                  <span className="mt-1 block text-12 text-muted-foreground">
                    {f?.nome ?? "Fornecedor"} · pedido {shortDate(p.data)}
                    {p.status === "recebido" && p.recebidoEm
                      ? ` · chegou ${shortDate(p.recebidoEm)}`
                      : p.previsao && p.status !== "cancelado"
                        ? late
                          ? ` · era para ${shortDate(p.previsao)}`
                          : ` · chega até ${shortDate(p.previsao)}${faltam != null && faltam <= 7 ? ` (${faltam === 0 ? "hoje" : faltam === 1 ? "amanhã" : `${faltam} dias`})` : ""}`
                        : ""}
                  </span>
                  <span className="mt-1 block text-12">
                    <span className="font-mono font-semibold tabular">{formatBRL(p.valorTotal + p.frete)}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {formatBRL(custoUnitario(p))} por placa{p.frete ? " com frete" : ""}
                    </span>
                  </span>
                </button>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {rastreio && p.status !== "recebido" && (
                    <Button asChild size="sm">
                      <a href={rastreio} target="_blank" rel="noreferrer">
                        <Truck strokeWidth={1.5} /> Rastrear
                      </a>
                    </Button>
                  )}
                  {p.status === "pedido" && (
                    <Button size="sm" onClick={() => mudar(p, "enviado")}>
                      <Truck strokeWidth={1.5} /> Foi enviado
                    </Button>
                  )}
                  {(p.status === "pedido" || p.status === "enviado") && (
                    <Button size="sm" variant="primary" onClick={() => onChegou(p)}>
                      <Check strokeWidth={1.75} /> Chegou
                    </Button>
                  )}
                  {p.status === "cancelado" && (
                    <Button size="sm" variant="ghost" onClick={() => mudar(p, "pedido")}>
                      Reabrir
                    </Button>
                  )}
                  {(p.status === "pedido" || p.status === "enviado") && (
                    <Button size="sm" variant="ghost" onClick={() => mudar(p, "cancelado")}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const PERGUNTAS = [
  "O chip é NTAG213 ou NTAG215? (funcionam em iPhone e Android)",
  "A placa já vem gravada com o link do cliente ou você grava?",
  "Dá para pôr a logo do cliente? Tem custo de arte?",
  "Qual o prazo de produção e de entrega para a minha cidade?",
  "Tem desconto por quantidade (50, 100, 500 unidades)?",
  "Manda uma amostra antes do lote grande?",
  "Qual o material e a espessura? Vem com adesivo ou base?",
  "Formas de pagamento, nota fiscal e garantia se o chip falhar.",
];

function AcharFornecedor({ onAdicionar }: { onAdicionar: () => void }) {
  const [termo, setTermo] = React.useState("placa nfc avaliação google");
  const [feitas, setFeitas] = React.useState<Set<number>>(new Set());
  const lojas = buscasFornecedor(termo.trim() || "placa nfc avaliação google");
  return (
    <section aria-label="Achar fornecedor" className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="surface grid content-start gap-4 p-4 md:p-5">
        <div>
          <h3 className="text-16 font-semibold tracking-[-0.01em]">Procure em vários lugares de uma vez</h3>
          <p className="mt-1 text-13 text-muted-foreground">Mude o que procurar e abra cada loja já com a busca pronta. Achou um bom? Cadastre aqui.</p>
        </div>
        <Field label="O que procurar" htmlFor="a-termo">
          <Input id="a-termo" value={termo} onChange={(e) => setTermo(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-1.5">
          {["placa nfc avaliação google", "display nfc acrílico", "adesivo nfc ntag213", "chaveiro nfc", "cartão nfc personalizado"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTermo(t)}
              aria-pressed={termo === t}
              className={cn(
                "h-7 rounded-full px-2.5 text-12 ring-1 transition-colors duration-150 coarse:h-9",
                termo === t ? "bg-primary text-primary-foreground ring-primary" : "bg-card/60 text-subtle-foreground ring-border hover-fine:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {lojas.map((l) => (
            <li key={l.nome}>
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-full items-start gap-3 rounded-control p-3 ring-1 ring-border transition-[background-color,transform] duration-150 hover-fine:bg-muted active:scale-[0.99]"
              >
                <ExternalLink className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.5} />
                <span className="min-w-0">
                  <span className="block text-14 font-medium">{l.nome}</span>
                  <span className="block text-12 text-muted-foreground">{l.dica}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <Button variant="primary" onClick={onAdicionar} className="justify-self-start">
          <Plus strokeWidth={1.5} /> Cadastrar fornecedor
        </Button>
      </div>
      <div className="surface grid content-start gap-3 p-4 md:p-5">
        <div>
          <h3 className="text-16 font-semibold tracking-[-0.01em]">O que perguntar antes de comprar</h3>
          <p className="mt-1 text-13 text-muted-foreground">Vá marcando conforme o fornecedor responde.</p>
        </div>
        <ul className="grid gap-1.5">
          {PERGUNTAS.map((p, i) => (
            <li key={p}>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-control px-2 py-1.5 text-13 hover-fine:bg-muted">
                <input
                  type="checkbox"
                  checked={feitas.has(i)}
                  onChange={() =>
                    setFeitas((s) => {
                      const n = new Set(s);
                      if (n.has(i)) n.delete(i);
                      else n.add(i);
                      return n;
                    })
                  }
                  className="mt-0.5 size-4 accent-primary"
                />
                <span className={cn(feitas.has(i) && "text-muted-foreground line-through")}>{p}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="text-12 text-muted-foreground">
          Dica: peça amostra de 2 ou 3 fornecedores, teste no iPhone e no Android e só depois feche o lote. Quem vende para você precisa da placa funcionando de
          primeira.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------- Simulador de compra ------------------------------- */

function SimuladorSheet({
  oferta: o,
  f,
  precoVenda: precoInicial,
  nomeDono,
  onOpenChange,
  onRegistrar,
}: {
  oferta: Oferta | null;
  f: Fornecedor | undefined;
  precoVenda: number;
  nomeDono: string | null;
  onOpenChange: (o: boolean) => void;
  onRegistrar: (r: RascunhoPedido) => void;
}) {
  const [qtd, setQtd] = React.useState(50);
  const [frete, setFrete] = React.useState("");
  const [venda, setVenda] = React.useState("");
  React.useEffect(() => {
    if (!o) return;
    setQtd(Math.max(o.qtdMinima, f?.pedidoMinimo ?? 0, 50));
    setFrete("");
    setVenda(precoInicial ? precoInicial.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
  }, [o, f, precoInicial]);

  const s = o ? simularLote({ preco: o.preco, quantidade: qtd, frete: parseValor(frete), precoVenda: parseValor(venda) }) : null;
  const abaixoMin = o ? qtd < Math.max(o.qtdMinima, f?.pedidoMinimo ?? 0) : false;
  const wa = o ? waDoFornecedor(f, mensagemPedido({ fornecedor: f?.nome ?? "", placa: o.nome, quantidade: qtd, link: o.link, nome: nomeDono })) : null;

  return (
    <Sheet open={!!o} onOpenChange={onOpenChange} title="Simular compra" description={o ? `${o.nome} · ${f?.nome ?? ""}` : undefined}>
      {o && s && (
        <div className="grid gap-5">
          <div className="grid gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-13 font-medium text-subtle-foreground">Quantas placas</span>
              <span className="font-mono text-20 font-semibold tabular">{formatInt(qtd)}</span>
            </div>
            <input
              type="range"
              min={1}
              max={500}
              step={1}
              value={Math.min(qtd, 500)}
              onChange={(e) => setQtd(Number(e.target.value))}
              aria-label="Quantidade de placas"
              className="w-full accent-primary"
            />
            <div className="flex flex-wrap gap-1.5">
              {[10, 25, 50, 100, 200, 500].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={qtd === n}
                  onClick={() => setQtd(n)}
                  className={cn(
                    "h-8 rounded-full px-3 font-mono text-12 ring-1 transition-colors duration-150 coarse:h-10",
                    qtd === n ? "bg-primary text-primary-foreground ring-primary" : "bg-card/60 text-subtle-foreground ring-border",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            {abaixoMin && <p className="text-12 text-pending">Abaixo do mínimo deste fornecedor ({Math.max(o.qtdMinima, f?.pedidoMinimo ?? 0)} unidades).</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Frete do lote" htmlFor="s-frete" hint="Se tiver">
              <Input id="s-frete" value={frete} onChange={(e) => setFrete(e.target.value)} placeholder="0,00" inputMode="decimal" className="font-mono" />
            </Field>
            <Field label="Você vende cada por" htmlFor="s-venda">
              <Input id="s-venda" value={venda} onChange={(e) => setVenda(e.target.value)} placeholder="0,00" inputMode="decimal" className="font-mono" />
            </Field>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            {(
              [
                ["Você paga", formatBRL(s.total), `${formatBRL(s.custoUn)} cada`, false],
                ["Lucro por placa", formatBRL(s.lucroUn), s.margem != null ? `margem ${formatPct(s.margem)}` : "diga o preço de venda", s.lucroUn > 0],
                ["Lucro do lote", formatBRL(s.lucroLote), "vendendo todas", s.lucroLote > 0],
                [
                  "Se paga com",
                  s.vendasParaPagar != null ? `${s.vendasParaPagar} ${s.vendasParaPagar === 1 ? "venda" : "vendas"}` : "—",
                  s.vendasParaPagar != null ? "o resto é lucro" : "diga o preço de venda",
                  false,
                ],
              ] as const
            ).map(([r, v, l, bom]) => (
              <div key={r} className={cn("rounded-card p-3 ring-1 ring-border", bom && "bg-profit-soft ring-profit/30")}>
                <dt className="text-12 text-muted-foreground">{r}</dt>
                <dd className={cn("mt-1 font-mono text-20 font-semibold tabular", bom && "text-profit")}>{v}</dd>
                <p className="mt-0.5 text-11 text-muted-foreground">{l}</p>
              </div>
            ))}
          </dl>

          <div className="grid gap-2">
            {(o.link ?? f?.linkCompra) && (
              <Button asChild variant="primary">
                <a href={(o.link ?? f?.linkCompra)!} target="_blank" rel="noreferrer">
                  <ShoppingCart strokeWidth={1.75} /> Comprar no site
                </a>
              </Button>
            )}
            {wa && (
              <Button asChild>
                <a href={wa} target="_blank" rel="noreferrer">
                  <MessageCircle strokeWidth={1.75} /> Pedir {formatInt(qtd)} no WhatsApp
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() =>
                onRegistrar({
                  fornecedorId: o.fornecedorId,
                  ofertaId: o.id,
                  descricao: o.nome,
                  quantidade: qtd,
                  valorTotal: o.preco * qtd,
                  frete: parseValor(frete),
                })
              }
            >
              <ClipboardList strokeWidth={1.5} /> Já comprei: registrar pedido
            </Button>
          </div>
          <p className="text-11 text-muted-foreground">
            O preço de venda começa pela média das suas vendas.{" "}
            <Link href="/estoque" className="text-primary">
              Ver estoque
            </Link>
          </p>
        </div>
      )}
    </Sheet>
  );
}
