import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";

function getAuth(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as any; } catch { return null; }
}

export async function POST(req: NextRequest) {
  const decoded = getAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["TENANT_ADMIN", "SUPER_ADMIN"].includes(decoded.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { planId } = await req.json();
    if (!planId) return NextResponse.json({ error: "planId is required" }, { status: 400 });

    const tenantId = decoded.tenantId;

    // Check plan exists
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    // Upsert subscription
    const existing = await prisma.subscription.findUnique({ where: { tenantId } });

    let subscription;
    if (existing) {
      subscription = await prisma.subscription.update({
        where: { tenantId },
        data: {
          planId,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        },
        include: { plan: true },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          tenantId,
          planId,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        },
        include: { plan: true },
      });
    }

    // Update tenant modules to match new plan
    const planModules = await prisma.planModule.findMany({ where: { planId } });
    await prisma.tenantModule.deleteMany({ where: { tenantId } });
    if (planModules.length > 0) {
      await prisma.tenantModule.createMany({
        data: planModules.map((pm) => ({ tenantId, moduleId: pm.moduleId })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ success: true, subscription });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
