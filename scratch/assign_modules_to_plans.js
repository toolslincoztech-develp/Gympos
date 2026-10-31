const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

async function main() {
  const connectionString = "postgres://postgres.tanulkkpalanmiosroxp:O2zgnKEyRO9B5jQg@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
    .replace(/([?&])sslmode=[^&]*/g, "$1")
    .replace(/([?&])pgbouncer=[^&]*/g, "$1")
    .replace(/[?&]+$/, "");

  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Assigning modules to plans...");

  const plans = await prisma.subscriptionPlan.findMany();
  const modules = await prisma.module.findMany();

  const posModule = modules.find(m => m.name === "POS_BASIC");
  const crmModule = modules.find(m => m.name === "CRM_LOYALTY");
  const invModule = modules.find(m => m.name === "INVENTORY_ADVANCED");
  const pharmacyModule = modules.find(m => m.name === "PHARMACY_SPECIAL");
  const analyticsModule = modules.find(m => m.name === "ANALYTICS_AI");

  for (const plan of plans) {
    // Every plan gets at least POS
    if (posModule) {
      await prisma.planModule.upsert({
        where: { planId_moduleId: { planId: plan.id, moduleId: posModule.id } },
        update: {},
        create: { planId: plan.id, moduleId: posModule.id }
      });
    }

    // Paid plans get CRM and Inventory
    if (plan.price > 0) {
      if (crmModule) await prisma.planModule.upsert({
        where: { planId_moduleId: { planId: plan.id, moduleId: crmModule.id } },
        update: {},
        create: { planId: plan.id, moduleId: crmModule.id }
      });
      if (invModule) await prisma.planModule.upsert({
        where: { planId_moduleId: { planId: plan.id, moduleId: invModule.id } },
        update: {},
        create: { planId: plan.id, moduleId: invModule.id }
      });
    }

    // High tier and Lifetime get everything
    if (plan.name.includes("Year") || plan.name.includes("Lifetime")) {
        for(const mod of modules) {
             await prisma.planModule.upsert({
                where: { planId_moduleId: { planId: plan.id, moduleId: mod.id } },
                update: {},
                create: { planId: plan.id, moduleId: mod.id }
            });
        }
    }
  }

  console.log("Successfully assigned modules to plans!");
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
