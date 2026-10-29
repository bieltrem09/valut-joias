"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db, ready, schema as s, one, must } from "@/lib/db";
import {
  extrairProduto,
  urlPublica,
  validarFornecedor,
  validarOferta,
  validarPedido,
  type FornecedorEntrada,
  type OfertaEntrada,
  type PedidoEntrada,
  type StatusPedido,
} from "@/lib/fornecedores";
import { todaySP } from "@/lib/dates";

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const MAX_FOTO = 3 * 1024 * 1024;
const TIPOS_IMG = /^image\/(jpeg|png|webp|gif|avif)$/;
const NAVEGADOR = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const atualizar = () => {
  revalidatePath("/fornecedores");
};

/** fetch que segue redirecionamentos conferindo cada endereço (nada de rede interna). */
async function buscarPublico(url: string, headers: Record<string, string>, ms: number): Promise<Response | null> {
  let atual = url;
  for (let i = 0; i < 5; i++) {
    if (!urlPublica(atual)) return null;
    const res = await fetch(atual, { headers, signal: AbortSignal.timeout(ms), cache: "no-store", redirect: "manual" });
    const destino = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
    if (!destino) return res;
    atual = new URL(destino, atual).toString();
  }
  return null;
}

/* --------------------------------- Fornecedor --------------------------------- */

export async function salvarFornecedor(e: FornecedorEntrada & { id?: number }): Promise<Result<{ id: number }>> {
  const v = validarFornecedor(e);
  if (!v.ok) return v;
  await ready();
  if (e.id) {
    const r = await db.update(s.fornecedores).set(v.dados).where(eq(s.fornecedores.id, e.id)).returning({ id: s.fornecedores.id }).then(one);
    if (!r) return { ok: false, error: "Fornecedor não encontrado." };
    atualizar();
    return { ok: true, data: r };
  }
  const r = await db
    .insert(s.fornecedores)
    .values({ ...v.dados, criadoEm: new Date().toISOString() })
    .returning({ id: s.fornecedores.id })
    .then(must);
  atualizar();
  return { ok: true, data: r };
}

export async function favoritarFornecedor(id: number, favorito: boolean): Promise<Result> {
  await ready();
  await db.update(s.fornecedores).set({ favorito }).where(eq(s.fornecedores.id, id));
  atualizar();
  return { ok: true };
}

export async function excluirFornecedor(id: number): Promise<Result> {
  await ready();
  // Sem depender do cascade do banco remoto.
  await db.delete(s.pedidosCompra).where(eq(s.pedidosCompra.fornecedorId, id));
  await db.delete(s.ofertasFornecedor).where(eq(s.ofertasFornecedor.fornecedorId, id));
  await db.delete(s.fornecedores).where(eq(s.fornecedores.id, id));
  atualizar();
  return { ok: true };
}

/* ----------------------------------- Placas ----------------------------------- */

/** Baixa a imagem do link para guardar no painel (o site pode tirar do ar ou bloquear). */
async function baixarImagem(url: string): Promise<{ mime: string; bytes: Buffer } | null> {
  try {
    const res = await buscarPublico(url, { "User-Agent": NAVEGADOR, Accept: "image/*" }, 8000);
    if (!res) return null;
    const mime = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!res.ok || !TIPOS_IMG.test(mime)) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return bytes.length && bytes.length <= MAX_FOTO ? { mime, bytes } : null;
  } catch {
    return null;
  }
}

/**
 * Cria ou edita a placa do fornecedor.
 * FormData: `dados` (JSON, com `id` ao editar), `foto` (arquivo novo, opcional) e
 * `semFoto` = "1" para tirar a foto.
 */
