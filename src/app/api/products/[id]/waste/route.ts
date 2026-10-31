import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";

export async function POST(
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
    const { quantity, reason } = body;
    const wasteQty = parseFloat(quantity) || 0;

    if (wasteQty <= 0) {
      return NextResponse.json({ error: "Quantity must be greater than zero." }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { id, tenantId }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // Decrement stock
      const updatedProduct = await tx.product.update({
        where: { id },
        data: { stock: { decrement: wasteQty } }
      });

      // Create Stock Movement log
      await tx.stockMovement.create({
        data: {
          type: "OUT",
          quantity: wasteQty,
          notes: `WASTED: ${reason || "Damaged/Expired"}`,
          productId: id
        }
      });

      return updatedProduct;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
