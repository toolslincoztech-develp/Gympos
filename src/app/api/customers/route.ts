import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { getCached, setCached, invalidateTenantCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";

function getAuth(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const decoded = getAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tenantId } = decoded;

  try {
    const cacheKey = `tenant:${tenantId}:customers`;
    const cached = getCached<any>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const customers = await prisma.customer.findMany({
      where: { tenantId },
      include: {
        _count: { select: { orders: true } },
        orders: {
          select: { totalAmount: true },
          where: { status: "COMPLETED" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = customers.map((c: any) => ({
      ...c,
      totalSpent: c.orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0),
      orderCount: c._count.orders,
    }));

    setCached(cacheKey, enriched, 30000);
    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const decoded = getAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tenantId } = decoded;

  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      notes,
      planName,
      planId,
      membershipStart,
      membershipExpiry,
      membershipStatus,
    } = body;

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        planName: planName || null,
        planId: planId || null,
        membershipStart: membershipStart ? new Date(membershipStart) : null,
        membershipExpiry: membershipExpiry ? new Date(membershipExpiry) : null,
        membershipStatus: membershipStatus || "ACTIVE",
        tenantId,
      },
    });

    invalidateTenantCache(tenantId);
    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
