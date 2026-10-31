import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";
import { invalidateTenantCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = requireTenantUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const purchases = await prisma.purchase.findMany({
      where: { tenantId: user.tenantId },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(purchases);
  } catch (error: any) {
    console.error("GET Purchases Error:", error);
    return NextResponse.json({ error: "Failed to load purchases" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = requireTenantUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { supplierId, invoiceNo, items } = await req.json();

    if (!supplierId) {
      return NextResponse.json({ error: "Supplier is required" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one purchase item is required" }, { status: 400 });
    }

    // Calculate total amount
    const totalAmount = items.reduce((acc: number, item: any) => {
      return acc + (parseFloat(item.costPrice || 0) * parseFloat(item.quantity || 0));
    }, 0);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Purchase
      const purchase = await tx.purchase.create({
        data: {
          supplierId,
          invoiceNo,
          totalAmount,
          tenantId: user.tenantId,
        },
      });

      // 2. Create Purchase Items and update stocks & batches
      for (const item of items) {
        const qty = parseFloat(item.quantity || 0);
        const cost = parseFloat(item.costPrice || 0);
        const exp = item.expiryDate ? new Date(item.expiryDate) : null;

        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            productId: item.productId,
            quantity: qty,
            costPrice: cost,
            batchNumber: item.batchNumber || null,
            expiryDate: exp,
          },
        });

        // 3. Update Product Stock and Cost Price
        await tx.product.update({
          where: { id: item.productId, tenantId: user.tenantId },
          data: {
            stock: { increment: qty },
            costPrice: cost,
          },
        });

        // 4. Create Stock Movement
        await tx.stockMovement.create({
          data: {
            type: "IN",
            quantity: qty,
            notes: `Purchase Supply Invoice ${invoiceNo || "N/A"}`,
            productId: item.productId,
          },
        });

        // 5. Manage Batch
        if (item.batchNumber) {
          // Check if batch already exists for this product
          const existingBatch = await tx.batch.findFirst({
            where: {
              productId: item.productId,
              batchNumber: item.batchNumber,
            },
          });

          if (existingBatch) {
            await tx.batch.update({
              where: { id: existingBatch.id },
              data: {
                quantity: { increment: qty },
                expiryDate: exp,
              },
            });
          } else {
            await tx.batch.create({
              data: {
                batchNumber: item.batchNumber,
                expiryDate: exp,
                productId: item.productId,
                quantity: qty,
              },
            });
          }
        }
      }

      // 6. Create Supplier Ledger Entry (Credit/Purchase Amount)
      await tx.supplierLedger.create({
        data: {
          supplierId,
          amount: totalAmount, // credit balance (company owes supplier)
          type: "PURCHASE",
          description: `Purchase Inward Supply Invoice ${invoiceNo || "N/A"}`,
          tenantId: user.tenantId,
        },
      });

      return purchase;
    });

    invalidateTenantCache(user.tenantId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST Purchase Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
