// One Postgres entry point for the whole app.
// Production: Neon over HTTP (DATABASE_URL). Local dev and CI: PGlite, an in-process
// Postgres, so the same SQL runs everywhere without secrets.
export type Row = Record<string, unknown>;
type Runner = (text: string, params: unknown[]) => Promise<Row[]>;

let runner: Promise<Runner> | undefined;

async function connect(): Promise<Runner> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    return (text, params) => sql.query(text, params) as Promise<Row[]>;
  }
  if (process.env.VERCEL) {
    throw new Error("Set DATABASE_URL to a Neon database before deploying. Local storage is not available on Vercel.");
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const db = await PGlite.create(process.env.PGLITE_DIR ?? "./data/pglite");
  return async (text, params) => (await db.query<Row>(text, params)).rows;
}

export async function query<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  runner ??= connect().catch((error) => {
    runner = undefined;
    throw error;
  });
  return (await (await runner)(text, params)) as T[];
}
