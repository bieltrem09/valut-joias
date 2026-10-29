"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Link2, Loader2, Package, Star, Trash2, Wand2, X } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, fieldClass } from "@/components/ui/input";
import { parseValor } from "@/components/vendas/nova-venda";
import {
  excluirFornecedor,
  excluirOferta,
  excluirPedido,
  lerLinkProduto,
  mudarStatusPedido,
  salvarFornecedor,
  salvarOferta,
  salvarPedido,
} from "@/app/fornecedores/actions";
import type { Fornecedor, Oferta, PedidoCompra } from "@/lib/data/fornecedores";
import { MATERIAIS, TIPOS_PLACA, custoUnitario } from "@/lib/fornecedores";
import { comprimirImagem } from "@/lib/imagem";
import { formatBRL } from "@/lib/format";
import { todaySP, addDays } from "@/lib/dates";
import { cn } from "@/lib/utils";

const brl = (v: number | null | undefined) => (v ? v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");

/** Barra de salvar no pé do formulário (com excluir em dois toques). */
function Rodape({ salvando, onExcluir, rotulo }: { salvando: boolean; onExcluir?: () => Promise<void>; rotulo: string }) {
  const [confirmar, setConfirmar] = React.useState(false);
  const [excluindo, setExcluindo] = React.useState(false);
  return (
    <div className="sticky -bottom-5 -mx-6 flex items-center gap-2 border-t border-border bg-background/95 px-6 py-4 backdrop-blur">
      {onExcluir &&
        (confirmar ? (
          <Button
            type="button"
            variant="destructive"
            disabled={excluindo}
            onClick={async () => {
              setExcluindo(true);
              await onExcluir();
              setExcluindo(false);
            }}
          >
            {excluindo ? <Loader2 className="animate-spin" /> : <Trash2 strokeWidth={1.5} />} Confirmar
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={() => setConfirmar(true)}>
            <Trash2 strokeWidth={1.5} /> Excluir
          </Button>
        ))}
      <Button type="submit" variant="primary" className="ml-auto" disabled={salvando}>
        {salvando && <Loader2 className="animate-spin" />} {rotulo}
      </Button>
    </div>
  );
}

function Erro({ msg }: { msg?: string }) {
  return msg ? (
    <p className="text-13 text-destructive" role="alert">
      {msg}
    </p>
  ) : null;
}

/* --------------------------------- Fornecedor --------------------------------- */

export function FornecedorSheet({ open, onOpenChange, fornecedor }: { open: boolean; onOpenChange: (o: boolean) => void; fornecedor: Fornecedor | null }) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={fornecedor ? fornecedor.nome : "Novo fornecedor"}
      description={fornecedor ? fornecedor.cidade || undefined : "Quem vende as placas para você: contato, prazo e condições."}
    >
      <FormFornecedor key={fornecedor?.id ?? "novo"} f={fornecedor} onDone={() => onOpenChange(false)} />
    </Sheet>
  );
}

