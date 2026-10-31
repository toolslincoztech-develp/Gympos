import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";

function getAuth(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as any; } catch { return null; }
}

// PATCH — update plan
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = getAuth(req);
  if (!decoded || decoded.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const { name, price, billingType, features } = await req.json();
    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(price != null && { price: parseFloat(price) }),
        ...(billingType && { billingType }),
        ...(Array.isArray(features) && { features: features.filter(Boolean) }),
      },
    });
    return NextResponse.json(plan);
  } catch (error: any) {
    if (error.code === "P2002") return NextResponse.json({ error: "Plan name already exists" }, { status: 409 });
    if (error.code === "P2025") return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — remove plan
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = getAuth(req);
  if (!decoded || decoded.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    // Check if any tenants are on this plan
    const subCount = await prisma.subscription.count({ where: { planId: id } });
    if (subCount > 0)
      return NextResponse.json(
        { error: `Cannot delete: ${subCount} tenant(s) are subscribed to this plan` },
        { status: 409 }
      );

    await prisma.subscriptionPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2025") return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
