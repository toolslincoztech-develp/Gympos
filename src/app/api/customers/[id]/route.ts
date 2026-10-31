import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { invalidateTenantCache } from "@/lib/cache";

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = getAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      notes,
      planName,
      planId,
      membershipStart,
      membershipExpiry,
      membershipStatus,
    } = body;

    const updated = await prisma.customer.update({
      where: { id, tenantId: decoded.tenantId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(notes !== undefined && { notes }),
        ...(planName !== undefined && { planName }),
        ...(planId !== undefined && { planId }),
        ...(membershipStart !== undefined && {
          membershipStart: membershipStart ? new Date(membershipStart) : null,
        }),
        ...(membershipExpiry !== undefined && {
          membershipExpiry: membershipExpiry ? new Date(membershipExpiry) : null,
        }),
        ...(membershipStatus !== undefined && { membershipStatus }),
      },
    });

    invalidateTenantCache(decoded.tenantId);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = getAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.customer.delete({
      where: { id, tenantId: decoded.tenantId },
    });

    invalidateTenantCache(decoded.tenantId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
