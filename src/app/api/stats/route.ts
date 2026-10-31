import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { getCached, setCached } from "@/lib/cache";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const tenantId = decoded.tenantId;

    if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 403 });

    const cacheKey = `tenant:${tenantId}:stats`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [todayAgg, monthAgg, totalProducts, recentOrders] = await Promise.all([
      prisma.order.aggregate({
        where: {
          tenantId,
          createdAt: { gte: todayStart, lte: todayEnd },
          status: "COMPLETED",
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.order.aggregate({
        where: {
          tenantId,
          createdAt: { gte: monthStart, lte: monthEnd },
          status: "COMPLETED",
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.product.count({ where: { tenantId } }),
      prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: { select: { name: true } },
        },
      }),
    ]);

    const payload = {
      todayRevenue: Number(todayAgg._sum.totalAmount || 0),
      todayOrdersCount: todayAgg._count.id,
      monthRevenue: Number(monthAgg._sum.totalAmount || 0),
      monthOrdersCount: monthAgg._count.id,
      totalProducts,
      recentOrders,
    };

    setCached(cacheKey, payload, 20000);

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
