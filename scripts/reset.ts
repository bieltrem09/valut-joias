/** Apaga o banco local (PGlite) para recomeçar do zero: `npm run db:reset` */
import fs from "node:fs";
import path from "node:path";

if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
  console.error("O banco configurado é remoto (Supabase). Por segurança, este script só apaga o banco local.");
  process.exit(1);
}
const dir = path.join(process.cwd(), "data", "pglite");
const existia = fs.existsSync(dir);
fs.rmSync(dir, { recursive: true, force: true });
console.log(existia ? "Banco local apagado. Ele volta vazio na próxima vez que o app abrir." : "Não havia banco local.");
