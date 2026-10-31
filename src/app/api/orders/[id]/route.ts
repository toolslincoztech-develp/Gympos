import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { invalidateTenantCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function incrementVariantStock(tx: any, productId: string, variantName: string, qtyToAdd: number) {
  const prod = await tx.product.findUnique({
    where: { id: productId }
  });
  if (!prod) return;

  if (prod.sizes) {
    let sizesList = typeof prod.sizes === "string" ? JSON.parse(prod.sizes) : prod.sizes;
    if (Array.isArray(sizesList)) {
      let found = false;
      const updatedSizes = sizesList.map((sz: any) => {
        if (sz.sizeName === variantName) {
          found = true;
          const currentStock = parseInt(sz.stock || "0");
          return { ...sz, stock: String(currentStock + qtyToAdd) };
        }
        return sz;
      });

      if (found) {
        await tx.product.update({
          where: { id: productId },
          data: { 
            sizes: updatedSizes,
            stock: { increment: qtyToAdd }
          }
        });
        return;
      }
    }
  }

  await tx.product.update({
    where: { id: productId },
    data: { stock: { increment: qtyToAdd } }
  });
}

async function decrementVariantStock(tx: any, productId: string, variantName: string, qtyToDeduct: number) {
  const prod = await tx.product.findUnique({
    where: { id: productId }
  });
  if (!prod) return;

  if (prod.sizes) {
    let sizesList = typeof prod.sizes === "string" ? JSON.parse(prod.sizes) : prod.sizes;
    if (Array.isArray(sizesList)) {
      let found = false;
      const updatedSizes = sizesList.map((sz: any) => {
        if (sz.sizeName === variantName) {
          found = true;
          const currentStock = parseInt(sz.stock || "0");
          return { ...sz, stock: String(Math.max(0, currentStock - qtyToDeduct)) };
        }
        return sz;
      });

      if (found) {
        await tx.product.update({
          where: { id: productId },
          data: { 
            sizes: updatedSizes,
            stock: { decrement: qtyToDeduct }
          }
        });
        return;
      }
    }
  }

  await tx.product.update({
    where: { id: productId },
    data: { stock: { decrement: qtyToDeduct } }
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { tenantId } = decoded;

    const body = await req.json();
    const { status, items, totalAmount, discount, tax, deliveryCharges, specialInstructions, paymentMethod, orderType, tableId, riderName, notes } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { table: true, items: true }
    });

    if (!order || order.tenantId !== tenantId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "COMPLETED" && status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot cancel a completed order" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. If we are updating order items/details
      if (items) {
        // Restore stock for old items
        for (const oldItem of order.items) {
          const prod = await tx.product.findUnique({
            where: { id: oldItem.productId },
            include: { dealItems: { include: { product: true } } }
          });
          if (prod && prod.type === "DEAL") {
            // Restore constituent items stock
            for (const di of prod.dealItems) {
              let actualProductId = di.productId;
              let variantName = "";

              if (!actualProductId && di.categoryId) {
                const catProds = await tx.product.findMany({
                  where: { categoryId: di.categoryId }
                });
                for (const p of catProds) {
                  const regex = new RegExp(`${escapeRegExp(p.name)}\\s*\\(([^)]+)\\)`, "i");
                  const match = oldItem.notes?.match(regex);
                  if (match) {
                    actualProductId = p.id;
                    variantName = match[1].trim();
                    break;
                  }
                }
              } else {
                if (oldItem.notes && di.product) {
                  const regex = new RegExp(`${escapeRegExp(di.product.name)}\\s*\\(([^)]+)\\)`, "i");
                  const match = oldItem.notes.match(regex);
                  if (match) {
                    variantName = match[1].trim();
                  }
                }
              }

              if (actualProductId) {
                if (variantName) {
                  await incrementVariantStock(tx, actualProductId, variantName, di.quantity * oldItem.quantity);
                } else {
                  await tx.product.update({
                    where: { id: actualProductId },
                    data: { stock: { increment: di.quantity * oldItem.quantity } }
                  });
                }
              }
            }
          } else {
            // Standard item
            if (oldItem.notes) {
              await incrementVariantStock(tx, oldItem.productId, oldItem.notes, oldItem.quantity);
            } else {
              await tx.product.update({
                where: { id: oldItem.productId },
                data: { stock: { increment: oldItem.quantity } }
              });
            }
          }
        }

        // Delete old order items
        await tx.orderItem.deleteMany({ where: { orderId: id } });

        // Create new order items & deduct stock
        for (const newItem of items) {
          const prod = await tx.product.findUnique({
            where: { id: newItem.productId },
            include: { dealItems: { include: { product: true } } }
          });
          if (prod && prod.type === "DEAL") {
            // Deduct constituent items stock
            for (const di of prod.dealItems) {
              let actualProductId = di.productId;
              let variantName = "";

              if (!actualProductId && di.categoryId) {
                const catProds = await tx.product.findMany({
                  where: { categoryId: di.categoryId }
                });
                for (const p of catProds) {
                  const regex = new RegExp(`${escapeRegExp(p.name)}\\s*\\(([^)]+)\\)`, "i");
                  const match = newItem.notes?.match(regex);
                  if (match) {
                    actualProductId = p.id;
                    variantName = match[1].trim();
                    break;
                  }
                }
              } else {
                if (newItem.notes && di.product) {
                  const regex = new RegExp(`${escapeRegExp(di.product.name)}\\s*\\(([^)]+)\\)`, "i");
                  const match = newItem.notes.match(regex);
                  if (match) {
                    variantName = match[1].trim();
                  }
                }
              }

              if (actualProductId) {
                if (variantName) {
                  await decrementVariantStock(tx, actualProductId, variantName, di.quantity * newItem.quantity);
                } else {
                  await tx.product.update({
                    where: { id: actualProductId },
                    data: { stock: { decrement: di.quantity * newItem.quantity } }
                  });
                }
              }
            }
          } else {
            // Standard item
            if (newItem.notes) {
              await decrementVariantStock(tx, newItem.productId, newItem.notes, newItem.quantity);
            } else {
              await tx.product.update({
                where: { id: newItem.productId },
                data: { stock: { decrement: newItem.quantity } }
              });
            }
          }
        }

        // Create new OrderItem records
        await tx.orderItem.createMany({
          data: items.map((newItem: any) => ({
            orderId: id,
            productId: newItem.productId,
            quantity: newItem.quantity,
            price: parseFloat(newItem.price) || 0,
            notes: newItem.notes || null
          }))
        });
      }

      // 2. Free up old table if table changed
      if (tableId !== undefined && order.tableId && order.tableId !== tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: "AVAILABLE", isFree: true }
        });
      }

      // 3. Mark target table status based on order status
      const targetTableId = tableId !== undefined ? (tableId === "none" ? null : tableId) : order.tableId;
      if (targetTableId) {
        const orderFinalStatus = status !== undefined ? status : order.status;
        const tableStatus = (orderFinalStatus === "COMPLETED" || orderFinalStatus === "CANCELLED") ? "AVAILABLE" : "OCCUPIED";
        await tx.table.update({
          where: { id: targetTableId },
          data: { status: tableStatus, isFree: tableStatus === "AVAILABLE" }
        });
      }

      // 4. Update order data
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          ...(status !== undefined && { status }),
          ...(body.paymentStatus !== undefined && { paymentStatus: body.paymentStatus }),
          ...(totalAmount !== undefined && { totalAmount: parseFloat(totalAmount) }),
          ...(discount !== undefined && { discount: parseFloat(discount) }),
          ...(tax !== undefined && { tax: parseFloat(tax) }),
          ...(deliveryCharges !== undefined && { deliveryCharges: parseFloat(deliveryCharges) }),
          ...(specialInstructions !== undefined && { specialInstructions }),
          ...(paymentMethod !== undefined && { paymentMethod }),
          ...(orderType !== undefined && { orderType }),
          ...(tableId !== undefined && { tableId: tableId === "none" ? null : tableId }),
          ...(riderName !== undefined && { riderName }),
          ...(notes !== undefined && { notes }),
        },
      });

      // 5. If cancelled/voided, free up the table and restore stock (if not already handled by items check)
      if (status === "CANCELLED") {
        if (updatedOrder.tableId) {
          await tx.table.update({
            where: { id: updatedOrder.tableId },
            data: { status: "AVAILABLE", isFree: true }
          });
        }

        // Restore stock of current items
        const currentItems = await tx.orderItem.findMany({ where: { orderId: id } });
        for (const item of currentItems) {
          const prod = await tx.product.findUnique({
            where: { id: item.productId },
            include: { dealItems: { include: { product: true } } }
          });
          if (prod && prod.type === "DEAL") {
            for (const di of prod.dealItems) {
              let actualProductId = di.productId;
              let variantName = "";

              if (!actualProductId && di.categoryId) {
                const catProds = await tx.product.findMany({
                  where: { categoryId: di.categoryId }
                });
                for (const p of catProds) {
                  const regex = new RegExp(`${escapeRegExp(p.name)}\\s*\\(([^)]+)\\)`, "i");
                  const match = item.notes?.match(regex);
                  if (match) {
                    actualProductId = p.id;
                    variantName = match[1].trim();
                    break;
                  }
                }
              } else {
                if (item.notes && di.product) {
                  const regex = new RegExp(`${escapeRegExp(di.product.name)}\\s*\\(([^)]+)\\)`, "i");
                  const match = item.notes.match(regex);
                  if (match) {
                    variantName = match[1].trim();
                  }
                }
              }

              if (actualProductId) {
                if (variantName) {
                  await incrementVariantStock(tx, actualProductId, variantName, di.quantity * item.quantity);
                } else {
                  await tx.product.update({
                    where: { id: actualProductId },
                    data: { stock: { increment: di.quantity * item.quantity } }
                  });
                }
              }
            }
          } else {
            if (item.notes) {
              await incrementVariantStock(tx, item.productId, item.notes, item.quantity);
            } else {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } }
              });
            }
          }
        }
      }

      return updatedOrder;
    });

    invalidateTenantCache(tenantId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { tenantId, role } = decoded;

    if (role === "CASHIER") {
      return NextResponse.json({ error: "Cashiers are not authorized to delete orders. Please contact an admin." }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order || order.tenantId !== tenantId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx: any) => {
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: "AVAILABLE", isFree: true }
        });
      }

      await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
    });

    invalidateTenantCache(tenantId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
