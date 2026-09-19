import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

let dbInstance: any = null;

export function getDb() {
  if (!dbInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não configurada.');
    }
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
}
