import "server-only";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { DDL } from "./ddl";

/**
 * Postgres em todo lugar:
 * - Produção: Supabase (ou qualquer Postgres). A integração Supabase da Vercel
 *   cria POSTGRES_URL sozinha; DATABASE_URL também vale.
 * - Local, sem URL: PGlite (Postgres embutido) em data/pglite. Nada para instalar.
 * - Na Vercel sem URL: PGlite em memória, que some — o painel avisa (ver `persistente`).
 */
const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

export const bancoRemoto = !!DB_URL;
export const persistente = bancoRemoto || !process.env.VERCEL;

type DB = PostgresJsDatabase<typeof schema>;
type Estado = { db: DB; ddl: () => Promise<unknown>; ready?: Promise<void> };
const g = globalThis as unknown as { __ecloura?: Estado };

function conectar(): Estado {
  if (DB_URL) {
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(DB_URL);
    // A URL da integração vem com ?sslmode=…&supa=…; o SSL já vai nas opções e o resto não é do Postgres.
    const url = new URL(DB_URL);
    url.search = "";
    // prepare:false: o pooler do Supabase (porta 6543) não aceita prepared statements.
    const sql = postgres(url.toString(), {
      prepare: false,
      max: Number(process.env.DATABASE_POOL_MAX) || 5,
      ssl: local ? false : "require",
      idle_timeout: 20,
      onnotice: () => {},
    });
    // O texto vira uma transação só; a trava faz vários processos (build, funções) criarem
    // as tabelas um de cada vez, em vez de travarem uns aos outros no catálogo.
    return { db: drizzle(sql, { schema }), ddl: () => sql.unsafe(`select pg_advisory_xact_lock(727274);\n${DDL}`) };
  }
  // PGlite só é carregado quando não há banco remoto.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PGlite } = require("@electric-sql/pglite") as typeof import("@electric-sql/pglite");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle: drizzlePglite } = require("drizzle-orm/pglite") as typeof import("drizzle-orm/pglite");
  let dir: string | undefined;
  if (!process.env.VERCEL) {
    dir = path.join(process.cwd(), "data", "pglite");
    fs.mkdirSync(dir, { recursive: true });
  }
  const client = new PGlite(dir);
  // A API do drizzle é a mesma; o tipo do postgres-js serve para os dois.
  return { db: drizzlePglite(client, { schema }) as unknown as DB, ddl: () => client.exec(DDL) };
}

/** Conecta no primeiro uso (nunca durante o build, que só importa o módulo). */
function estadoAtual(): Estado {
  g.__ecloura ??= conectar();
  return g.__ecloura;
}

export const db: DB = new Proxy({} as DB, {
  get(_, prop) {
    const real = estadoAtual().db;
    const v = Reflect.get(real, prop, real);
    return typeof v === "function" ? v.bind(real) : v;
  },
});

/** Garante as tabelas uma vez por processo. Toda leitura/escrita passa por aqui. */
export function ready(): Promise<void> {
  const estado = estadoAtual();
  estado.ready ??= estado
    .ddl()
    .then(() => undefined)
    .catch((e) => {
      estado.ready = undefined;
      throw e;
    });
  return estado.ready;
}

/** Primeira linha ou undefined (substitui o .get() do SQLite). */
export const one = <T>(rows: T[]): T | undefined => rows[0];
/** Primeira linha; para INSERT … RETURNING, que sempre devolve uma. */
export const must = <T>(rows: T[]): T => {
  if (!rows[0]) throw new Error("Consulta não retornou linha.");
  return rows[0];
};
/** Executa as consultas em sequência, na ordem dada. */
export async function emSerie(qs: PromiseLike<unknown>[]) {
  for (const q of qs) await q;
}

export { schema };
