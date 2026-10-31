import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";
import { startOfDay, endOfDay } from "date-fns";
import { getCached, setCached, invalidateTenantCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = requireTenantUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cacheKey = `tenant:${user.tenantId}:gym-checkins`;
    const cached = getCached<any>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const now = new Date();
    const checkins = await prisma.gymCheckin.findMany({
      where: {
        tenantId: user.tenantId,
        checkedInAt: {
          gte: startOfDay(now),
          lte: endOfDay(now),
        },
      },
      orderBy: { checkedInAt: "desc" },
    });

    setCached(cacheKey, checkins, 15000);
    return NextResponse.json(checkins);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireTenantUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { customerId, memberName, memberPhone, planName, status } = body;

    if (!memberName) {
      return NextResponse.json({ error: "Member name is required" }, { status: 400 });
    }

    const checkin = await prisma.gymCheckin.create({
      data: {
        customerId: customerId || null,
        memberName,
        memberPhone: memberPhone || null,
        planName: planName || "Standard Membership",
        status: status || "ACTIVE",
        tenantId: user.tenantId,
      },
    });

    invalidateTenantCache(user.tenantId);
    return NextResponse.json(checkin);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

