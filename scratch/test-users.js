const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

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
  max: 20,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log("Fetching users...");
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenant: {
          select: {
            name: true
          }
        }
      }
    });
    console.log("Users in database:", JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Prisma query failed:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