function FormFornecedor({ f, onDone }: { f: Fornecedor | null; onDone: () => void }) {
  const router = useRouter();
  const [nome, setNome] = React.useState(f?.nome ?? "");
  const [whatsapp, setWhatsapp] = React.useState(f?.whatsapp ?? "");
  const [site, setSite] = React.useState(f?.site ?? "");
  const [instagram, setInstagram] = React.useState(f?.instagram ?? "");
  const [cidade, setCidade] = React.useState(f?.cidade ?? "");
  const [prazo, setPrazo] = React.useState(f?.prazoDias != null ? String(f.prazoDias) : "");
  const [minimo, setMinimo] = React.useState(f?.pedidoMinimo != null ? String(f.pedidoMinimo) : "");
  const [frete, setFrete] = React.useState(f?.frete ?? "");
  const [nota, setNota] = React.useState<number | null>(f?.nota ?? null);
  const [obs, setObs] = React.useState(f?.observacoes ?? "");
  const [erro, setErro] = React.useState<string>();
  const [salvando, setSalvando] = React.useState(false);

  const salvar = async () => {
    setErro(undefined);
    setSalvando(true);
    const r = await salvarFornecedor({
      id: f?.id,
      nome,
      whatsapp,
      site,
      instagram,
      cidade,
      prazoDias: prazo,
      pedidoMinimo: minimo,
      frete,
      nota,
      observacoes: obs,
    });
    setSalvando(false);
    if (!r.ok) return setErro(r.error);
    toast.success(f ? "Fornecedor atualizado" : `${nome.trim()} entrou nos seus fornecedores`);
    router.refresh();
    onDone();
  };

  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        salvar();
      }}
    >
      <Field label="Nome" htmlFor="f-nome">
        <Input id="f-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Gráfica Prime NFC" autoComplete="off" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="WhatsApp" htmlFor="f-wa" hint="Com DDD">
          <Input id="f-wa" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-0000" inputMode="tel" autoComplete="off" />
        </Field>
        <Field label="Cidade" htmlFor="f-cid" hint="Opcional">
          <Input id="f-cid" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex.: São Paulo, SP" autoComplete="off" />
        </Field>
        <Field label="Site ou loja" htmlFor="f-site" hint="Opcional">
          <Input id="f-site" value={site} onChange={(e) => setSite(e.target.value)} placeholder="loja.com.br" inputMode="url" autoComplete="off" />
        </Field>
        <Field label="Instagram" htmlFor="f-ig" hint="Opcional">
          <Input id="f-ig" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@loja" autoComplete="off" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prazo de entrega" htmlFor="f-prazo" hint="Em dias">
          <Input id="f-prazo" value={prazo} onChange={(e) => setPrazo(e.target.value.replace(/\D/g, ""))} placeholder="Ex.: 7" inputMode="numeric" />
        </Field>
        <Field label="Pedido mínimo" htmlFor="f-min" hint="Em unidades">
          <Input id="f-min" value={minimo} onChange={(e) => setMinimo(e.target.value.replace(/\D/g, ""))} placeholder="Ex.: 10" inputMode="numeric" />
        </Field>
      </div>
      <Field label="Frete" htmlFor="f-frete" hint="Como funciona: grátis acima de X, valor fixo, retirada…">
        <Input id="f-frete" value={frete} onChange={(e) => setFrete(e.target.value)} placeholder="Ex.: Grátis acima de 50 unidades" autoComplete="off" />
      </Field>
      <div className="grid gap-1.5">
        <span className="text-13 font-medium text-subtle-foreground">Sua nota para ele</span>
        <div className="flex gap-1" role="radiogroup" aria-label="Nota">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={nota === n}
              aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
              onClick={() => setNota(nota === n ? null : n)}
              className="grid size-9 place-items-center rounded-control transition-transform duration-150 active:scale-[0.9] hover-fine:bg-muted coarse:size-11"
            >
              <Star className={cn("size-5", nota && n <= nota ? "fill-pending text-pending" : "text-muted-foreground")} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>
      <Field label="Anotações" htmlFor="f-obs" hint="Qualidade, atendimento, formas de pagamento, chip usado…">
        <textarea
          id="f-obs"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          rows={3}
          className={cn(fieldClass, "h-auto resize-y py-2.5 leading-snug")}
          placeholder="Ex.: Chip NTAG215, acrílico bom, aceita Pix com 5% de desconto."
        />
      </Field>
      <Erro msg={erro} />
      <Rodape
        salvando={salvando}
        rotulo={f ? "Salvar" : "Adicionar fornecedor"}
        onExcluir={
          f
            ? async () => {
                const r = await excluirFornecedor(f.id);
                if (!r.ok) return void toast.error(r.error);
                toast.success("Fornecedor excluído");
                router.refresh();
                onDone();
              }
            : undefined
        }
      />
    </form>
  );
}

/* ----------------------------------- Placa ----------------------------------- */

