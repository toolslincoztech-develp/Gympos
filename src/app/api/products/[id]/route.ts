import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { invalidateTenantCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";

function getAuth(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = getAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const { name, price, costPrice, sku, barcode, description, stock, minStock, categoryId, image, sizes, formula, type, unit } = body;

    const hasSizes = sizes !== undefined && sizes !== null && sizes !== "" && !(Array.isArray(sizes) && sizes.length === 0);
    const parsedSizes = hasSizes ? (typeof sizes === "string" ? JSON.parse(sizes) : sizes) : null;

    let computedStock = stock;
    let computedPrice = price;

    if (sizes !== undefined) {
      if (parsedSizes && Array.isArray(parsedSizes)) {
        computedStock = parsedSizes.reduce((acc: number, s: any) => acc + (parseFloat(s.stock) || 0), 0);
        if (parsedSizes.length > 0) {
          computedPrice = parseFloat(parsedSizes[0].price) || 0;
        }
      }
    }

    const product = await prisma.product.update({
      where: { id, tenantId: decoded.tenantId },
      data: {
        ...(name !== undefined && { name }),
        ...(computedPrice !== undefined && { price: computedPrice === "" || computedPrice === null ? 0 : parseFloat(computedPrice) }),
        ...(costPrice !== undefined && { costPrice: costPrice === "" || costPrice === null ? 0 : parseFloat(costPrice) }),
        ...(sku !== undefined && { sku }),
        ...(barcode !== undefined && { barcode }),
        ...(description !== undefined && { description }),
        ...(computedStock !== undefined && { stock: computedStock === "" || computedStock === null ? 0 : parseFloat(computedStock) }),
        ...(minStock !== undefined && { minStock: minStock === "" || minStock === null ? 5 : parseFloat(minStock) }),
        ...(categoryId !== undefined && { categoryId }),
        ...(image !== undefined && { image }),
        ...(sizes !== undefined && { sizes: parsedSizes }),
        ...(formula !== undefined && { formula }),
        ...(type !== undefined && { type }),
        ...(unit !== undefined && { unit }),
      },
      include: { category: true },
    });

    invalidateTenantCache(decoded.tenantId);
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = getAuth(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const variants = await prisma.product.findMany({
      where: { parentId: id },
      select: { id: true },
    });
    const variantIds = variants.map((v) => v.id);
    const allIds = [id, ...variantIds];

    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { productId: { in: allIds } } }),
      prisma.stockMovement.deleteMany({ where: { productId: { in: allIds } } }),
      prisma.branchStock.deleteMany({ where: { productId: { in: allIds } } }),
      prisma.batch.deleteMany({ where: { productId: { in: allIds } } }),
      prisma.dealItem.deleteMany({ where: { productId: { in: allIds } } }),
      prisma.dealItem.deleteMany({ where: { dealId: { in: allIds } } }),
      prisma.product.deleteMany({ where: { parentId: id } }),
      prisma.product.delete({
        where: { id, tenantId: decoded.tenantId },
      }),
    ]);

    invalidateTenantCache(decoded.tenantId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
