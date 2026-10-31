import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { invalidateTenantCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";

// GET today's sales summary for the End of Day report
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const tenantId = decoded.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 403 });

    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const closed = searchParams.get("closed") === "true";
    const date = searchParams.get("date");
    const month = searchParams.get("month");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Fetch tenant details
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        ntn: true,
        strn: true
      }
    });

    const where: any = { tenantId };
    if (closed) {
      where.isClosed = true;
    } else {
      where.isClosed = false;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate + "T00:00:00.000Z"),
        lte: new Date(endDate + "T23:59:59.999Z")
      };
    } else if (date) {
      where.createdAt = {
        gte: new Date(date + "T00:00:00.000Z"),
        lte: new Date(date + "T23:59:59.999Z")
      };
    } else if (month) {
      const [year, m] = month.split("-");
      const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate();
      where.createdAt = {
        gte: new Date(`${year}-${m}-01T00:00:00.000Z`),
        lte: new Date(`${year}-${m}-${String(lastDay).padStart(2, "0")}T23:59:59.999Z`)
      };
    }

    // Fetch orders matching query parameters
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: { select: { name: true } }
          }
        },
        user: { select: { name: true } }
      }
    });

    // Calculate metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0);
    const totalTax = orders.reduce((sum, o) => sum + o.tax, 0);
    const netSales = totalRevenue - totalDiscount - totalTax;

    // Payment Methods breakdown
    const paymentMethods: Record<string, { count: number; total: number }> = {};
    // Order Types breakdown
    const orderTypes: Record<string, { count: number; total: number }> = {};
    // Cashiers breakdown
    const cashiers: Record<string, { count: number; total: number }> = {};
    // Product Sales breakdown
    const productSales: Record<string, { name: string; quantity: number; total: number }> = {};

    orders.forEach(order => {
      // Payment Method
      const pm = order.paymentMethod || "UNKNOWN";
      if (!paymentMethods[pm]) paymentMethods[pm] = { count: 0, total: 0 };
      paymentMethods[pm].count += 1;
      paymentMethods[pm].total += order.totalAmount;

      // Order Type
      const ot = order.orderType || "RETAIL";
      if (!orderTypes[ot]) orderTypes[ot] = { count: 0, total: 0 };
      orderTypes[ot].count += 1;
      orderTypes[ot].total += order.totalAmount;

      // Cashier
      const cashierName = order.user?.name || "Unknown Cashier";
      if (!cashiers[cashierName]) cashiers[cashierName] = { count: 0, total: 0 };
      cashiers[cashierName].count += 1;
      cashiers[cashierName].total += order.totalAmount;

      // Products
      order.items.forEach(item => {
        const prodId = item.productId;
        const prodName = item.product?.name || "Deleted Product";
        if (!productSales[prodId]) {
          productSales[prodId] = { name: prodName, quantity: 0, total: 0 };
        }
        productSales[prodId].quantity += item.quantity;
        productSales[prodId].total += item.price * item.quantity;
      });
    });

    return NextResponse.json({
      tenant,
      totalOrders,
      totalRevenue,
      totalDiscount,
      totalTax,
      netSales,
      paymentMethods: Object.entries(paymentMethods).map(([name, data]) => ({ name, ...data })),
      orderTypes: Object.entries(orderTypes).map(([name, data]) => ({ name, ...data })),
      cashiers: Object.entries(cashiers).map(([name, data]) => ({ name, ...data })),
      products: Object.values(productSales).sort((a, b) => b.quantity - a.quantity)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST to reset the day (delete all orders for the tenant)
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const tenantId = decoded.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 403 });

    // Perform transaction to mark orders as closed instead of deleting them
    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.order.updateMany({
        where: { tenantId, isClosed: false },
        data: { isClosed: true }
      });
      // Reset the orderNumber sequence back to 1 for the new day
      await tx.$executeRawUnsafe(`
        SELECT setval(pg_get_serial_sequence('\"Order\"', 'orderNumber'), 1, false);
      `);
      return updateResult;
    });

    invalidateTenantCache(tenantId);
    return NextResponse.json({ success: true, deletedCount: result.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
