import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Get Single Tenant
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: { include: { plan: true } },
        modules: true,
        branches: true,
        _count: { select: { users: true } },
      },
    });
    return NextResponse.json(tenant);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update Tenant / Subscription
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, phone, address, status, renewSubscription, upgradePlanId } = body;

    // 1. Update basic info (only update fields that are provided)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (status !== undefined) updateData.status = status;

    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
    });

    // 1b. Cascade status to all users and subscription of this tenant
    if (status === "ACTIVE") {
      await prisma.user.updateMany({
        where: { tenantId: id },
        data: { status: "ACTIVE" },
      });
      await prisma.subscription.updateMany({
        where: { tenantId: id, status: "SUSPENDED" },
        data: { status: "ACTIVE" },
      });
    } else if (status === "SUSPENDED") {
      await prisma.user.updateMany({
        where: { tenantId: id },
        data: { status: "SUSPENDED" },
      });
      await prisma.subscription.updateMany({
        where: { tenantId: id, status: "ACTIVE" },
        data: { status: "SUSPENDED" },
      });
    }

    // 2. Subscription Renewal — extend from today if expired, else from current end date
    if (renewSubscription) {
      const currentSub = await prisma.subscription.findFirst({
        where: { tenantId: id },
        include: { plan: true },
      });

      if (currentSub) {
        const baseDate = new Date(currentSub.endDate) > new Date()
          ? new Date(currentSub.endDate)
          : new Date();
        let newEndDate = new Date(baseDate);
        
        const plan = currentSub.plan;
        if (plan.billingType === "TRIAL") {
          newEndDate.setDate(newEndDate.getDate() + 7);
        } else if (plan.billingType === "6_MONTHS") {
          newEndDate.setMonth(newEndDate.getMonth() + 6);
        } else if (plan.billingType === "YEARLY") {
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        } else if (plan.billingType === "LIFETIME") {
          newEndDate.setFullYear(newEndDate.getFullYear() + 99);
        } else {
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        }

        await prisma.subscription.update({
          where: { id: currentSub.id },
          data: { endDate: newEndDate, status: "ACTIVE" },
        });
      }
    }

    // 3. Plan Upgrade/Change — upsert so it works even if no subscription exists yet
    if (upgradePlanId) {
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: upgradePlanId } });
      if (!plan) throw new Error("Plan not found");

      const now = new Date();
      let endDate = new Date(now);
      if (plan.billingType === "TRIAL") {
        endDate.setDate(endDate.getDate() + 7);
      } else if (plan.billingType === "6_MONTHS") {
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (plan.billingType === "YEARLY") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else if (plan.billingType === "LIFETIME") {
        endDate.setFullYear(endDate.getFullYear() + 99);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const existingSub = await prisma.subscription.findFirst({
        where: { tenantId: id },
      });

      if (existingSub) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: {
            planId: upgradePlanId,
            status: "ACTIVE",
            startDate: new Date(),
            endDate: endDate,
          },
        });
      } else {
        // No subscription yet — create one
        await prisma.subscription.create({
          data: {
            tenantId: id,
            planId: upgradePlanId,
            status: "ACTIVE",
            startDate: new Date(),
            endDate: endDate,
          },
        });
      }

      // Assign plan modules to tenant
      const planModules = await prisma.planModule.findMany({
        where: { planId: upgradePlanId },
      });

      if (planModules.length > 0) {
        // Remove old modules and assign new ones
        await prisma.tenantModule.deleteMany({ where: { tenantId: id } });
        await prisma.tenantModule.createMany({
          data: planModules.map((pm) => ({ tenantId: id, moduleId: pm.moduleId })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json(updatedTenant);
  } catch (error: any) {
    console.error("PATCH tenant error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete Tenant permanently
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete child rows without onDelete: Cascade or that might fail due to database order
    // 1. Attendance: linked to user/employee of tenant
    await prisma.attendance.deleteMany({
      where: {
        OR: [
          { user: { tenantId: id } },
          { employee: { tenantId: id } }
        ]
      }
    });

    // 2. StockMovement: linked to product of tenant
    await prisma.stockMovement.deleteMany({
      where: {
        product: { tenantId: id }
      }
    });

    // 3. PurchaseItem: linked to purchase of tenant
    await prisma.purchaseItem.deleteMany({
      where: {
        purchase: { tenantId: id }
      }
    });

    // 4. OrderItem: linked to order of tenant
    await prisma.orderItem.deleteMany({
      where: {
        order: { tenantId: id }
      }
    });

    // 5. DealItem: linked to deal product or category of tenant
    await prisma.dealItem.deleteMany({
      where: {
        OR: [
          { deal: { tenantId: id } },
          { product: { tenantId: id } },
          { category: { tenantId: id } }
        ]
      }
    });

    // 6. RecipeIngredient: linked to tenant
    await prisma.recipeIngredient.deleteMany({
      where: { tenantId: id }
    });

    // 7. Finally delete the Tenant itself! (Cascades: User, Branch, Product, Category, Order, Customer, Supplier, Expense, Employee, Warehouse, Purchase, SupplierLedger, Subscription, TenantModule)
    await prisma.tenant.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Business deleted permanently" });
  } catch (error: any) {
    console.error("DELETE tenant error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
