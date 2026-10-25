/** Recria o banco com dados de exemplo: `npm run db:seed` */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "../lib/db/schema";
import { DDL } from "../lib/db/ddl";
import { runSeed } from "../lib/db/seed";

const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "ecloura.db");
fs.mkdirSync(path.dirname(file), { recursive: true });
const sqlite = new Database(file);
sqlite.pragma("foreign_keys = ON");
sqlite.exec(DDL);
runSeed(drizzle(sqlite, { schema }));

const count = (t: string) => (sqlite.prepare(`select count(*) as n from ${t}`).get() as { n: number }).n;
console.log(
  `Seed pronto em ${path.relative(process.cwd(), file)}: ${count("empresas")} empresas, ${count("vendas")} vendas, ${count("placas")} placas, ${count("despesas")} despesas.`,
);
