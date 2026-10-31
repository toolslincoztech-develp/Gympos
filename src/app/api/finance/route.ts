import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { getCached, setCached } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = requireTenantUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month"); // e.g., "2026-10"

    const now = new Date();
    let periodStart = startOfMonth(now);
    let periodEnd = endOfMonth(now);

    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number);
      const targetDate = new Date(y, m - 1, 1);
      periodStart = startOfMonth(targetDate);
      periodEnd = endOfMonth(targetDate);
    }

    const tenantId = user.tenantId;
    const cacheKey = `tenant:${tenantId}:finance:${monthParam || "current"}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const isCurrentMonth = now >= periodStart && now <= periodEnd;

    const [orders, expenses, purchases, products, todayAgg] = await Promise.all([
      prisma.order.findMany({
        where: {
          tenantId,
          status: { not: "CANCELLED" },
          createdAt: { gte: periodStart, lte: periodEnd },
        },
        include: {
          items: {
            include: {
              product: { select: { name: true, costPrice: true } },
            },
          },
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.expense.findMany({
        where: {
          tenantId,
          date: { gte: periodStart, lte: periodEnd },
        },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { date: "desc" },
      }),
      prisma.purchase.findMany({
        where: {
          tenantId,
          createdAt: { gte: periodStart, lte: periodEnd },
        },
        include: {
          supplier: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: { tenantId, type: { not: "DEAL" } },
        select: { id: true, name: true, price: true, costPrice: true, stock: true },
      }),
      isCurrentMonth
        ? Promise.resolve(null)
        : prisma.order.aggregate({
            where: {
              tenantId,
              status: { not: "CANCELLED" },
              createdAt: { gte: todayStart, lte: todayEnd },
            },
            _sum: { totalAmount: true },
            _count: { id: true },
          }),
    ]);

    // Calculate Revenue, Tax, Discount, COGS
    let totalRevenue = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let totalCogs = 0;
    let cashRevenue = 0;
    let cardRevenue = 0;
    let cashOrdersCount = 0;
    let cardOrdersCount = 0;
    let todayRevenue = 0;
    let todayOrdersCount = 0;

    for (const order of orders) {
      const orderAmount = Number(order.totalAmount || 0);
      totalRevenue += orderAmount;
      totalTax += Number(order.tax || 0);
      totalDiscount += Number(order.discount || 0);

      if (isCurrentMonth && order.createdAt >= todayStart && order.createdAt <= todayEnd) {
        todayRevenue += orderAmount;
        todayOrdersCount++;
      }

      if (order.paymentMethod === "CASH") {
        cashRevenue += orderAmount;
        cashOrdersCount++;
      } else {
        cardRevenue += orderAmount;
        cardOrdersCount++;
      }

      for (const item of order.items || []) {
        const unitCost = Number(item.product?.costPrice || 0);
        totalCogs += unitCost * Number(item.quantity || 0);
      }
    }

    if (!isCurrentMonth && todayAgg) {
      todayRevenue = Number(todayAgg._sum.totalAmount || 0);
      todayOrdersCount = todayAgg._count.id;
    }
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalPurchases = purchases.reduce((s, p) => s + Number(p.totalAmount || 0), 0);

    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Inventory Valuation
    let inventoryCostValue = 0;
    let inventoryRetailValue = 0;
    for (const p of products) {
      const stk = Math.max(0, Number(p.stock || 0));
      inventoryCostValue += stk * Number(p.costPrice || 0);
      inventoryRetailValue += stk * Number(p.price || 0);
    }

    // Daily Trend (Income vs Expenses)
    const dailyMap: Record<string, { date: string; revenue: number; expenses: number; profit: number }> = {};
    orders.forEach((o) => {
      const d = new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!dailyMap[d]) dailyMap[d] = { date: d, revenue: 0, expenses: 0, profit: 0 };
      dailyMap[d].revenue += Number(o.totalAmount || 0);
    });
    expenses.forEach((e) => {
      const d = new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!dailyMap[d]) dailyMap[d] = { date: d, revenue: 0, expenses: 0, profit: 0 };
      dailyMap[d].expenses += Number(e.amount || 0);
    });
    const dailyTrend = Object.values(dailyMap)
      .map((item) => ({
        ...item,
        revenue: Math.round(item.revenue * 100) / 100,
        expenses: Math.round(item.expenses * 100) / 100,
        profit: Math.round((item.revenue - item.expenses) * 100) / 100,
      }))
      .reverse();

    // Expenses by Category
    const expenseByCatMap: Record<string, number> = {};
    expenses.forEach((e) => {
      expenseByCatMap[e.category] = (expenseByCatMap[e.category] || 0) + Number(e.amount || 0);
    });
    const expensesByCategory = Object.entries(expenseByCatMap).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }));

    // Unified Ledger Transactions
    const transactions = [
      ...orders.map((o) => ({
        id: `ord-${o.id}`,
        type: "INCOME",
        title: `Order #${o.orderNumber}`,
        category: o.paymentMethod || "CASH",
        amount: Number(o.totalAmount || 0),
        tax: Number(o.tax || 0),
        discount: Number(o.discount || 0),
        date: o.createdAt,
        actor: o.user?.name || "Cashier",
      })),
      ...expenses.map((e) => ({
        id: `exp-${e.id}`,
        type: "EXPENSE",
        title: e.description || `${e.category} Expense`,
        category: e.category,
        amount: -Number(e.amount || 0),
        tax: 0,
        discount: 0,
        date: e.date,
        actor: e.user?.name || "Staff",
      })),
      ...purchases.map((p) => ({
        id: `pur-${p.id}`,
        type: "PURCHASE",
        title: `Supply Invoice ${p.invoiceNo || "N/A"} (${p.supplier?.name || "Vendor"})`,
        category: "INVENTORY SUPPLY",
        amount: -Number(p.totalAmount || 0),
        tax: 0,
        discount: 0,
        date: p.createdAt,
        actor: p.supplier?.name || "Supplier",
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const payload = {
      summary: {
        todayRevenue,
        todayOrdersCount,
        totalRevenue,
        ordersCount: orders.length,
        totalTax,
        totalDiscount,
        totalCogs,
        grossProfit,
        totalExpenses,
        expensesCount: expenses.length,
        totalPurchases,
        purchasesCount: purchases.length,
        netProfit,
        profitMargin,
        cashRevenue,
        cardRevenue,
        cashOrdersCount,
        cardOrdersCount,
        inventoryCostValue,
        inventoryRetailValue,
      },
      dailyTrend,
      expensesByCategory,
      transactions,
    };

    setCached(cacheKey, payload, 20000);
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("Finance API Error:", error);
    return NextResponse.json({ error: "Failed to load finance data" }, { status: 500 });
  }
}