export async function salvarOferta(fd: FormData): Promise<Result<{ id: number }>> {
  let dados: OfertaEntrada & { id?: number };
  try {
    dados = JSON.parse(String(fd.get("dados") ?? "{}"));
  } catch {
    return { ok: false, error: "Dados inválidos." };
  }
  const v = validarOferta(dados);
  if (!v.ok) return v;
  const arquivo = fd.get("foto");
  const nova = arquivo instanceof File && arquivo.size > 0 ? arquivo : null;
  if (nova && !TIPOS_IMG.test(nova.type)) return { ok: false, error: "Use foto em JPG, PNG ou WEBP." };
  if (nova && nova.size > MAX_FOTO) return { ok: false, error: "A foto passou de 3 MB. Tente uma menor." };

  await ready();
  const fornecedor = await db.select({ id: s.fornecedores.id }).from(s.fornecedores).where(eq(s.fornecedores.id, v.dados.fornecedorId)).then(one);
  if (!fornecedor) return { ok: false, error: "Fornecedor não encontrado." };

  const atual = dados.id
    ? await db
        .select({ id: s.ofertasFornecedor.id, imagemUrl: s.ofertasFornecedor.imagemUrl, temFoto: sql<boolean>`${s.ofertasFornecedor.foto} is not null` })
        .from(s.ofertasFornecedor)
        .where(eq(s.ofertasFornecedor.id, dados.id))
        .then(one)
    : null;
  if (dados.id && !atual) return { ok: false, error: "Placa não encontrada." };

  // Foto: arquivo escolhido > imagem do link (baixada uma vez) > a que já estava.
  let foto: { mime: string; bytes: Buffer } | null | undefined;
  if (nova) foto = { mime: nova.type, bytes: Buffer.from(await nova.arrayBuffer()) };
  else if (fd.get("semFoto") === "1") foto = null;
  else if (v.dados.imagemUrl && (v.dados.imagemUrl !== atual?.imagemUrl || !atual?.temFoto)) foto = (await baixarImagem(v.dados.imagemUrl)) ?? undefined;

  const campos = {
    ...v.dados,
    imagemUrl: fd.get("semFoto") === "1" ? null : v.dados.imagemUrl,
    ...(foto === undefined ? {} : { foto: foto?.bytes ?? null, fotoMime: foto?.mime ?? null, fotoVersao: sql`${s.ofertasFornecedor.fotoVersao} + 1` }),
  };
  let id: number;
  if (atual) {
    await db.update(s.ofertasFornecedor).set(campos).where(eq(s.ofertasFornecedor.id, atual.id));
    id = atual.id;
  } else {
    const r = await db
      .insert(s.ofertasFornecedor)
      .values({
        ...v.dados,
        foto: foto?.bytes ?? null,
        fotoMime: foto?.mime ?? null,
        fotoVersao: foto ? 1 : 0,
        criadoEm: new Date().toISOString(),
      })
      .returning({ id: s.ofertasFornecedor.id })
      .then(must);
    id = r.id;
  }
  atualizar();
  return { ok: true, data: { id } };
}

export async function excluirOferta(id: number): Promise<Result> {
  await ready();
  await db.update(s.pedidosCompra).set({ ofertaId: null }).where(eq(s.pedidosCompra.ofertaId, id));
  await db.delete(s.ofertasFornecedor).where(eq(s.ofertasFornecedor.id, id));
  atualizar();
  return { ok: true };
}

/** Lê a página do produto (título, descrição, foto e preço) para preencher o cadastro. */
export async function lerLinkProduto(
  url: string,
): Promise<Result<{ titulo: string | null; descricao: string | null; imagem: string | null; preco: number | null }>> {
  const u = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
  if (!urlPublica(u)) return { ok: false, error: "Cole o link da página da placa (https://…)." };
  try {
    const res = await buscarPublico(u, { "User-Agent": NAVEGADOR, Accept: "text/html", "Accept-Language": "pt-BR,pt;q=0.9" }, 10000);
    if (!res) return { ok: false, error: "Esse link leva a um endereço que não dá para abrir." };
    if (!res.ok) return { ok: false, error: `O site não deixou ler a página (${res.status}). Preencha à mão.` };
    const html = (await res.text()).slice(0, 1_500_000);
    const p = extrairProduto(html, u);
    if (!p.titulo && !p.imagem && !p.preco) return { ok: false, error: "Não achamos os dados nessa página. Preencha à mão." };
    return { ok: true, data: p };
  } catch {
    return { ok: false, error: "O site demorou para responder. Tente de novo ou preencha à mão." };
  }
}

/* ---------------------------------- Pedidos ---------------------------------- */

