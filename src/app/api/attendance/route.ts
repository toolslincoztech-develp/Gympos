import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";
const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";

function getAuth(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as any; } catch { return null; }
}

export async function GET(req: NextRequest) {
  const decoded = getAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const date = dateStr ? new Date(dateStr) : new Date();

  try {
    const employees = await prisma.employee.findMany({
      where: { tenantId: decoded.tenantId },
      include: {
        attendances: {
          where: {
            date: { gte: startOfDay(date), lte: endOfDay(date) },
          },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(employees);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const decoded = getAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { employeeId, status, date } = body;

    const attendanceDate = date ? new Date(date) : new Date();

    // Upsert: one record per employee per day
    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: { gte: startOfDay(attendanceDate), lte: endOfDay(attendanceDate) },
      },
    });

    let attendance;
    if (existing) {
      attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: { status },
      });
    } else {
      attendance = await prisma.attendance.create({
        data: { employeeId, status, date: attendanceDate },
      });
    }

    return NextResponse.json(attendance);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
