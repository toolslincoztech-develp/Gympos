import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { startOfMonth, endOfMonth } from "date-fns";
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

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "2026-05"

  const cacheKey = `tenant:${decoded.tenantId}:expenses:${month || "current"}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const now = month ? new Date(month + "-01") : new Date();

  try {
    const expenses = await prisma.expense.findMany({
      where: {
        tenantId: decoded.tenantId,
        date: { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
      include: { user: { select: { name: true } } },
      orderBy: { date: "desc" },
    });
    setCached(cacheKey, expenses, 20000);
    return NextResponse.json(expenses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const decoded = getAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { category, amount, description, date } = body;

    const expense = await prisma.expense.create({
      data: {
        category,
        amount: parseFloat(amount),
        description,
        date: date ? new Date(date) : new Date(),
        userId: decoded.id,
        tenantId: decoded.tenantId,
      },
      include: { user: { select: { name: true } } },
    });

    invalidateTenantCache(decoded.tenantId);
    return NextResponse.json(expense);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
