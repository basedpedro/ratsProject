import { Pool, types, type PoolClient, type QueryResultRow } from "pg";

// O tipo date do Postgres vira string "2026-11-03" em vez de Date.
// Assim prazos não mudam de dia por causa de fuso horário.
types.setTypeParser(1082, (value) => value);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não definida.");
}

// Em desenvolvimento o Next recarrega os módulos a cada edição.
// Guardar o pool no globalThis evita abrir conexões sem parar.
const globalForPool = globalThis as typeof globalThis & { ratsPool?: Pool };

export const pool =
  globalForPool.ratsPool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPool.ratsPool = pool;
}

export async function query<Row extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<Row[]> {
  const result = await pool.query<Row>(text, params);
  return result.rows;
}

export async function queryOne<Row extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<Row | null> {
  const rows = await query<Row>(text, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(
  run: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await run(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
