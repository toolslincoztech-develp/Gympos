import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

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

  try {
    const branches = await prisma.branch.findMany({
      where: { tenantId: decoded.tenantId },
      include: {
        _count: { select: { users: true, orders: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(branches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const decoded = getAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Restrict branch creation to Super Admin only. Tenant Admins cannot create branches.
  if (decoded.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Branch creation is restricted to Super Admin only. Please contact Lincoztech." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, location, phone } = body;

    const branch = await prisma.branch.create({
      data: { name, location, phone, tenantId: decoded.tenantId },
    });

    return NextResponse.json(branch);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
