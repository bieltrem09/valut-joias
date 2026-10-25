/** Apaga o banco local para recomeçar do zero: `npm run db:reset` */
import fs from "node:fs";
import path from "node:path";

if (process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL) {
  console.error("O banco configurado é remoto (Turso) para um banco remoto. Por segurança, este script só apaga o banco local.");
  process.exit(1);
}
const dir = path.join(process.cwd(), "data");
let n = 0;
for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
  if (f.startsWith("ecloura.db")) {
    fs.rmSync(path.join(dir, f));
    n++;
  }
}
fs.rmSync(path.join(dir, "photos"), { recursive: true, force: true });
console.log(n ? "Banco local apagado. Ele volta vazio na próxima vez que o app abrir." : "Não havia banco local.");
