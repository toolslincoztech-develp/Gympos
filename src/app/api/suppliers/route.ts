import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = requireTenantUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const suppliers = await prisma.supplier.findMany({
      where: { tenantId: user.tenantId },
      include: {
        ledger: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(suppliers);
  } catch (error: any) {
    console.error("GET Suppliers Error:", error);
    return NextResponse.json({ error: "Failed to load suppliers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = requireTenantUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, contact, email, address } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
    }
    const supplier = await prisma.supplier.create({
      data: {
        name,
        contact,
        email,
        address,
        tenantId: user.tenantId,
      },
    });
    return NextResponse.json(supplier);
  } catch (error: any) {
    console.error("POST Supplier Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
