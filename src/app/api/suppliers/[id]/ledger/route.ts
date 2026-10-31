import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireTenantUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const ledger = await prisma.supplierLedger.findMany({
      where: {
        supplierId: id,
        tenantId: user.tenantId,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(ledger);
  } catch (error: any) {
    console.error("GET Supplier Ledger Error:", error);
    return NextResponse.json({ error: "Failed to load ledger history" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireTenantUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const { amount, description } = await req.json();
    const payAmt = parseFloat(amount);

    if (!payAmt || payAmt <= 0) {
      return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 });
    }

    const ledgerEntry = await prisma.supplierLedger.create({
      data: {
        supplierId: id,
        amount: -payAmt, // Negative amount representing a payment/debit that reduces our debt
        type: "PAYMENT",
        description: description || "Payment made to supplier",
        tenantId: user.tenantId,
      },
    });

    return NextResponse.json(ledgerEntry);
  } catch (error: any) {
    console.error("POST Supplier Payment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
