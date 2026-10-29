import "server-only";
import { asc, desc, ne, sql } from "drizzle-orm";
import { db, ready, schema as s } from "@/lib/db";
import type { Fornecedor, PedidoCompra } from "@/lib/db/schema";

export type { Fornecedor, PedidoCompra };

/** Placa do fornecedor para a tela (sem os bytes da foto: só a URL para pedir). */
export type Oferta = {
  id: number;
  fornecedorId: number;
  nome: string;
  descricao: string | null;
  link: string | null;
  tipo: string | null;
  material: string | null;
  preco: number;
  qtdMinima: number;
  imagemUrl: string | null;
  foto: string | null;
  criadoEm: string;
};

export async function listFornecedores(): Promise<Fornecedor[]> {
  await ready();
  return db.select().from(s.fornecedores).orderBy(desc(s.fornecedores.favorito), asc(s.fornecedores.nome));
}

export async function listOfertas(): Promise<Oferta[]> {
  await ready();
  const rows = await db
    .select({
      id: s.ofertasFornecedor.id,
      fornecedorId: s.ofertasFornecedor.fornecedorId,
      nome: s.ofertasFornecedor.nome,
      descricao: s.ofertasFornecedor.descricao,
      link: s.ofertasFornecedor.link,
      tipo: s.ofertasFornecedor.tipo,
      material: s.ofertasFornecedor.material,
      preco: s.ofertasFornecedor.preco,
      qtdMinima: s.ofertasFornecedor.qtdMinima,
      imagemUrl: s.ofertasFornecedor.imagemUrl,
      temFoto: sql<boolean>`${s.ofertasFornecedor.foto} is not null`,
      fotoVersao: s.ofertasFornecedor.fotoVersao,
      criadoEm: s.ofertasFornecedor.criadoEm,
    })
    .from(s.ofertasFornecedor)
    .orderBy(asc(s.ofertasFornecedor.preco));
  return rows.map(({ temFoto, fotoVersao, ...o }) => ({ ...o, foto: temFoto ? `/api/fornecedores/foto/${o.id}?v=${fotoVersao}` : null }));
}

export async function listPedidos(): Promise<PedidoCompra[]> {
  await ready();
  return db.select().from(s.pedidosCompra).orderBy(desc(s.pedidosCompra.data), desc(s.pedidosCompra.id));
}

/** Por quanto você vende cada placa, em média (vendas não canceladas). */
export async function precoMedioDeVenda(): Promise<number | null> {
  await ready();
  const r = await db
    .select({
      total: sql<number>`coalesce(sum(${s.vendas.valorVenda}), 0)`,
      placas: sql<number>`(select count(*) from ${s.vendaPlacas} vp join ${s.vendas} v on v.id = vp.venda_id where v.status <> 'cancelada')`,
      vendas: sql<number>`count(*)`,
    })
    .from(s.vendas)
    .where(ne(s.vendas.status, "cancelada"));
  const { total, placas, vendas } = r[0] ?? { total: 0, placas: 0, vendas: 0 };
  const n = Number(placas) || Number(vendas);
  return n ? Number(total) / n : null;
}

/** Produtos do estoque para escolher onde dar entrada quando o pedido chega. */
export async function listProdutosParaEntrada(): Promise<{ id: number; nome: string; quantidade: number; estoqueMinimo: number }[]> {
  await ready();
  return db
    .select({ id: s.produtos.id, nome: s.produtos.nome, quantidade: s.produtos.quantidade, estoqueMinimo: s.produtos.estoqueMinimo })
    .from(s.produtos)
    .orderBy(asc(s.produtos.nome));
}
