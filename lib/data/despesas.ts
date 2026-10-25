import "server-only";
import { between, desc } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import type { Period } from "@/lib/period";
import type { Despesa, DespesaCategoria } from "@/lib/db/schema";

export type DespesaRow = Despesa;

export const CATEGORIAS_DESPESA: DespesaCategoria[] = ["Anúncios", "Ferramentas", "Frete", "Taxas", "Outros"];

export function listDespesas(p: Period): DespesaRow[] {
  return db
    .select()
    .from(s.despesas)
    .where(between(s.despesas.data, p.de, p.ate))
    .orderBy(desc(s.despesas.data), desc(s.despesas.id))
    .all();
}

export function totalDespesasAnterior(p: Period): number {
  return db
    .select({ valor: s.despesas.valor })
    .from(s.despesas)
    .where(between(s.despesas.data, p.anterior.de, p.anterior.ate))
    .all()
    .reduce((a, d) => a + d.valor, 0);
}
