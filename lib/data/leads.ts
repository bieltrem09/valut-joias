import "server-only";
import { desc } from "drizzle-orm";
import { db, ready, schema as s } from "@/lib/db";

export type LeadFunil = typeof s.leads.$inferSelect;
export type BuscaSalva = typeof s.buscas.$inferSelect;

export async function listLeads(): Promise<LeadFunil[]> {
  await ready();
  return db.select().from(s.leads).orderBy(desc(s.leads.score), desc(s.leads.atualizadoEm));
}

export async function listBuscas(limit = 8): Promise<BuscaSalva[]> {
  await ready();
  return db.select().from(s.buscas).orderBy(desc(s.buscas.criadaEm)).limit(limit);
}
