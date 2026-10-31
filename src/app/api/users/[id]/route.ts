import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";
const LOCKED_SUPER_ADMIN_EMAIL = "lincoztech@gmail.com";

const ASSIGNABLE_ROLES = [
  "TENANT_ADMIN", "BRANCH_MANAGER", "CASHIER",
  "KITCHEN_STAFF", "WAIT_STAFF", "HR_STAFF",
  "INVENTORY_MANAGER", "ACCOUNTANT",
];

function getAuth(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as any; } catch { return null; }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = getAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    // Prevent editing the locked super admin account via this endpoint
    const target = await prisma.user.findUnique({ where: { id }, select: { email: true, role: true } });
    if (target?.email === LOCKED_SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "This account cannot be modified." }, { status: 403 });
    }

    const body = await req.json();
    const { name, phone, userRole, status, branchId, password } = body;

    // Block assigning SUPER_ADMIN role
    if (userRole && !ASSIGNABLE_ROLES.includes(userRole)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (userRole !== undefined) updateData.role = userRole;
    if (status !== undefined) updateData.status = status;
    if (branchId !== undefined) updateData.branchId = branchId || null;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const whereCondition: any = { id };
    if (decoded.role !== "SUPER_ADMIN") {
      whereCondition.tenantId = decoded.tenantId;
    }

    const user = await prisma.user.update({
      where: whereCondition,
      data: updateData,
      select: {
        id: true, name: true, email: true, role: true,
        status: true, phone: true,
        branch: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = getAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["SUPER_ADMIN", "TENANT_ADMIN"].includes(decoded.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    // Cannot delete super admin
    const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (target?.email === LOCKED_SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "This account cannot be deleted." }, { status: 403 });
    }

    if (id === decoded.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id, tenantId: decoded.tenantId },
      data: { status: "INACTIVE" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
