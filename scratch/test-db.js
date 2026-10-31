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
    console.log("Connecting to database using pg Pool adapter...");
    console.log("Running the exact Prisma query from the GET API...");
    const orders = await prisma.order.findMany({
      where: {
        tenantId: "ff58c34a-1695-40f1-b68a-923775e6a95e", // Using the sample tenant ID from the previous run
        isClosed: false,
      },
      include: {
        items: { include: { product: { select: { name: true } } } },
        user: { select: { name: true } },
        customer: { select: { name: true, phone: true } },
        table: { select: { name: true } },
        tenant: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    console.log(`Success! Retrieved ${orders.length} orders.`);
    if (orders.length > 0) {
      console.log("Sample order fields check:");
      const o = orders[0];
      console.log("ID:", o.id);
      console.log("Order number:", o.orderNumber);
      console.log("User:", o.user);
      console.log("Customer:", o.customer);
      console.log("Table:", o.table);
      console.log("Tenant:", o.tenant);
      console.log("Items count:", o.items.length);
    }
  } catch (error) {
    console.error("Prisma query failed:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
