import "server-only";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
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

type DB = NodePgDatabase<typeof schema>;
type Estado = { db: DB; ddl: () => Promise<unknown>; ready?: Promise<void> };
const g = globalThis as unknown as { __ecloura?: Estado; __tentarDdlEm?: number };

function conectar(): Estado {
  if (DB_URL) {
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(DB_URL);
    // A URL da integração vem com ?sslmode=…&supa=…; o SSL já vai nas opções e o resto não é do Postgres.
    const url = new URL(DB_URL);
    url.search = "";
    // pg + attachDatabasePool: a Vercel congela a função entre um uso e outro e as conexões
    // abertas morriam no meio (a página ficava esperando 5 min). Agora as conexões paradas
    // fecham antes do congelamento, e nenhuma consulta espera mais que 25 s.
    const pool = new Pool({
      connectionString: url.toString(),
      max: Number(process.env.DATABASE_POOL_MAX) || 5,
      ssl: local ? false : { rejectUnauthorized: false },
      idleTimeoutMillis: 5_000,
      connectionTimeoutMillis: 10_000,
      query_timeout: 25_000,
      keepAlive: true,
    });
    // Conexão que caiu sozinha não derruba o processo: o pool abre outra.
    pool.on("error", (e) => console.error("[banco] conexão caiu:", e.message));
    attachDatabasePool(pool);
    // O texto vira uma transação só; a trava faz vários processos (build, funções) criarem
    // as tabelas um de cada vez, em vez de travarem uns aos outros no catálogo.
    // lock_timeout: se algo segurar as tabelas, falha em segundos (e diz quem segura) em vez de travar.
    // Atalho: o banco guarda a "impressão digital" do DDL já aplicado. Se for a mesma,
    // basta uma consulta em vez de rodar as dezenas de comandos a cada função que liga.
    const versao = createHash("sha256").update(DDL).digest("hex").slice(0, 16);
    const linhas = async (q: string) => (await pool.query(q)).rows;
    const ddl = async () => {
      const ja = await linhas(`select 1 from versao_banco where hash = '${versao}'`).catch(() => []);
      if (ja.length) return;
      try {
        await pool.query(
          `set local lock_timeout = '5s';\nset local statement_timeout = '30s';\nselect pg_advisory_xact_lock(727274);\n${DDL}\n` +
            `create table if not exists versao_banco (hash text primary key);\n` +
            `insert into versao_banco (hash) values ('${versao}') on conflict do nothing;`,
        );
      } catch (e) {
        const quem = await linhas(
          `select pid, usename, state, wait_event_type, wait_event, now() - xact_start as idade, left(query, 160) as consulta
           from pg_stat_activity where datname = current_database() and pid <> pg_backend_pid() and state <> 'idle'`,
        ).catch(() => []);
        console.error("[banco] criação das tabelas falhou:", (e as Error).message, JSON.stringify(quem));
        // As tabelas de uma versão anterior já existem: o painel segue abrindo normalmente
        // e tenta atualizar de novo daqui a 5 minutos, em vez de travar as páginas.
        const anterior = await linhas(`select 1 from versao_banco limit 1`).catch(() => []);
        if (!anterior.length) throw e;
        g.__tentarDdlEm = Date.now() + 5 * 60_000;
      }
    };
    return { db: drizzle(pool, { schema }) as unknown as DB, ddl };
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
  // A API do drizzle é a mesma; o tipo do node-postgres serve para os dois.
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
  if (g.__tentarDdlEm && Date.now() > g.__tentarDdlEm) {
    g.__tentarDdlEm = undefined;
    estado.ready = undefined;
  }
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
