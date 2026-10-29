import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db, ready, schema as s } from "@/lib/db";
import type { Movimento, Produto } from "@/lib/db/schema";

export type ProdutoComFotos = Produto & { fotos: number[] };

/** Produtos com os ids das fotos (capa primeiro). Os bytes ficam no banco até a tela pedir. */
export async function listProdutos(): Promise<ProdutoComFotos[]> {
  await ready();
  const [ps, fs] = await Promise.all([
    db.select().from(s.produtos).orderBy(asc(s.produtos.nome)),
    db
      .select({ id: s.produtoFotos.id, produtoId: s.produtoFotos.produtoId })
      .from(s.produtoFotos)
      .orderBy(asc(s.produtoFotos.produtoId), asc(s.produtoFotos.ordem), asc(s.produtoFotos.id)),
  ]);
  const porProduto = new Map<number, number[]>();
  for (const f of fs) porProduto.set(f.produtoId, [...(porProduto.get(f.produtoId) ?? []), f.id]);
  return ps.map((p) => ({ ...p, fotos: porProduto.get(p.id) ?? [] }));
}

export async function listMovimentos(produtoId: number, limite = 40): Promise<Movimento[]> {
  await ready();
  return db.select().from(s.movimentos).where(eq(s.movimentos.produtoId, produtoId)).orderBy(desc(s.movimentos.id)).limit(limite);
}

export type ProdutoParaVenda = { id: number; nome: string; quantidade: number; preco: number; custo: number; foto: number | null };

/** Produtos para escolher no "Registrar venda": quem tem saldo primeiro, com a foto de capa. */
export async function listProdutosParaVenda(): Promise<ProdutoParaVenda[]> {
  const ps = await listProdutos();
  return ps
    .map((p) => ({ id: p.id, nome: p.nome, quantidade: p.quantidade, preco: p.preco, custo: p.custo, foto: p.fotos[0] ?? null }))
    .sort((a, b) => Number(b.quantidade > 0) - Number(a.quantidade > 0) || a.nome.localeCompare(b.nome, "pt-BR"));
}
