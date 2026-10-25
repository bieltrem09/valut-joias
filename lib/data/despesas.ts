import "server-only";
import { between, desc } from "drizzle-orm";
import { db, ready, schema as s } from "@/lib/db";
import type { Period } from "@/lib/period";
import type { Despesa, DespesaCategoria } from "@/lib/db/schema";

export type DespesaRow = Despesa;

export const CATEGORIAS_DESPESA: DespesaCategoria[] = ["Anúncios", "Ferramentas", "Frete", "Taxas", "Outros"];

export async function listDespesas(p: Period): Promise<DespesaRow[]> {
  await ready();
  return db
    .select()
    .from(s.despesas)
    .where(between(s.despesas.data, p.de, p.ate))
    .orderBy(desc(s.despesas.data), desc(s.despesas.id));
}

export async function totalDespesasAnterior(p: Period): Promise<number> {
  await ready();
  const rows = await db
    .select({ valor: s.despesas.valor })
    .from(s.despesas)
    .where(between(s.despesas.data, p.anterior.de, p.anterior.ate));
  return rows.reduce((a, d) => a + d.valor, 0);
}
