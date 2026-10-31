import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";
import { getCached, setCached, invalidateTenantCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = requireTenantUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cacheKey = `tenant:${user.tenantId}:categories`;
    const cached = getCached<any>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const categories = await prisma.category.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { name: "asc" },
    });

    setCached(cacheKey, categories, 60000);
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("GET Categories Error:", error);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = requireTenantUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, description } = await req.json();
    const category = await prisma.category.create({
      data: { name, description, tenantId: user.tenantId } as any,
    });
    invalidateTenantCache(user.tenantId);
    return NextResponse.json(category);
  } catch (error: any) {
    console.error("POST Category Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
