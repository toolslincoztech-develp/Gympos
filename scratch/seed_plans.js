const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

const prismaClientSingleton = () => {
  let connectionString =
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
  return new PrismaClient({ adapter });
};

const prisma = prismaClientSingleton();

async function main() {
  const plans = [
    {
      name: "7-Day Trial",
      price: 0,
      billingType: "TRIAL",
      features: ["All Premium Features", "Limited Support", "7 Days Duration"],
    },
    {
      name: "6-Month Plan",
      price: 29.99,
      billingType: "6_MONTHS",
      features: ["All Premium Features", "Priority Support", "6 Months Duration"],
    },
    {
      name: "1-Year Plan",
      price: 49.99,
      billingType: "YEARLY",
      features: ["All Premium Features", "24/7 Priority Support", "1 Year Duration"],
    },
    {
      name: "Lifetime Plan",
      price: 149.99,
      billingType: "LIFETIME",
      features: ["All Premium Features", "Lifetime Support", "No Recurring Billing"],
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  console.log("Subscription plans seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