export function OfertaSheet({
  open,
  onOpenChange,
  oferta,
  fornecedores,
  fornecedorInicial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  oferta: Oferta | null;
  fornecedores: Fornecedor[];
  fornecedorInicial?: number | null;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={oferta ? oferta.nome : "Nova placa"}
      description={oferta ? undefined : "Cole o link da placa e o painel puxa a foto, o nome e o preço."}
    >
      <FormOferta
        key={oferta?.id ?? `novo-${fornecedorInicial ?? ""}`}
        o={oferta}
        fornecedores={fornecedores}
        fornecedorInicial={fornecedorInicial}
        onDone={() => onOpenChange(false)}
      />
    </Sheet>
  );
}

function FormOferta({
  o,
  fornecedores,
  fornecedorInicial,
  onDone,
}: {
  o: Oferta | null;
  fornecedores: Fornecedor[];
  fornecedorInicial?: number | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [fornecedorId, setFornecedorId] = React.useState(String(o?.fornecedorId ?? fornecedorInicial ?? fornecedores[0]?.id ?? ""));
  const [link, setLink] = React.useState(o?.link ?? "");
  const [nome, setNome] = React.useState(o?.nome ?? "");
  const [descricao, setDescricao] = React.useState(o?.descricao ?? "");
  const [tipo, setTipo] = React.useState(o?.tipo ?? "NFC + QR Code");
  const [material, setMaterial] = React.useState(o?.material ?? "Acrílico");
  const [preco, setPreco] = React.useState(brl(o?.preco));
  const [qtdMinima, setQtdMinima] = React.useState(String(o?.qtdMinima ?? 1));
  const [imagemUrl, setImagemUrl] = React.useState(o?.imagemUrl ?? "");
  const [arquivo, setArquivo] = React.useState<{ file: File; url: string } | null>(null);
  const [semFoto, setSemFoto] = React.useState(false);
  const [lendo, setLendo] = React.useState(false);
  const [erro, setErro] = React.useState<string>();
  const [salvando, setSalvando] = React.useState(false);
  const inputFoto = React.useRef<HTMLInputElement>(null);
  React.useEffect(
    () => () => {
      if (arquivo) URL.revokeObjectURL(arquivo.url);
    },
    [arquivo],
  );

  const previa = semFoto ? null : (arquivo?.url ?? (o?.foto && imagemUrl === (o.imagemUrl ?? "") ? o.foto : null) ?? (imagemUrl || null));

  const lerLink = async () => {
    if (!link.trim()) return setErro("Cole o link da página da placa primeiro.");
    setErro(undefined);
    setLendo(true);
    const r = await lerLinkProduto(link);
    setLendo(false);
    if (!r.ok) return setErro(r.error);
    const d = r.data!;
    if (d.titulo) setNome(d.titulo);
    if (d.descricao && !descricao.trim()) setDescricao(d.descricao);
    if (d.preco) setPreco(brl(d.preco));
    if (d.imagem) {
      setImagemUrl(d.imagem);
      setArquivo(null);
      setSemFoto(false);
    }
    toast.success("Dados puxados do link", { description: "Confira o preço: em lojas com variação ele pode ser o da menor opção." });
  };

  const salvar = async () => {
    setErro(undefined);
    const fd = new FormData();
    fd.set(
      "dados",
      JSON.stringify({
        id: o?.id,
        fornecedorId: Number(fornecedorId),
        nome,
        descricao,
        link,
        tipo,
        material,
        preco: parseValor(preco),
        qtdMinima,
        imagemUrl: semFoto ? "" : imagemUrl,
      }),
    );
    if (arquivo) fd.set("foto", arquivo.file);
    if (semFoto) fd.set("semFoto", "1");
    setSalvando(true);
    try {
      const r = await salvarOferta(fd);
      if (!r.ok) return setErro(r.error);
      toast.success(o ? "Placa atualizada" : "Placa adicionada à vitrine");
      router.refresh();
      onDone();
    } catch {
      setErro("Não deu para salvar. Tente uma foto menor.");
    } finally {
      setSalvando(false);
    }
  };

  if (!fornecedores.length)
    return (
      <div className="grid justify-items-center gap-2 py-10 text-center">
        <Package className="size-6 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-14 font-medium">Cadastre um fornecedor primeiro</p>
        <p className="text-13 text-muted-foreground">A placa fica ligada a quem vende.</p>
      </div>
    );

  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        salvar();
      }}
    >
      <Field label="Link direto para comprar" htmlFor="o-link" hint="Página da placa no site, Mercado Livre, Shopee…">
        <div className="flex gap-2">
          <div className="relative flex min-w-0 flex-1 items-center">
            <Link2 className="pointer-events-none absolute left-3 size-4 text-muted-foreground" strokeWidth={1.5} />
            <Input
              id="o-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
              inputMode="url"
              autoComplete="off"
              className="pl-9"
            />
          </div>
          <Button type="button" onClick={lerLink} disabled={lendo || !link.trim()} title="Puxar foto, nome e preço da página">
            {lendo ? <Loader2 className="animate-spin" /> : <Wand2 strokeWidth={1.5} />} Preencher
          </Button>
        </div>
      </Field>

      <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-3">
        <div className="grid gap-1.5">
          <span className="text-13 font-medium text-subtle-foreground">Foto</span>
          <div className="relative aspect-square overflow-hidden rounded-control bg-muted ring-1 ring-border">
            {previa ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previa} alt="Foto da placa" referrerPolicy="no-referrer" className="size-full object-cover" />
                <button
                  type="button"
                  aria-label="Tirar foto"
                  onClick={() => {
                    setArquivo(null);
                    setImagemUrl("");
                    setSemFoto(true);
                  }}
                  className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-background/85 text-foreground backdrop-blur"
                >
                  <X className="size-3.5" strokeWidth={1.75} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => inputFoto.current?.click()}
                className="grid size-full place-items-center content-center gap-1 text-11 text-muted-foreground hover-fine:text-foreground"
              >
                <ImagePlus className="size-5" strokeWidth={1.5} /> Escolher
              </button>
            )}
          </div>
          {previa && (
            <button type="button" onClick={() => inputFoto.current?.click()} className="text-11 font-medium text-primary">
              Trocar foto
            </button>
          )}
          <input
            ref={inputFoto}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={async (e) => {
              const a = e.target.files?.[0];
              e.target.value = "";
              if (!a) return;
              try {
                const f = await comprimirImagem(a);
                setArquivo({ file: f, url: URL.createObjectURL(f) });
                setSemFoto(false);
              } catch (err) {
                toast.error((err as Error).message);
              }
            }}
          />
        </div>
        <div className="grid content-start gap-3">
          <Field label="Nome da placa" htmlFor="o-nome">
            <Input id="o-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Placa NFC acrílico 10x10" autoComplete="off" />
          </Field>
          <Field label="Fornecedor" htmlFor="o-forn">
            <Select id="o-forn" value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)}>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Preço por unidade" htmlFor="o-preco">
          <Input id="o-preco" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0,00" inputMode="decimal" className="font-mono" />
        </Field>
        <Field label="Compra mínima" htmlFor="o-min" hint="Unidades">
          <Input id="o-min" value={qtdMinima} onChange={(e) => setQtdMinima(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="font-mono" />
        </Field>
        <Field label="Tipo" htmlFor="o-tipo">
          <Select id="o-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_PLACA.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Material" htmlFor="o-mat">
          <Select id="o-mat" value={material} onChange={(e) => setMaterial(e.target.value)}>
            {MATERIAIS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Descrição" htmlFor="o-desc" hint="Tamanho, chip, acabamento, se vem gravada…">
        <textarea
          id="o-desc"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
          className={cn(fieldClass, "h-auto resize-y py-2.5 leading-snug")}
          placeholder="Ex.: Acrílico 3 mm, 10x10 cm, chip NTAG213, QR Code impresso, base adesiva."
        />
      </Field>
      <Erro msg={erro} />
      <Rodape
        salvando={salvando}
        rotulo={o ? "Salvar" : "Adicionar à vitrine"}
        onExcluir={
          o
            ? async () => {
                const r = await excluirOferta(o.id);
                if (!r.ok) return void toast.error(r.error);
                toast.success("Placa tirada da vitrine");
                router.refresh();
                onDone();
              }
            : undefined
        }
      />
    </form>
  );
}

/* ---------------------------------- Pedido ---------------------------------- */

export type RascunhoPedido = { fornecedorId?: number; ofertaId?: number | null; descricao?: string; quantidade?: number; valorTotal?: number; frete?: number };

export function PedidoSheet({
  open,
  onOpenChange,
  pedido,
  rascunho,
  fornecedores,
  ofertas,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pedido: PedidoCompra | null;
  rascunho?: RascunhoPedido | null;
  fornecedores: Fornecedor[];
  ofertas: Oferta[];
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={pedido ? `Pedido · ${pedido.descricao}` : "Registrar compra"}
      description={pedido ? undefined : "Anote o que comprou para acompanhar a entrega e saber quanto saiu cada placa."}
    >
      <FormPedido
        key={pedido?.id ?? `novo-${JSON.stringify(rascunho ?? {})}`}
        p={pedido}
        rascunho={rascunho}
        fornecedores={fornecedores}
        ofertas={ofertas}
        onDone={() => onOpenChange(false)}
      />
    </Sheet>
  );
}

function FormPedido({
  p,
  rascunho,
  fornecedores,
  ofertas,
  onDone,
}: {
  p: PedidoCompra | null;
  rascunho?: RascunhoPedido | null;
  fornecedores: Fornecedor[];
  ofertas: Oferta[];
  onDone: () => void;
}) {
  const router = useRouter();
  const hoje = todaySP();
  const inicialForn = p?.fornecedorId ?? rascunho?.fornecedorId ?? fornecedores[0]?.id;
  const [fornecedorId, setFornecedorId] = React.useState(String(inicialForn ?? ""));
  const [ofertaId, setOfertaId] = React.useState(String(p?.ofertaId ?? rascunho?.ofertaId ?? ""));
  const [descricao, setDescricao] = React.useState(p?.descricao ?? rascunho?.descricao ?? "");
  const [quantidade, setQuantidade] = React.useState(String(p?.quantidade ?? rascunho?.quantidade ?? ""));
  const [valor, setValor] = React.useState(brl(p?.valorTotal ?? rascunho?.valorTotal));
  /** Valor calculado pela placa escolhida: acompanha a quantidade até você digitar outro. */
  const [valorAuto, setValorAuto] = React.useState(!p && !!rascunho?.ofertaId);
  const [frete, setFrete] = React.useState(brl(p?.frete ?? rascunho?.frete));
  const [data, setData] = React.useState(p?.data ?? hoje);
  const prazoForn = fornecedores.find((f) => f.id === inicialForn)?.prazoDias;
  const [previsao, setPrevisao] = React.useState(p?.previsao ?? (prazoForn ? addDays(hoje, prazoForn) : ""));
  const [rastreio, setRastreio] = React.useState(p?.rastreio ?? "");
  const [obs, setObs] = React.useState(p?.observacao ?? "");
  const [erro, setErro] = React.useState<string>();
  const [salvando, setSalvando] = React.useState(false);

  const daLoja = ofertas.filter((o) => String(o.fornecedorId) === fornecedorId);
  const q = Number(quantidade || 0);
  const total = parseValor(valor);
  const fr = parseValor(frete);
  const un = custoUnitario({ valorTotal: total, frete: fr, quantidade: q });

  const escolherOferta = (id: string) => {
    setOfertaId(id);
    const o = ofertas.find((x) => String(x.id) === id);
    if (!o) return;
    setDescricao(o.nome);
    const qtd = Math.max(o.qtdMinima, q || 0);
    if (!q) setQuantidade(String(qtd));
    setValor(brl(o.preco * qtd));
    setValorAuto(true);
  };
  const mudarQuantidade = (txt: string) => {
    setQuantidade(txt);
    const o = ofertas.find((x) => String(x.id) === ofertaId);
    if (o && valorAuto) setValor(brl(o.preco * Number(txt || 0)));
  };

  const salvar = async () => {
    setErro(undefined);
    setSalvando(true);
    const r = await salvarPedido({
      id: p?.id,
      fornecedorId: Number(fornecedorId),
      ofertaId: ofertaId ? Number(ofertaId) : null,
      descricao,
      quantidade: q,
      valorTotal: total,
      frete: fr,
      data,
      previsao: previsao || null,
      rastreio,
      observacao: obs,
    });
    setSalvando(false);
    if (!r.ok) return setErro(r.error);
    toast.success(p ? "Pedido atualizado" : "Compra registrada", { description: q ? `${formatBRL(un)} por placa, com frete.` : undefined });
    router.refresh();
    onDone();
  };

  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        salvar();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Fornecedor" htmlFor="p-forn">
          <Select
            id="p-forn"
            value={fornecedorId}
            onChange={(e) => {
              setFornecedorId(e.target.value);
              setOfertaId("");
              const pr = fornecedores.find((f) => String(f.id) === e.target.value)?.prazoDias;
              if (!p && pr) setPrevisao(addDays(data, pr));
            }}
          >
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Placa da vitrine" htmlFor="p-oferta" hint="Opcional: preenche o resto">
          <Select id="p-oferta" value={ofertaId} onChange={(e) => escolherOferta(e.target.value)}>
            <option value="">Outra coisa</option>
            {daLoja.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome} · {formatBRL(o.preco)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="O que comprou" htmlFor="p-desc">
        <Input id="p-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: 50 placas NFC acrílico" autoComplete="off" />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Quantidade" htmlFor="p-q">
          <Input id="p-q" value={quantidade} onChange={(e) => mudarQuantidade(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="font-mono" />
        </Field>
        <Field label="Valor pago" htmlFor="p-v" hint="Sem o frete">
          <Input
            id="p-v"
            value={valor}
            onChange={(e) => {
              setValor(e.target.value);
              setValorAuto(false);
            }}
            placeholder="0,00"
            inputMode="decimal"
            className="font-mono"
          />
        </Field>
        <Field label="Frete" htmlFor="p-f">
          <Input id="p-f" value={frete} onChange={(e) => setFrete(e.target.value)} placeholder="0,00" inputMode="decimal" className="font-mono" />
        </Field>
      </div>
      {q > 0 && total > 0 && (
        <p className="rounded-control bg-accent/50 px-3 py-2 text-13 text-accent-foreground">
          Cada placa saiu por <span className="font-mono font-semibold tabular">{formatBRL(un)}</span> com frete · total{" "}
          <span className="font-mono tabular">{formatBRL(total + fr)}</span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data do pedido" htmlFor="p-data">
          <Input id="p-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </Field>
        <Field label="Chega até" htmlFor="p-prev" hint="Previsão de entrega">
          <Input id="p-prev" type="date" value={previsao} onChange={(e) => setPrevisao(e.target.value)} />
        </Field>
      </div>
      <Field label="Código de rastreio" htmlFor="p-rast" hint="Opcional. Código dos Correios abre o rastreio direto.">
        <Input
          id="p-rast"
          value={rastreio}
          onChange={(e) => setRastreio(e.target.value)}
          placeholder="AA123456789BR"
          className="font-mono uppercase"
          autoComplete="off"
        />
      </Field>
      <Field label="Observação" htmlFor="p-obs" hint="Opcional">
        <Input id="p-obs" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: pago no Pix, pedido nº 1234" autoComplete="off" />
      </Field>
      <Erro msg={erro} />
      <Rodape
        salvando={salvando}
        rotulo={p ? "Salvar" : "Registrar compra"}
        onExcluir={
          p
            ? async () => {
                const r = await excluirPedido(p.id);
                if (!r.ok) return void toast.error(r.error);
                toast.success("Pedido excluído");
                router.refresh();
                onDone();
              }
            : undefined
        }
      />
    </form>
  );
}

/* ------------------------------ Chegou: entrada no estoque ------------------------------ */

export function ChegouSheet({
  pedido,
  onOpenChange,
  produtos,
  precoVenda,
}: {
  pedido: PedidoCompra | null;
  onOpenChange: (o: boolean) => void;
  produtos: { id: number; nome: string; quantidade: number }[];
  precoVenda: number;
}) {
  const router = useRouter();
  const [modo, setModo] = React.useState<"existente" | "novo" | "nada">("novo");
  const [produtoId, setProdutoId] = React.useState("");
  const [nome, setNome] = React.useState("");
  const [preco, setPreco] = React.useState("");
  const [salvando, setSalvando] = React.useState(false);

  React.useEffect(() => {
    if (!pedido) return;
    const parecido = produtos.find((p) => p.nome.toLowerCase() === pedido.descricao.toLowerCase());
    setModo(parecido || produtos.length ? "existente" : "novo");
    setProdutoId(String(parecido?.id ?? produtos[0]?.id ?? ""));
    setNome(pedido.descricao);
    setPreco(brl(precoVenda));
  }, [pedido, produtos, precoVenda]);

  const confirmar = async () => {
    if (!pedido) return;
    setSalvando(true);
    const r = await mudarStatusPedido(
      pedido.id,
      "recebido",
      modo === "existente" && produtoId ? { produtoId: Number(produtoId) } : modo === "novo" ? { criarProduto: { nome, preco: parseValor(preco) } } : undefined,
    );
    setSalvando(false);
    if (!r.ok) return void toast.error(r.error);
    toast.success("Pedido recebido", { description: modo === "nada" ? undefined : `${pedido.quantidade} placas entraram no estoque.` });
    router.refresh();
    onOpenChange(false);
  };

  return (
    <Sheet open={!!pedido} onOpenChange={onOpenChange} title="Chegou!" description={pedido ? `${pedido.quantidade} × ${pedido.descricao}` : undefined}>
      {pedido && (
        <div className="grid gap-4">
          <p className="text-13 text-subtle-foreground">Quer dar entrada dessas placas no Estoque? O custo do produto vira o custo por placa deste pedido.</p>
          <div role="radiogroup" aria-label="Entrada no estoque" className="grid gap-2">
            {(
              [
                ["existente", "Somar num produto que já tenho", produtos.length > 0],
                ["novo", "Criar produto novo no estoque", true],
                ["nada", "Só marcar como recebido", true],
              ] as const
            )
              .filter(([, , ok]) => ok)
              .map(([k, l]) => (
                <label
                  key={k}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 ring-1 transition-colors duration-150",
                    modo === k ? "bg-accent/50 ring-primary" : "ring-border hover-fine:bg-muted",
                  )}
                >
                  <input type="radio" name="modo" checked={modo === k} onChange={() => setModo(k)} className="accent-primary" />
                  <span className="text-14">{l}</span>
                </label>
              ))}
          </div>
          {modo === "existente" && (
            <Field label="Produto" htmlFor="c-prod">
              <Select id="c-prod" value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} · {p.quantidade} em mãos
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {modo === "novo" && (
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
              <Field label="Nome no estoque" htmlFor="c-nome">
                <Input id="c-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
              </Field>
              <Field label="Vende por" htmlFor="c-preco">
                <Input id="c-preco" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0,00" inputMode="decimal" className="font-mono" />
              </Field>
            </div>
          )}
          <Button variant="primary" onClick={confirmar} disabled={salvando || (modo === "existente" && !produtoId)}>
            {salvando && <Loader2 className="animate-spin" />} Confirmar recebimento
          </Button>
        </div>
      )}
    </Sheet>
  );
}
