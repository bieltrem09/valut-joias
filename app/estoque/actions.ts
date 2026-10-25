"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, inArray, notInArray, sql } from "drizzle-orm";
import { db, ready, schema as s, one, must } from "@/lib/db";
import { validarProduto, type ProdutoEntrada } from "@/lib/estoque";
import { listMovimentos } from "@/lib/data/estoque";
import type { Movimento } from "@/lib/db/schema";

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const MAX_FOTOS = 8;
const MAX_BYTES = 3 * 1024 * 1024; // por foto, depois da compressão no navegador
const TIPOS_IMG = /^image\/(jpeg|png|webp|gif|avif)$/;

/**
 * Cria ou edita um produto com as fotos.
 * FormData: `dados` (JSON do produto, com `id` ao editar), `ordem` (JSON: ["id:12", "novo:0", …])
 * e os arquivos novos em `foto` na mesma ordem dos tokens "novo:i".
 */
export async function salvarProduto(fd: FormData): Promise<Result<{ id: number }>> {
  let dados: ProdutoEntrada & { id?: number };
  let ordem: string[];
  try {
    dados = JSON.parse(String(fd.get("dados") ?? "{}"));
    ordem = JSON.parse(String(fd.get("ordem") ?? "[]"));
  } catch {
    return { ok: false, error: "Dados inválidos." };
  }
  const v = validarProduto(dados);
  if (!v.ok) return v;
  const novos = fd.getAll("foto").filter((f): f is File => f instanceof File && f.size > 0);
  if (ordem.length > MAX_FOTOS) return { ok: false, error: `No máximo ${MAX_FOTOS} fotos por produto.` };
  for (const f of novos) {
    if (!TIPOS_IMG.test(f.type)) return { ok: false, error: "Use fotos em JPG, PNG ou WEBP." };
    if (f.size > MAX_BYTES) return { ok: false, error: "Uma das fotos passou de 3 MB. Tente uma menor." };
  }

  await ready();
  const agora = new Date().toISOString();
  const { quantidade, ...campos } = v.dados;
  let id: number;
  if (dados.id) {
    const atual = await db.select({ id: s.produtos.id }).from(s.produtos).where(eq(s.produtos.id, dados.id)).then(one);
    if (!atual) return { ok: false, error: "Produto não encontrado." };
    id = atual.id;
    // A quantidade não muda aqui: só por entrada/saída, para ficar no histórico.
    await db
      .update(s.produtos)
      .set({ ...campos, atualizadoEm: agora })
      .where(eq(s.produtos.id, id));
  } else {
    const row = await db
      .insert(s.produtos)
      .values({ ...campos, quantidade, criadoEm: agora, atualizadoEm: agora })
      .returning({ id: s.produtos.id })
      .then(must);
    id = row.id;
    if (quantidade > 0)
      await db
        .insert(s.movimentos)
        .values({ produtoId: id, tipo: "entrada", delta: quantidade, saldo: quantidade, motivo: "Estoque inicial", criadoEm: agora });
  }

  // Fotos: apaga as que saíram, grava as novas e aplica a ordem (a primeira é a capa).
  const mantidas = ordem.filter((t) => t.startsWith("id:")).map((t) => Number(t.slice(3)));
  await db
    .delete(s.produtoFotos)
    .where(mantidas.length ? and(eq(s.produtoFotos.produtoId, id), notInArray(s.produtoFotos.id, mantidas)) : eq(s.produtoFotos.produtoId, id));
  for (const [i, t] of ordem.entries()) {
    if (t.startsWith("id:")) {
      await db
        .update(s.produtoFotos)
        .set({ ordem: i })
        .where(and(eq(s.produtoFotos.id, Number(t.slice(3))), eq(s.produtoFotos.produtoId, id)));
    } else if (t.startsWith("novo:")) {
      const f = novos[Number(t.slice(5))];
      if (!f) continue;
      await db.insert(s.produtoFotos).values({ produtoId: id, ordem: i, mime: f.type, bytes: Buffer.from(await f.arrayBuffer()), criadaEm: agora });
    }
  }

  revalidatePath("/estoque");
  return { ok: true, data: { id } };
}

/**
 * Entrada soma, saída tira (não deixa ficar negativo), ajuste define a contagem real.
 * O saldo novo sai do próprio UPDATE, então dois cliques seguidos não se atropelam.
 */
export async function moverEstoque(
  produtoId: number,
  tipo: "entrada" | "saida" | "ajuste",
  quantidade: number,
  motivo?: string,
): Promise<Result<{ saldo: number }>> {
  const q = Math.trunc(quantidade);
  if (!Number.isFinite(q) || q < 0 || (tipo !== "ajuste" && q === 0)) return { ok: false, error: "Informe uma quantidade válida." };
  await ready();
  const agora = new Date().toISOString();
  let delta: number;
  let saldo: number;
  if (tipo === "ajuste") {
    const atual = await db.select({ quantidade: s.produtos.quantidade }).from(s.produtos).where(eq(s.produtos.id, produtoId)).then(one);
    if (!atual) return { ok: false, error: "Produto não encontrado." };
    delta = q - atual.quantidade;
    if (delta === 0) return { ok: true, data: { saldo: q } };
    await db.update(s.produtos).set({ quantidade: q, atualizadoEm: agora }).where(eq(s.produtos.id, produtoId));
    saldo = q;
  } else {
    delta = tipo === "entrada" ? q : -q;
    const r = await db
      .update(s.produtos)
      .set({ quantidade: sql`${s.produtos.quantidade} + ${delta}`, atualizadoEm: agora })
      .where(tipo === "saida" ? and(eq(s.produtos.id, produtoId), gte(s.produtos.quantidade, q)) : eq(s.produtos.id, produtoId))
      .returning({ quantidade: s.produtos.quantidade })
      .then(one);
    if (!r) {
      const atual = await db.select({ quantidade: s.produtos.quantidade }).from(s.produtos).where(eq(s.produtos.id, produtoId)).then(one);
      return { ok: false, error: atual ? `Só tem ${atual.quantidade} em estoque.` : "Produto não encontrado." };
    }
    saldo = r.quantidade;
  }
  await db.insert(s.movimentos).values({ produtoId, tipo, delta, saldo, motivo: motivo?.trim().slice(0, 120) || null, criadoEm: agora });
  revalidatePath("/estoque");
  return { ok: true, data: { saldo } };
}

export async function historicoProduto(produtoId: number): Promise<Movimento[]> {
  return listMovimentos(produtoId);
}

export async function excluirProdutos(ids: number[]): Promise<Result> {
  if (!ids.length) return { ok: true };
  await ready();
  // Sem depender do cascade do banco remoto: fotos e movimentos primeiro.
  await db.delete(s.produtoFotos).where(inArray(s.produtoFotos.produtoId, ids));
  await db.delete(s.movimentos).where(inArray(s.movimentos.produtoId, ids));
  await db.delete(s.produtos).where(inArray(s.produtos.id, ids));
  revalidatePath("/estoque");
  return { ok: true };
}
