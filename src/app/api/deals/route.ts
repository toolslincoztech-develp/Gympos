import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = requireTenantUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deals = await prisma.product.findMany({
      where: {
        tenantId: user.tenantId,
        type: "DEAL",
      },
      include: {
        dealItems: {
          include: {
            product: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(deals);
  } catch (error: any) {
    console.error("GET Deals Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = requireTenantUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, price, image, items } = body;

    if (!name) {
      return NextResponse.json({ error: "Deal name is required." }, { status: 400 });
    }
    if (price === undefined || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return NextResponse.json({ error: "A valid price is required." }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one product item is required for the deal." }, { status: 400 });
    }

    const deal = await prisma.$transaction(async (tx: any) => {
      // Create a Product record with type: "DEAL" and nested DealItem records
      const newProduct = await tx.product.create({
        data: {
          name,
          price: parseFloat(price),
          costPrice: 0,
          type: "DEAL",
          image: image || null,
          stock: 9999, // Large default stock since deals are constructed dynamically
          tenantId: user.tenantId,
          dealItems: {
            create: items.map((item: any) => ({
              productId: item.productId || null,
              categoryId: item.categoryId || null,
              sizeName: item.sizeName || null,
              quantity: parseInt(item.quantity) || 1,
            })),
          },
        },
        include: {
          dealItems: {
            include: {
              product: true,
              category: true,
            },
          },
        },
      });

      return newProduct;
    });

    return NextResponse.json(deal);
  } catch (error: any) {
    console.error("POST Deal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
