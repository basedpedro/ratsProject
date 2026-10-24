// Cria ou redefine o acesso de uma pessoa. Não existe cadastro pelo site:
// contas novas só nascem por este script.
//
// Uso:
//   node --env-file=.env.local --import tsx scripts/create-user.ts pedro@ratsdev.com.br "Pedro"
//   node --env-file=.env.local --import tsx scripts/create-user.ts pedro@ratsdev.com.br "Pedro" "senha-forte"
//
// Sem a senha, o script gera uma e imprime uma única vez.

import { randomInt } from "node:crypto";
import { Client } from "pg";
import { hashPassword } from "../lib/passwords";

const [email, name, providedPassword] = process.argv.slice(2);

if (!email || !name) {
  console.error('uso: scripts/create-user.ts <email> "<nome>" [senha]');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL não definida.");
  process.exit(1);
}

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
function generatePassword(length = 14): string {
  let password = "";
  for (let index = 0; index < length; index += 1) {
    password += ALPHABET[randomInt(ALPHABET.length)];
  }
  return password;
}

const password = providedPassword ?? generatePassword();
const passwordHash = await hashPassword(password);

const client = new Client({ connectionString });
await client.connect();

const existing = await client.query<{ id: string }>(
  "select id from people where lower(email) = lower($1)",
  [email],
);

if (existing.rowCount && existing.rows[0]) {
  await client.query(
    `update people set name = $2, active = true, password_hash = $3 where id = $1`,
    [existing.rows[0].id, name, passwordHash],
  );
  console.log(`acesso atualizado: ${email}`);
} else {
  await client.query(
    `insert into people (name, email, role, color, active, password_hash)
     values ($1, $2, '', '#2bff6a', true, $3)`,
    [name, email.toLowerCase(), passwordHash],
  );
  console.log(`pessoa criada com acesso: ${email}`);
}

await client.end();

console.log("");
console.log("  e-mail: " + email.toLowerCase());
console.log("  senha:  " + password);
console.log("");
console.log("guarde a senha agora. ela não é armazenada em texto puro.");
