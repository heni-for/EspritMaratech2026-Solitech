import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

let db: any = {};

try {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://localhost/test",
    connectionTimeoutMillis: 5000,
  });

  // Test the connection
  pool.on('error', (err) => {
    console.warn('PostgreSQL connection error:', err.message);
  });

  db = drizzle(pool, { schema });
} catch (error) {
  console.warn('Failed to initialize PostgreSQL database, using mock storage');
}

export { db };