export async function salvarPedido(e: PedidoEntrada & { id?: number }): Promise<Result<{ id: number }>> {
  const v = validarPedido(e);
  if (!v.ok) return v;
  await ready();
  if (e.id) {
    const r = await db.update(s.pedidosCompra).set(v.dados).where(eq(s.pedidosCompra.id, e.id)).returning({ id: s.pedidosCompra.id }).then(one);
    if (!r) return { ok: false, error: "Pedido não encontrado." };
    atualizar();
    return { ok: true, data: r };
  }
  const r = await db
    .insert(s.pedidosCompra)
    .values({ ...v.dados, status: "pedido", criadoEm: new Date().toISOString() })
    .returning({ id: s.pedidosCompra.id })
    .then(must);
  atualizar();
  return { ok: true, data: r };
}

/**
 * Muda a etapa do pedido. Ao marcar "Chegou", pode dar entrada no estoque:
 * num produto existente (`produtoId`) ou criando um novo com o custo por placa.
 */
export async function mudarStatusPedido(
  id: number,
  status: StatusPedido,
  entrada?: { produtoId?: number; criarProduto?: { nome: string; preco: number } },
): Promise<Result> {
  await ready();
  const p = await db.select().from(s.pedidosCompra).where(eq(s.pedidosCompra.id, id)).then(one);
  if (!p) return { ok: false, error: "Pedido não encontrado." };
  if (p.status === "recebido" && status !== "recebido" && p.produtoId)
    return { ok: false, error: "Esse pedido já entrou no estoque. Ajuste a quantidade lá em Estoque se precisar." };

  const agora = new Date().toISOString();
  let produtoId: number | null = p.produtoId;
  if (status === "recebido" && p.status !== "recebido" && entrada) {
    const custoUn = p.quantidade ? Math.round(((p.valorTotal + p.frete) / p.quantidade) * 100) / 100 : 0;
    if (entrada.criarProduto) {
      const nome = entrada.criarProduto.nome.trim().slice(0, 120) || p.descricao;
      const forn = await db.select({ nome: s.fornecedores.nome }).from(s.fornecedores).where(eq(s.fornecedores.id, p.fornecedorId)).then(one);
      const novo = await db
        .insert(s.produtos)
        .values({
          nome,
          categoria: "Placas",
          custo: custoUn,
          preco: Math.max(0, entrada.criarProduto.preco || 0),
          quantidade: p.quantidade,
          fornecedor: forn?.nome ?? null,
          criadoEm: agora,
          atualizadoEm: agora,
        })
        .returning({ id: s.produtos.id })
        .then(must);
      produtoId = novo.id;
      await db
        .insert(s.movimentos)
        .values({ produtoId, tipo: "entrada", delta: p.quantidade, saldo: p.quantidade, motivo: `Compra: ${p.descricao}`.slice(0, 120), criadoEm: agora });
    } else if (entrada.produtoId) {
      const r = await db
        .update(s.produtos)
        .set({ quantidade: sql`${s.produtos.quantidade} + ${p.quantidade}`, custo: custoUn, atualizadoEm: agora })
        .where(eq(s.produtos.id, entrada.produtoId))
        .returning({ quantidade: s.produtos.quantidade })
        .then(one);
      if (!r) return { ok: false, error: "Produto do estoque não encontrado." };
      produtoId = entrada.produtoId;
      await db
        .insert(s.movimentos)
        .values({ produtoId, tipo: "entrada", delta: p.quantidade, saldo: r.quantidade, motivo: `Compra: ${p.descricao}`.slice(0, 120), criadoEm: agora });
    }
    revalidatePath("/estoque");
  }

  await db
    .update(s.pedidosCompra)
    .set({ status, recebidoEm: status === "recebido" ? (p.recebidoEm ?? todaySP()) : null, produtoId })
    .where(eq(s.pedidosCompra.id, id));
  atualizar();
  return { ok: true };
}

export async function excluirPedido(id: number): Promise<Result> {
  await ready();
  await db.delete(s.pedidosCompra).where(eq(s.pedidosCompra.id, id));
  atualizar();
  return { ok: true };
}
