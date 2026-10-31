import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!requireSuperAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Auto-seed required modules
    const requiredModules = [
      { name: "GYM_FITNESS_PRO", description: "Gym memberships, supplement sales & fitness merch" },
      { name: "BAKERY_PRO", description: "Bakery billing, confectionery items & cafe sales" }
    ];
    for (const mod of requiredModules) {
      const existing = await prisma.module.findUnique({ where: { name: mod.name } });
      if (!existing) {
        await prisma.module.create({ data: mod });
      }
    }

    const modules = await prisma.module.findMany({
      include: {
        _count: { select: { tenants: true, plans: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(modules);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!requireSuperAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, isActive } = await req.json();
    const module = await prisma.module.update({
      where: { id },
      data: { isActive },
    });
    return NextResponse.json(module);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
