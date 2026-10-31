import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";

// SUPER_ADMIN email is locked — cannot be created via this API
const LOCKED_SUPER_ADMIN_EMAIL = "lincoztech@gmail.com";

// Roles that tenant admins can assign (SUPER_ADMIN is never assignable)
const ASSIGNABLE_ROLES = [
  "TENANT_ADMIN",
  "BRANCH_MANAGER",
  "CASHIER",
  "KITCHEN_STAFF",
  "WAIT_STAFF",
  "HR_STAFF",
  "INVENTORY_MANAGER",
  "ACCOUNTANT",
];

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
  const { tenantId, role } = decoded;

  if (!["SUPER_ADMIN", "TENANT_ADMIN", "BRANCH_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        branch: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const decoded = getAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tenantId, role } = decoded;

  if (!["SUPER_ADMIN", "TENANT_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, password, userRole, phone, branchId } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }

    // Block creating super admin via this endpoint
    if (email.toLowerCase() === LOCKED_SUPER_ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: "This email is reserved." }, { status: 403 });
    }

    // Block assigning SUPER_ADMIN role
    const assignedRole = userRole || "CASHIER";
    if (!ASSIGNABLE_ROLES.includes(assignedRole)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: assignedRole,
        phone,
        tenantId,
        branchId: branchId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        branch: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
