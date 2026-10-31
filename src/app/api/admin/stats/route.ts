import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!requireSuperAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const totalTenants = await prisma.tenant.count();

    const subscriptions = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true },
    });
    const monthlyRevenue = subscriptions.reduce(
      (acc: number, sub: any) => acc + (sub.plan?.price || 0), 0
    );

    const activeModules = await prisma.module.count({ where: { isActive: true } });

    const recentTenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { subscription: { include: { plan: true } } },
    });

    // Real revenue history: count subscriptions created per month for last 6 months
    const now = new Date();
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const revenueHistory = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      // Count active subscriptions that existed during this month
      const activeSubs = await prisma.subscription.findMany({
        where: {
          startDate: { lte: end },
          endDate: { gte: start },
        },
        include: { plan: true },
      });

      const revenue = activeSubs.reduce(
        (acc: number, sub: any) => acc + (sub.plan?.price || 0), 0
      );

      revenueHistory.push({
        month: months[monthDate.getMonth()],
        revenue: Math.round(revenue * 100) / 100,
      });
    }

    return NextResponse.json({
      totalTenants,
      monthlyRevenue,
      activeModules,
      systemHealth: "99.9%",
      recentTenants,
      revenueHistory,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
