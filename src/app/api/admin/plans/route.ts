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

// GET all plans — readable by any authenticated user
export async function GET(req: NextRequest) {
  const decoded = getAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        modules: { include: { module: true } },
        _count: { select: { subscriptions: true } },
      },
      orderBy: { price: "asc" },
    });
    return NextResponse.json(plans);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new plan — super admin only
export async function POST(req: NextRequest) {
  const decoded = getAuth(req);
  if (!decoded || decoded.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { name, price, billingType, features } = await req.json();
    if (!name || price == null || !billingType)
      return NextResponse.json({ error: "name, price, billingType required" }, { status: 400 });

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: name.trim(),
        price: parseFloat(price),
        billingType,
        features: Array.isArray(features) ? features.filter(Boolean) : [],
      },
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") return NextResponse.json({ error: "Plan name already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
