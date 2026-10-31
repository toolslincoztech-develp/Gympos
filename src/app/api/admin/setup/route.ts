import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const SETUP_SECRET = process.env.SETUP_SECRET || "licoz-setup-init-2026";
const SUPER_ADMIN_EMAIL = "linoctech@gmail.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    // 1. Modules — use findFirst + create to avoid upsert unique constraint issue
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

    const createdModules: any[] = [];
    for (const mod of moduleList) {
      let m = await prisma.module.findFirst({ where: { name: mod.name } });
      if (!m) {
        m = await prisma.module.create({ data: mod });
      } else {
        m = await prisma.module.update({ where: { id: m.id }, data: { description: mod.description } });
      }
      createdModules.push(m);
    }

    // 2. Plans — findFirst + create/update
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

    // 3. Super Admin
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "Lincoz@Tech-2";
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    const existing = await prisma.user.findFirst({ where: { email: SUPER_ADMIN_EMAIL } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: SUPER_ADMIN_EMAIL,
          password: hashedPassword,
          name: "Lincoz Tech",
          role: "SUPER_ADMIN",
          status: "ACTIVE",
        },
      });
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: { password: hashedPassword, role: "SUPER_ADMIN", status: "ACTIVE" },
      });
    }

    return NextResponse.json({
      message: "System initialized successfully",
      modulesCount: createdModules.length,
      plansCount: planList.length,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
