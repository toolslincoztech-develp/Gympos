import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Toggle a module for a specific tenant
export async function POST(req: NextRequest) {
  if (!requireSuperAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tenantId, moduleId, enable } = await req.json();

    if (!tenantId || !moduleId) {
      return NextResponse.json({ error: "tenantId and moduleId required" }, { status: 400 });
    }

    if (enable) {
      // Add module to tenant
      const existing = await prisma.tenantModule.findFirst({
        where: { tenantId, moduleId },
      });
      if (!existing) {
        await prisma.tenantModule.create({ data: { tenantId, moduleId } });
      }
    } else {
      // Remove module from tenant
      await prisma.tenantModule.deleteMany({ where: { tenantId, moduleId } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Bulk update modules for a tenant
export async function PUT(req: NextRequest) {
  if (!requireSuperAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tenantId, moduleIds } = await req.json();

    if (!tenantId || !Array.isArray(moduleIds)) {
      return NextResponse.json({ error: "tenantId and moduleIds array required" }, { status: 400 });
    }

    // Update in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing modules for this tenant
      await tx.tenantModule.deleteMany({
        where: { tenantId }
      });

      // 2. Create many new entries
      if (moduleIds.length > 0) {
        await tx.tenantModule.createMany({
          data: moduleIds.map((moduleId) => ({
            tenantId,
            moduleId
          })),
          skipDuplicates: true
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT tenant-modules error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
