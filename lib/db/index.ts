import "server-only";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { DDL } from "./ddl";

/**
 * libSQL: o mesmo código fala com um arquivo local (dev) ou com o Turso (produção).
 * - DATABASE_URL definido (libsql://…): dados persistem na nuvem.
 * - Sem ele, local: data/ecloura.db.
 * - Sem ele, na Vercel: /tmp, que é apagado — o painel avisa (ver `persistente`).
 */
function resolveUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.VERCEL) return "file:/tmp/ecloura.db";
  const file = path.join(process.cwd(), "data", "ecloura.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return `file:${file}`;
}

export const persistente = !!process.env.DATABASE_URL || !process.env.VERCEL;

type Client = ReturnType<typeof createClient>;
const g = globalThis as unknown as { __eclouraClient?: Client; __eclouraReady?: Promise<void> };

const client = g.__eclouraClient ?? createClient({ url: resolveUrl(), authToken: process.env.DATABASE_AUTH_TOKEN });
if (process.env.NODE_ENV !== "production") g.__eclouraClient = client;

export const db = drizzle(client, { schema });

/** Garante as tabelas uma vez por processo. Toda leitura/escrita passa por aqui. */
export function ready(): Promise<void> {
  g.__eclouraReady ??= client.executeMultiple(DDL + "\npragma foreign_keys = on;").catch((e) => {
    g.__eclouraReady = undefined;
    throw e;
  });
  return g.__eclouraReady;
}

export { schema };
