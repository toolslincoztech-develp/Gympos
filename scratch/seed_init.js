require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");
const bcrypt = require("bcryptjs");

let connectionString = process.env.DATABASE_URL;
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
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding initial data...");

  // 1. Modules
  const moduleList = [
    { name: "POS_BASIC", description: "Standard POS Billing & Sales" },
    { name: "INVENTORY_ADVANCED", description: "Stock, Batch Tracking, Expiry & Warehouse" },
    { name: "RESTAURANT_PRO", description: "Tables, KDS, Recipe & Menu Management" },
    { name: "PHARMACY_SPECIAL", description: "Medicine Database, Expiry Alerts & Batch Mgmt" },
    { name: "RETAIL_GROCERY", description: "Barcode System, Unit Conversion & Bulk Pricing" },
    { name: "WHOLESALE_DISTRIBUTION", description: "Ledgers, Credit Sales & Multi-Warehouse" },
    { name: "HR_PAYROLL", description: "Employee Attendance, Shift & Salary Management" },
    { name: "ACCOUNTING_PRO", description: "Full Ledgers, P&L, Cash Flow & Tax Reports" },
    { name: "CRM_LOYALTY", description: "Customer Loyalty, History & Notifications" },
    { name: "MULTI_BRANCH", description: "Branch Transfers, Centralized Inventory & Reports" },
    { name: "ANALYTICS_AI", description: "Advanced Sales Forecasting & AI Analytics" },
    { name: "GYM_FITNESS_PRO", description: "Gym memberships, supplement sales & fitness merch" },
    { name: "BAKERY_PRO", description: "Bakery billing, confectionery items & cafe sales" },
  ];

  const createdModules = [];
  for (const mod of moduleList) {
    let m = await prisma.module.findFirst({ where: { name: mod.name } });
    if (!m) {
      m = await prisma.module.create({ data: mod });
    } else {
      m = await prisma.module.update({ where: { id: m.id }, data: { description: mod.description } });
    }
    createdModules.push(m);
  }
  console.log(`Created/updated ${createdModules.length} modules.`);

  // 2. Plans
  const planList = [
    {
      name: "Starter",
      price: 29.99,
      billingType: "MONTHLY",
      features: ["1 Branch", "Standard POS", "Basic Inventory", "Daily Reports"],
      moduleNames: ["POS_BASIC", "INVENTORY_ADVANCED"],
    },
    {
      name: "Professional",
      price: 59.99,
      billingType: "MONTHLY",
      features: ["2 Branches", "KDS/Expiry Alerts", "Accounting", "CRM", "HR Module"],
      moduleNames: ["POS_BASIC", "INVENTORY_ADVANCED", "RESTAURANT_PRO", "PHARMACY_SPECIAL", "ACCOUNTING_PRO", "CRM_LOYALTY", "HR_PAYROLL"],
    },
    {
      name: "Enterprise",
      price: 149.99,
      billingType: "MONTHLY",
      features: ["Unlimited Branches", "Branch Transfers", "AI Analytics", "Full Support", "All Modules"],
      moduleNames: moduleList.map((m) => m.name),
    },
  ];

  for (const planData of planList) {
    const { moduleNames, ...data } = planData;
    let plan = await prisma.subscriptionPlan.findFirst({ where: { name: planData.name } });
    if (!plan) {
      plan = await prisma.subscriptionPlan.create({ data });
    } else {
      plan = await prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: { price: data.price, features: data.features },
      });
    }

    for (const modName of moduleNames) {
      const mod = createdModules.find((m) => m.name === modName);
      if (!mod) continue;
      const existing = await prisma.planModule.findFirst({
        where: { planId: plan.id, moduleId: mod.id },
      });
      if (!existing) {
        await prisma.planModule.create({ data: { planId: plan.id, moduleId: mod.id } });
      }
    }
  }
  console.log(`Created/updated ${planList.length} plans.`);

  // 3. Super Admin
  const email = process.env.SUPER_ADMIN_EMAIL || "linoctech@gmail.com";
  const password = process.env.SUPER_ADMIN_PASSWORD || "Lincoz@Tech-2";
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findFirst({ where: { email } });
  if (!existingUser) {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: "Lincoz Tech",
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });
    console.log(`Super Admin created successfully: ${email}`);
  } else {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { password: hashedPassword, role: "SUPER_ADMIN", status: "ACTIVE" },
    });
    console.log(`Super Admin updated successfully: ${email}`);
  }

  await prisma.$disconnect();
  await pool.end();
  console.log("Done!");
}

main().catch((err) => {
  console.error("Error during seed:", err);
  process.exit(1);
});
