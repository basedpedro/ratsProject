// Aplica os arquivos .sql de db/ em ordem e registra o que já rodou.
// Uso: node --env-file=.env.local scripts/migrate.mjs

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL não definida.");
  process.exit(1);
}

const migrationDir = path.join(process.cwd(), "db");

const client = new Client({ connectionString });
await client.connect();

await client.query(`
  create table if not exists schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )
`);

const alreadyApplied = await client.query("select name from schema_migrations");
const appliedNames = new Set(alreadyApplied.rows.map((row) => row.name));

const files = (await readdir(migrationDir))
  .filter((name) => name.endsWith(".sql"))
  .sort();

for (const file of files) {
  if (appliedNames.has(file)) {
    console.log(`já aplicada: ${file}`);
    continue;
  }

  const sql = await readFile(path.join(migrationDir, file), "utf8");

  console.log(`aplicando: ${file}`);
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into schema_migrations (name) values ($1)", [file]);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    console.error(`falhou: ${file}`);
    console.error(error.message);
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log("migrações em dia.");
