import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = requireTenantUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, price, image, items } = body;

    // Verify ownership
    const existing = await prisma.product.findFirst({
      where: { id, tenantId: user.tenantId, type: "DEAL" },
    });

    if (!existing) {
      return NextResponse.json({ error: "Deal not found or unauthorized access." }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      // 1. Update the Product model
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(image !== undefined && { image }),
        },
      });

      // 2. If constituent items list is provided, refresh them
      if (items && Array.isArray(items)) {
        // Clear existing deal items
        await tx.dealItem.deleteMany({
          where: { dealId: id },
        });

        // Insert new ones
        if (items.length > 0) {
          await tx.dealItem.createMany({
            data: items.map((item: any) => ({
              dealId: id,
              productId: item.productId || null,
              categoryId: item.categoryId || null,
              sizeName: item.sizeName || null,
              quantity: parseInt(item.quantity) || 1,
            })),
          });
        }
      }

      // Fetch the updated deal with relations
      return await tx.product.findUnique({
        where: { id },
        include: {
          dealItems: {
            include: {
              product: true,
              category: true,
            },
          },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH Deal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = requireTenantUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.product.findFirst({
      where: { id, tenantId: user.tenantId, type: "DEAL" },
    });

    if (!existing) {
      return NextResponse.json({ error: "Deal not found or unauthorized access." }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Deal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
