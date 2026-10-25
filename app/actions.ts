"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { isISODate, todaySP } from "@/lib/dates";
import { getEmpresaDetalhe, type EmpresaDetalhe } from "@/lib/data/empresas";
import { googleEnabled, syncEmpresa } from "@/lib/google/places";
import type { DespesaCategoria } from "@/lib/db/schema";

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const CATEGORIAS: DespesaCategoria[] = ["Anúncios", "Ferramentas", "Frete", "Taxas", "Outros"];

function revalidateAll() {
  for (const p of ["/", "/placas", "/clientes", "/despesas"]) revalidatePath(p);
}

/* ------------------------------ Despesas ------------------------------ */

export async function criarDespesa(input: { descricao: string; categoria: string; valor: number; data: string }): Promise<Result<{ id: number }>> {
  const descricao = input.descricao.trim();
  if (!descricao) return { ok: false, error: "Diga com o que foi o gasto." };
  if (!CATEGORIAS.includes(input.categoria as DespesaCategoria)) return { ok: false, error: "Escolha uma categoria." };
  if (!Number.isFinite(input.valor) || input.valor <= 0) return { ok: false, error: "O valor precisa ser maior que zero." };
  if (!isISODate(input.data) || input.data > todaySP()) return { ok: false, error: "Use uma data de hoje ou anterior." };

  const row = db
    .insert(s.despesas)
    .values({ descricao, categoria: input.categoria as DespesaCategoria, valor: Math.round(input.valor * 100) / 100, data: input.data })
    .returning({ id: s.despesas.id })
    .get();
  revalidateAll();
  return { ok: true, data: { id: row.id } };
}

export async function excluirDespesas(ids: number[]): Promise<Result> {
  if (!ids.length) return { ok: true };
  db.delete(s.despesas).where(inArray(s.despesas.id, ids)).run();
  revalidateAll();
  return { ok: true };
}

/* ------------------------------- Placas ------------------------------- */

export async function atualizarDestino(id: number, url: string): Promise<Result> {
  try {
    const u = new URL(url.trim());
    if (!/^https?:$/.test(u.protocol)) throw new Error();
  } catch {
    return { ok: false, error: "Esse link não parece válido. Comece com https://" };
  }
  db.update(s.placas).set({ destinoUrl: url.trim() }).where(eq(s.placas.id, id)).run();
  revalidatePath("/placas");
  return { ok: true };
}

export async function definirStatusPlacas(ids: number[], status: "Ativa" | "Inativa"): Promise<Result> {
  if (!ids.length) return { ok: true };
  db.update(s.placas)
    .set(status === "Ativa" ? { status, ativadaEm: todaySP() } : { status })
    .where(inArray(s.placas.id, ids))
    .run();
  revalidateAll();
  return { ok: true };
}

/** "Marcar como enviadas": a placa sai de "Pendente de envio" e passa a contar como ativa. */
export async function marcarEnviadas(ids: number[]): Promise<Result<{ alteradas: number }>> {
  const alvo = db
    .select({ id: s.placas.id, status: s.placas.status })
    .from(s.placas)
    .where(inArray(s.placas.id, ids))
    .all()
    .filter((p) => p.status === "Pendente de envio")
    .map((p) => p.id);
  if (alvo.length) db.update(s.placas).set({ status: "Ativa", ativadaEm: todaySP() }).where(inArray(s.placas.id, alvo)).run();
  revalidateAll();
  return { ok: true, data: { alteradas: alvo.length } };
}

export async function excluirPlacas(ids: number[]): Promise<Result> {
  if (!ids.length) return { ok: true };
  db.delete(s.placas).where(inArray(s.placas.id, ids)).run();
  revalidateAll();
  return { ok: true };
}

/* ------------------------------ Clientes ------------------------------ */

export async function carregarDetalheEmpresa(id: number): Promise<EmpresaDetalhe> {
  return getEmpresaDetalhe(id);
}

export async function criarEmpresa(
  input: { placeId: string; nome: string } | { nome: string; categoria: string; cidade: string; contatoNome?: string; contatoCargo?: string },
): Promise<Result<{ id: number }>> {
  const nome = input.nome.trim();
  if (!nome) return { ok: false, error: "Qual o nome da empresa?" };

  if ("placeId" in input) {
    if (!googleEnabled()) return { ok: false, error: "Configure a chave do Google para importar." };
    const existente = db.select({ id: s.empresas.id }).from(s.empresas).where(eq(s.empresas.placeId, input.placeId)).get();
    if (existente) return { ok: false, error: "Essa empresa já está na sua lista." };
    const row = db.insert(s.empresas).values({ nome, categoria: "Comércio local", cidade: "", criadaEm: todaySP() }).returning({ id: s.empresas.id }).get();
    try {
      await syncEmpresa(row.id, input.placeId);
    } catch (e) {
      console.error(e);
      db.delete(s.empresas).where(eq(s.empresas.id, row.id)).run();
      return { ok: false, error: "Não deu para puxar os dados do Google agora. Tente de novo." };
    }
    revalidatePath("/clientes");
    return { ok: true, data: { id: row.id } };
  }

  if (!input.cidade.trim()) return { ok: false, error: "Em que cidade fica?" };
  const row = db
    .insert(s.empresas)
    .values({
      nome,
      categoria: input.categoria.trim() || "Comércio local",
      cidade: input.cidade.trim(),
      contatoNome: input.contatoNome?.trim() || null,
      contatoCargo: input.contatoCargo?.trim() || null,
      criadaEm: todaySP(),
    })
    .returning({ id: s.empresas.id })
    .get();
  revalidatePath("/clientes");
  return { ok: true, data: { id: row.id } };
}
