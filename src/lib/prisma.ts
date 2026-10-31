import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
  var pgPool: undefined | pg.Pool;
}

const getPool = () => {
  if (globalThis.pgPool) return globalThis.pgPool;

  let connectionString =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    "postgres://postgres.tanulkkpalanmiosroxp:O2zgnKEyRO9B5jQg@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true";

  connectionString = connectionString
    .replace(/([?&])sslmode=[^&]*/g, "$1")
    .replace(/([?&])pgbouncer=[^&]*/g, "$1")
    .replace(/([?&])supa=[^&]*/g, "$1")
    .replace(/[?&]+$/, "")
    .replace(/\?&/, "?")
    .replace(/&&+/g, "&");

  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 15,
    min: 3,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  // Pre-warm 3 connections in the background so requests don't wait for cold TLS handshakes
  Promise.all(
    [1, 2, 3].map(async () => {
      try {
        const client = await pool.connect();
        client.release();
      } catch {
        // Ignore background warmup errors
      }
    })
  );

  globalThis.pgPool = pool;
  return pool;
};

const prismaClientSingleton = () => {
  const pool = getPool();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

const prisma = globalThis.prisma ?? prismaClientSingleton();
export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
