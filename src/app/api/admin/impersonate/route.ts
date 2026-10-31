import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";

async function handleImpersonate(req: NextRequest, tenantId: string) {
  const currentUser = getAuthUser(req);

  // Must be SUPER_ADMIN or already an impersonating SUPER_ADMIN
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && !currentUser.isImpersonated)) {
    return NextResponse.json({ error: "Unauthorized. SuperAdmin required." }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      users: true,
      modules: { include: { module: true } },
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant business not found" }, { status: 404 });
  }

  // Find or create admin user for this tenant
  let targetUser = tenant.users.find((u) => u.role === "TENANT_ADMIN") || tenant.users[0];

  if (!targetUser) {
    // Create an admin user if none exists
    targetUser = await prisma.user.create({
      data: {
        name: `${tenant.name} Admin`,
        email: tenant.email || `admin_${tenant.id.slice(0, 6)}@pos.local`,
        password: "$2a$10$defaultHashPasswordForImpersonationOnly",
        role: "TENANT_ADMIN",
        status: "ACTIVE",
        tenantId: tenant.id,
      },
    });
  }

  const moduleNames = tenant.modules.map((tm: any) => tm.module?.name || tm.name || tm.code || tm.moduleId || "");

  const impersonatedToken = jwt.sign(
    {
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role || "TENANT_ADMIN",
      tenantId: tenant.id,
      tenantName: tenant.name,
      status: "ACTIVE",
      modules: moduleNames,
      isImpersonated: true,
      impersonatorEmail: currentUser.email || "lincoztech@gmail.com",
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  const response = req.method === "GET" 
    ? NextResponse.redirect(new URL("/dashboard", req.url))
    : NextResponse.json({ success: true, redirectUrl: "/dashboard", tenantName: tenant.name });

  response.cookies.set("token", impersonatedToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return response;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId parameter required" }, { status: 400 });
  }
  return handleImpersonate(req, tenantId);
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await req.json();
    if (!tenantId) {
      return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    }
    return handleImpersonate(req, tenantId);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
