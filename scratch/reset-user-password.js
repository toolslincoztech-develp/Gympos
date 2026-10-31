const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");
const bcrypt = require("bcryptjs");

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
    const email = "aftabgill725@gmail.com";
    console.log(`Hashing password for ${email}...`);
    const hashedPassword = await bcrypt.hash("Lincoz@Tech-2", 10);
    
    console.log("Updating password in database...");
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    console.log("Password updated successfully for:", updatedUser.email);
  } catch (error) {
    console.error("Prisma update failed:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
