import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import { DDL } from "./ddl";
import { runSeed } from "./seed";

// Na Vercel só /tmp aceita escrita: o banco nasce do seed em cada instância (modo demonstração).
const DB_PATH = process.env.DATABASE_PATH ?? (process.env.VERCEL ? "/tmp/ecloura.db" : path.join(process.cwd(), "data", "ecloura.db"));

function create() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(DDL);
  const db = drizzle(sqlite, { schema });
  const { n } = sqlite.prepare("select count(*) as n from empresas").get() as { n: number };
  if (n === 0) runSeed(db);
  return db;
}

type DB = ReturnType<typeof create>;
const globalForDb = globalThis as unknown as { __ecloura?: DB };

export const db: DB = globalForDb.__ecloura ?? create();
if (process.env.NODE_ENV !== "production") globalForDb.__ecloura = db;

export { schema };
