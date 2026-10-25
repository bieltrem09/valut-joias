"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowUpFromLine, ChevronLeft, ChevronRight, ImagePlus, Loader2, Plus, Scale, Star, Trash2, X } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field, Input, Select, fieldClass } from "@/components/ui/input";
import { excluirProdutos, historicoProduto, moverEstoque, salvarProduto } from "@/app/estoque/actions";
import { parseValor } from "@/components/vendas/nova-venda";
import type { ProdutoComFotos } from "@/lib/data/estoque";
import type { Movimento } from "@/lib/db/schema";
import { margem, situacao } from "@/lib/estoque";
import { comprimirImagem } from "@/lib/imagem";
import { formatBRL, formatInt, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX_FOTOS = 8;
const UNIDADES = ["un", "par", "kit", "cx", "pct", "m", "kg"];
const SUGESTOES_DETALHE = ["Cor", "Tamanho", "Material", "Modelo", "Marca", "Peso", "Medidas", "Garantia"];
const MOTIVOS = { entrada: ["Compra", "Devolução", "Produção"], saida: ["Venda", "Brinde", "Perda", "Uso próprio"], ajuste: ["Contagem"] } as const;

/** Foto na tela: já salva (id) ou recém-escolhida (arquivo comprimido + prévia). */
type FotoTela = { chave: string; id?: number; arquivo?: File; url: string };
type Detalhe = { chave: number; nome: string; valor: string };

const brl = (v: number) => (v ? v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");

export function ProdutoSheet({
  open,
  onOpenChange,
  produto,
  categorias,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  produto: ProdutoComFotos | null;
  categorias: string[];
}) {
  const [aba, setAba] = React.useState<"detalhes" | "estoque">("detalhes");
  React.useEffect(() => {
    if (open) setAba("detalhes");
  }, [open, produto?.id]);
  const reduce = useReducedMotion();

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={produto ? produto.nome : "Novo produto"}
      description={
        produto ? [produto.sku, produto.categoria].filter(Boolean).join(" · ") || undefined : "Foto, preço e tudo que você precisa saber para vender."
      }
    >
      {produto && (
        <LayoutGroup id="abas-produto">
          <div role="tablist" className="mb-5 flex gap-1 rounded-full bg-muted p-1">
            {(
              [
                ["detalhes", "Detalhes"],
                ["estoque", `Estoque · ${formatInt(produto.quantidade)} ${produto.unidade}`],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={aba === k}
                onClick={() => setAba(k)}
                className={cn(
                  "relative h-9 flex-1 rounded-full text-13 font-medium outline-hidden focus-visible:ring-2 focus-visible:ring-ring coarse:h-11",
                  aba === k ? "text-foreground" : "text-muted-foreground hover-fine:text-foreground",
                )}
              >
                {aba === k && (
                  <motion.span
                    layoutId="aba-produto"
                    className="absolute inset-0 rounded-full bg-card shadow-hairline"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative">{l}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      )}
      {aba === "detalhes" || !produto ? (
        <FormProduto key={produto?.id ?? "novo"} produto={produto} categorias={categorias} onDone={() => onOpenChange(false)} />
      ) : (
        <AbaEstoque key={produto.id} produto={produto} />
      )}
    </Sheet>
  );
}

/* --------------------------------- Detalhes --------------------------------- */

function FormProduto({ produto: p, categorias, onDone }: { produto: ProdutoComFotos | null; categorias: string[]; onDone: () => void }) {
  const router = useRouter();
  const seq = React.useRef(1);
  const [fotos, setFotos] = React.useState<FotoTela[]>(() => (p?.fotos ?? []).map((id) => ({ chave: `id:${id}`, id, url: `/api/estoque/foto/${id}` })));
  const [preparando, setPreparando] = React.useState(0);
  const [arrastando, setArrastando] = React.useState(false);
  const [nome, setNome] = React.useState(p?.nome ?? "");
  const [sku, setSku] = React.useState(p?.sku ?? "");
  const [categoria, setCategoria] = React.useState(p?.categoria ?? "");
  const [descricao, setDescricao] = React.useState(p?.descricao ?? "");
  const [preco, setPreco] = React.useState(brl(p?.preco ?? 0));
  const [custo, setCusto] = React.useState(brl(p?.custo ?? 0));
  const [quantidade, setQuantidade] = React.useState("");
  const [minimo, setMinimo] = React.useState(p ? String(p.estoqueMinimo) : "");
  const [unidade, setUnidade] = React.useState(p?.unidade ?? "un");
  const [fornecedor, setFornecedor] = React.useState(p?.fornecedor ?? "");
  const [localizacao, setLocalizacao] = React.useState(p?.localizacao ?? "");
  const [detalhes, setDetalhes] = React.useState<Detalhe[]>(() => (p?.atributos ?? []).map((a) => ({ chave: seq.current++, ...a })));
  const [erro, setErro] = React.useState<string>();
  const [salvando, setSalvando] = React.useState(false);
  const [confirmarExcluir, setConfirmarExcluir] = React.useState(false);
  const inputFoto = React.useRef<HTMLInputElement>(null);

  // Libera as prévias locais ao sair.
  const fotosRef = React.useRef(fotos);
  fotosRef.current = fotos;
  React.useEffect(() => () => fotosRef.current.forEach((f) => f.arquivo && URL.revokeObjectURL(f.url)), []);

  const adicionarArquivos = async (lista: FileList | File[]) => {
    const arquivos = [...lista].slice(0, Math.max(0, MAX_FOTOS - fotos.length));
    if (lista.length > arquivos.length) toast(`Cabem ${MAX_FOTOS} fotos por produto.`);
    setPreparando((n) => n + arquivos.length);
    for (const a of arquivos) {
      try {
        const f = await comprimirImagem(a);
        setFotos((fs) => [...fs, { chave: `novo:${seq.current++}`, arquivo: f, url: URL.createObjectURL(f) }]);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setPreparando((n) => n - 1);
      }
    }
  };

  const mover = (i: number, d: number) =>
    setFotos((fs) => {
      const j = i + d;
      if (j < 0 || j >= fs.length) return fs;
      const n = [...fs];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  const vPreco = parseValor(preco);
  const vCusto = parseValor(custo);
  const m = margem(vPreco, vCusto);

  const salvar = async () => {
    setErro(undefined);
    if (preparando) return setErro("Espere as fotos terminarem de carregar.");
    const fd = new FormData();
    const novos = fotos.filter((f) => f.arquivo);
    fd.set("ordem", JSON.stringify(fotos.map((f) => (f.id ? `id:${f.id}` : `novo:${novos.indexOf(f)}`))));
    novos.forEach((f) => fd.append("foto", f.arquivo!));
    fd.set(
      "dados",
      JSON.stringify({
        id: p?.id,
        nome,
        sku,
        categoria,
        descricao,
        preco: vPreco,
        custo: vCusto,
        quantidade: p ? 0 : Number(quantidade || 0),
        estoqueMinimo: Number(minimo || 0),
        unidade,
        fornecedor,
        localizacao,
        atributos: detalhes.map(({ nome, valor }) => ({ nome, valor })),
      }),
    );
    setSalvando(true);
    try {
      const r = await salvarProduto(fd);
      if (!r.ok) return setErro(r.error);
      toast.success(p ? "Produto atualizado" : `${nome.trim()} entrou no estoque`);
      router.refresh();
      onDone();
    } catch {
      setErro("Não deu para salvar. Se tiver muitas fotos grandes, tente salvar com menos de uma vez.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        salvar();
      }}
      noValidate
    >
      {/* Fotos */}
      <section aria-labelledby="fotos-t" className="grid gap-2">
        <div className="flex items-baseline justify-between">
          <h3 id="fotos-t" className="text-13 font-medium text-subtle-foreground">
            Fotos
          </h3>
          <span className="font-mono text-11 text-muted-foreground tabular">
            {fotos.length}/{MAX_FOTOS}
          </span>
        </div>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            if (e.dataTransfer.files.length) adicionarArquivos(e.dataTransfer.files);
          }}
          className={cn(
            "grid grid-cols-3 gap-2 rounded-card p-1 transition-colors duration-150 sm:grid-cols-4",
            arrastando && "bg-accent/60 ring-2 ring-primary",
          )}
        >
          {fotos.map((f, i) => (
            <figure key={f.chave} className="group relative aspect-square overflow-hidden rounded-control bg-muted ring-1 ring-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={`Foto ${i + 1} de ${nome || "produto"}`} className="size-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">Capa</span>
              )}
              <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1 opacity-100 transition-opacity duration-150 hover-fine:opacity-0 hover-fine:group-hover:opacity-100 hover-fine:group-focus-within:opacity-100">
                <div className="flex gap-1">
                  {i > 0 && (
                    <FotoBotao rotulo="Tornar capa" onClick={() => setFotos((fs) => [fs[i], ...fs.filter((_, k) => k !== i)])}>
                      <Star className="size-3.5" strokeWidth={1.75} />
                    </FotoBotao>
                  )}
                  {i > 0 && (
                    <FotoBotao rotulo="Mover para a esquerda" onClick={() => mover(i, -1)}>
                      <ChevronLeft className="size-3.5" strokeWidth={1.75} />
                    </FotoBotao>
                  )}
                  {i < fotos.length - 1 && (
                    <FotoBotao rotulo="Mover para a direita" onClick={() => mover(i, 1)}>
                      <ChevronRight className="size-3.5" strokeWidth={1.75} />
                    </FotoBotao>
                  )}
                </div>
                <FotoBotao
                  rotulo="Remover foto"
                  onClick={() => {
                    if (f.arquivo) URL.revokeObjectURL(f.url);
                    setFotos((fs) => fs.filter((x) => x.chave !== f.chave));
                  }}
                >
                  <X className="size-3.5" strokeWidth={1.75} />
                </FotoBotao>
              </div>
            </figure>
          ))}
          {Array.from({ length: preparando }, (_, i) => (
            <div key={`p${i}`} className="grid aspect-square place-items-center rounded-control bg-muted ring-1 ring-border">
              <Loader2 className="size-5 animate-spin text-muted-foreground motion-reduce:animate-none" strokeWidth={1.5} />
            </div>
          ))}
          {fotos.length + preparando < MAX_FOTOS && (
            <button
              type="button"
              onClick={() => inputFoto.current?.click()}
              className="grid aspect-square place-items-center content-center gap-1 rounded-control border border-dashed border-border text-12 text-muted-foreground transition-[background-color,color,transform] duration-150 ease-out-strong hover-fine:bg-muted hover-fine:text-foreground active:scale-[0.97]"
            >
              <ImagePlus className="size-5" strokeWidth={1.5} />
              {fotos.length ? "Adicionar" : "Foto do produto"}
            </button>
          )}
        </div>
        <input
          ref={inputFoto}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            if (e.target.files?.length) adicionarArquivos(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-11 text-muted-foreground">A primeira é a capa. Arraste fotos para cá ou tire na hora pelo celular.</p>
      </section>

      {/* Básico */}
      <section className="grid gap-4">
        <Field label="Nome do produto" htmlFor="p-nome">
          <Input id="p-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Placa NFC Avaliação Google" autoComplete="off" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Código (SKU)" htmlFor="p-sku" hint="Opcional">
            <Input id="p-sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="NFC-GOOGLE-01" className="font-mono" autoComplete="off" />
          </Field>
          <Field label="Categoria" htmlFor="p-cat" hint="Opcional">
            <Input id="p-cat" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex.: Placas" list="p-cats" autoComplete="off" />
            <datalist id="p-cats">
              {categorias.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
        </div>
        <Field label="Descrição" htmlFor="p-desc" hint="O que você fala para o cliente: para que serve, diferenciais.">
          <textarea
            id="p-desc"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className={cn(fieldClass, "h-auto resize-y py-2.5 leading-snug")}
            placeholder="Ex.: Placa em acrílico com chip NFC e QR Code. O cliente aproxima o celular e cai direto na avaliação."
          />
        </Field>
      </section>

      {/* Preço */}
      <section className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Preço de venda" htmlFor="p-preco">
            <Input id="p-preco" value={preco} onChange={(e) => setPreco(e.target.value)} inputMode="decimal" placeholder="0,00" className="font-mono" />
          </Field>
          <Field label="Custo por unidade" htmlFor="p-custo">
            <Input id="p-custo" value={custo} onChange={(e) => setCusto(e.target.value)} inputMode="decimal" placeholder="0,00" className="font-mono" />
          </Field>
        </div>
        <p className="flex flex-wrap items-center gap-2 text-12 text-muted-foreground" aria-live="polite">
          {m != null ? (
            <>
              <Chip tone={m < 0 ? "cost" : m < 0.3 ? "pending" : "profit"}>Margem {formatPct(m)}</Chip>
              <span>
                Lucro de <span className="font-mono text-foreground tabular">{formatBRL(vPreco - vCusto)}</span> por {unidade}
              </span>
            </>
          ) : (
            "Coloque o preço para ver a margem."
          )}
        </p>
      </section>

      {/* Estoque */}
      <section className="grid gap-3">
        <div className="grid grid-cols-3 gap-3">
          {!p && (
            <Field label="Quantidade" htmlFor="p-qtd" hint="Em mãos hoje">
              <Input
                id="p-qtd"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="0"
                className="font-mono"
              />
            </Field>
          )}
          <Field label="Estoque mínimo" htmlFor="p-min" hint="Avisa quando chegar">
            <Input
              id="p-min"
              value={minimo}
              onChange={(e) => setMinimo(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="0"
              className="font-mono"
            />
          </Field>
          <Field label="Unidade" htmlFor="p-un" hint="Como você conta">
            <Select id="p-un" value={unidade} onChange={(e) => setUnidade(e.target.value)}>
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {p && <p className="text-11 text-muted-foreground">A quantidade muda na aba Estoque, com entrada, saída ou contagem. Assim fica o histórico.</p>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fornecedor" htmlFor="p-forn" hint="Opcional">
            <Input id="p-forn" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} placeholder="De quem você compra" autoComplete="off" />
          </Field>
          <Field label="Onde fica guardado" htmlFor="p-loc" hint="Opcional">
            <Input
              id="p-loc"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Ex.: Caixa 2, prateleira de cima"
              autoComplete="off"
            />
          </Field>
        </div>
      </section>

      {/* Detalhes livres */}
      <section aria-labelledby="det-t" className="grid gap-2">
        <h3 id="det-t" className="text-13 font-medium text-subtle-foreground">
          Detalhes do produto
        </h3>
        {detalhes.map((d) => (
          <div key={d.chave} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] gap-2">
            <Input
              value={d.nome}
              onChange={(e) => setDetalhes((ds) => ds.map((x) => (x.chave === d.chave ? { ...x, nome: e.target.value } : x)))}
              placeholder="Ex.: Cor"
              aria-label="Nome do detalhe"
            />
            <Input
              value={d.valor}
              onChange={(e) => setDetalhes((ds) => ds.map((x) => (x.chave === d.chave ? { ...x, valor: e.target.value } : x)))}
              placeholder="Ex.: Preto fosco"
              aria-label={`Valor de ${d.nome || "detalhe"}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remover detalhe"
              onClick={() => setDetalhes((ds) => ds.filter((x) => x.chave !== d.chave))}
            >
              <X strokeWidth={1.5} />
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-1.5">
          {SUGESTOES_DETALHE.filter((s) => !detalhes.some((d) => d.nome.toLowerCase() === s.toLowerCase())).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setDetalhes((ds) => [...ds, { chave: seq.current++, nome: s, valor: "" }])}
              className="h-7 rounded-full px-2.5 text-12 text-muted-foreground ring-1 ring-border transition-[background-color,color,transform] duration-150 ease-out-strong hover-fine:bg-accent hover-fine:text-accent-foreground active:scale-[0.96] coarse:h-9"
            >
              + {s}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDetalhes((ds) => [...ds, { chave: seq.current++, nome: "", valor: "" }])}
            className="flex h-7 items-center gap-1 rounded-full px-2.5 text-12 font-medium text-primary ring-1 ring-primary/40 transition-transform duration-150 active:scale-[0.96] coarse:h-9"
          >
            <Plus className="size-3.5" strokeWidth={1.75} /> Outro
          </button>
        </div>
      </section>

      {erro && (
        <p className="text-13 text-destructive" role="alert">
          {erro}
        </p>
      )}

      <div className="sticky -bottom-5 -mx-6 flex items-center gap-2 border-t border-border bg-background/95 px-6 py-4 backdrop-blur">
        {p &&
          (confirmarExcluir ? (
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                const r = await excluirProdutos([p.id]);
                if (!r.ok) return toast.error(r.error);
                toast.success(`${p.nome} saiu do estoque`);
                router.refresh();
                onDone();
              }}
            >
              Confirmar exclusão
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setConfirmarExcluir(true)} aria-label="Excluir produto">
              <Trash2 strokeWidth={1.5} />
              <span className="hidden sm:inline">Excluir</span>
            </Button>
          ))}
        <Button type="submit" variant="primary" className="ml-auto min-w-36" disabled={salvando || preparando > 0}>
          {salvando && <Loader2 className="animate-spin motion-reduce:animate-none" strokeWidth={1.5} />}
          {salvando ? "Salvando…" : p ? "Salvar" : "Adicionar ao estoque"}
        </Button>
      </div>
    </form>
  );
}

function FotoBotao({ rotulo, onClick, children }: { rotulo: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      title={rotulo}
      className="grid size-7 place-items-center rounded-full bg-background/85 text-foreground shadow-hairline backdrop-blur transition-transform duration-150 active:scale-[0.9] coarse:size-9"
    >
      {children}
    </button>
  );
}

/* ---------------------------------- Estoque ---------------------------------- */

function AbaEstoque({ produto: p }: { produto: ProdutoComFotos }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [tipo, setTipo] = React.useState<"entrada" | "saida" | "ajuste">("entrada");
  const [qtd, setQtd] = React.useState("");
  const [motivo, setMotivo] = React.useState<string>("Compra");
  const [saldo, setSaldo] = React.useState(p.quantidade);
  const [hist, setHist] = React.useState<Movimento[] | null>(null);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string>();

  const carregar = React.useCallback(() => {
    historicoProduto(p.id).then(setHist, () => setHist([]));
  }, [p.id]);
  React.useEffect(carregar, [carregar]);

  const sit = situacao(saldo, p.estoqueMinimo);
  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(undefined);
    const n = Number(qtd);
    if (!qtd || !Number.isFinite(n) || (tipo !== "ajuste" && n <= 0)) return setErro("Informe a quantidade.");
    setSalvando(true);
    const r = await moverEstoque(p.id, tipo, n, motivo);
    setSalvando(false);
    if (!r.ok) return setErro(r.error);
    setSaldo(r.data!.saldo);
    setQtd("");
    toast.success(tipo === "entrada" ? `+${n} ${p.unidade}` : tipo === "saida" ? `−${n} ${p.unidade}` : `Contagem: ${n} ${p.unidade}`, {
      description: `Agora tem ${formatInt(r.data!.saldo)} ${p.unidade}.`,
    });
    carregar();
    router.refresh();
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4 rounded-card bg-card p-5 ring-1 ring-border">
        <div>
          <p className="text-12 text-muted-foreground">Em estoque agora</p>
          <p className="mt-1 font-mono text-[40px] leading-none font-semibold tracking-[-0.02em] tabular">
            {formatInt(saldo)} <span className="text-16 font-normal text-muted-foreground">{p.unidade}</span>
          </p>
          <p className="mt-2 text-12 text-muted-foreground">
            Vale <span className="font-mono text-foreground tabular">{formatBRL(Math.max(0, saldo) * p.preco)}</span> para vender · custou{" "}
            <span className="font-mono tabular">{formatBRL(Math.max(0, saldo) * p.custo)}</span>
          </p>
        </div>
        <SituacaoChip situacao={sit} minimo={p.estoqueMinimo} />
      </div>

      <form onSubmit={registrar} className="grid gap-3">
        <LayoutGroup id="tipo-mov">
          <div role="radiogroup" aria-label="Tipo" className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
            {(
              [
                ["entrada", ArrowDownToLine, "Entrada"],
                ["saida", ArrowUpFromLine, "Saída"],
                ["ajuste", Scale, "Contagem"],
              ] as const
            ).map(([k, Icone, l]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={tipo === k}
                onClick={() => {
                  setTipo(k);
                  setMotivo(MOTIVOS[k][0]);
                }}
                className={cn(
                  "relative flex h-9 items-center justify-center gap-1.5 rounded-full text-13 font-medium outline-hidden focus-visible:ring-2 focus-visible:ring-ring coarse:h-11",
                  tipo === k ? "text-foreground" : "text-muted-foreground hover-fine:text-foreground",
                )}
              >
                {tipo === k && (
                  <motion.span
                    layoutId="tipo-pill"
                    className="absolute inset-0 rounded-full bg-card shadow-hairline"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icone className="relative size-4" strokeWidth={1.5} />
                <span className="relative">{l}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-3">
          <Field label={tipo === "ajuste" ? "Contei" : "Quantidade"} htmlFor="mov-qtd" hint={tipo === "ajuste" ? "O total que tem de verdade" : undefined}>
            <Input
              id="mov-qtd"
              value={qtd}
              onChange={(e) => setQtd(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="0"
              className="font-mono"
              autoFocus
            />
          </Field>
          <Field label="Motivo" htmlFor="mov-mot">
            <Input id="mov-mot" value={motivo} onChange={(e) => setMotivo(e.target.value)} list="mov-mots" autoComplete="off" />
            <datalist id="mov-mots">
              {MOTIVOS[tipo].map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Field>
        </div>
        {erro && (
          <p className="text-13 text-destructive" role="alert">
            {erro}
          </p>
        )}
        <Button type="submit" variant="primary" disabled={salvando}>
          {salvando && <Loader2 className="animate-spin motion-reduce:animate-none" strokeWidth={1.5} />}
          {tipo === "entrada" ? "Registrar entrada" : tipo === "saida" ? "Registrar saída" : "Salvar contagem"}
        </Button>
      </form>

      <section aria-labelledby="hist-t" className="grid gap-2">
        <h3 id="hist-t" className="text-13 font-medium text-subtle-foreground">
          Histórico
        </h3>
        {hist === null ? (
          <p className="text-12 text-muted-foreground">Carregando…</p>
        ) : hist.length === 0 ? (
          <p className="text-12 text-muted-foreground">Nenhuma movimentação ainda.</p>
        ) : (
          <ol className="divide-y divide-border rounded-card ring-1 ring-border">
            {hist.map((h) => (
              <li key={h.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={cn("w-14 font-mono text-14 font-medium tabular", h.delta > 0 ? "text-profit" : "text-cost")}>
                  {h.delta > 0 ? "+" : "−"}
                  {formatInt(Math.abs(h.delta))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-13">{h.motivo ?? (h.tipo === "entrada" ? "Entrada" : h.tipo === "saida" ? "Saída" : "Contagem")}</span>
                  <span className="block text-11 text-muted-foreground">
                    {new Date(h.criadoEm).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/Sao_Paulo",
                    })}
                  </span>
                </span>
                <span className="font-mono text-12 text-muted-foreground tabular">saldo {formatInt(h.saldo)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

export function SituacaoChip({ situacao: s, minimo }: { situacao: ReturnType<typeof situacao>; minimo: number }) {
  if (s === "esgotado") return <Chip tone="cost">Esgotado</Chip>;
  if (s === "baixo") return <Chip tone="pending">Baixo · mín. {minimo}</Chip>;
  return <Chip tone="profit">Em estoque</Chip>;
}
