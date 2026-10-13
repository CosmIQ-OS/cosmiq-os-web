// One Postgres entry point for the whole app.
// Production: Neon over HTTP (DATABASE_URL). Local dev and CI: PGlite, an in-process
// Postgres, so the same SQL runs everywhere without secrets.
export type Row = Record<string, unknown>;
export interface Statement { text: string; params?: unknown[] }
interface Runner {
  query: (text: string, params: unknown[]) => Promise<Row[]>;
  transaction: (statements: Statement[]) => Promise<Row[][]>;
}

let runner: Promise<Runner> | undefined;

async function connect(): Promise<Runner> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    return {
      query: (text, params) => sql.query(text, params) as Promise<Row[]>,
      transaction: (statements) => sql.transaction(statements.map((s) => sql.query(s.text, s.params ?? []))) as Promise<Row[][]>,
    };
  }
  if (process.env.VERCEL) {
    throw new Error("Set DATABASE_URL to a Neon database before deploying. Local storage is not available on Vercel.");
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const db = await PGlite.create(process.env.PGLITE_DIR ?? "./data/pglite");
  return {
    query: async (text, params) => (await db.query<Row>(text, params)).rows,
    transaction: (statements) => db.transaction(async (tx) => {
      const results: Row[][] = [];
      for (const s of statements) results.push((await tx.query<Row>(s.text, s.params ?? [])).rows);
      return results;
    }),
  };
}

export async function query<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  runner ??= connect().catch((error) => {
    runner = undefined;
    throw error;
  });
  return (await (await runner).query(text, params)) as T[];
}

// Same atomic batch contract on Neon HTTP and PGlite; any statement error rolls back every write.
export async function transaction(statements: Statement[]): Promise<Row[][]> {
  runner ??= connect().catch((error) => { runner = undefined; throw error; });
  return (await runner).transaction(statements);
}
