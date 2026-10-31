import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "licoz_pos_jwt_super_secret_2026_xK9mP3qR7vN2wL8";

function getAuth(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as any; } catch { return null; }
}

// Update own tenant business settings (Only for Tenant Admins)
export async function PATCH(req: NextRequest) {
  const decoded = getAuth(req);
  if (!decoded || !decoded.tenantId || decoded.role !== "TENANT_ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Only Tenant Admins can update business settings." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { 
      name,
      logoUrl,
      ntn, 
      strn, 
      cashTaxRate, 
      cardTaxRate,
      receiptWhatsAppString,
      receiptAddressString,
      receiptRaastString,
      receiptBankString,
      receiptEasyPaisaString,
      receiptJazzCashString,
      kitchenPrinterIp,
      kitchenPrinterPort,
      cashierPrinterIp,
      cashierPrinterPort
    } = body;

    const updated = await prisma.tenant.update({
      where: { id: decoded.tenantId },
      data: {
        name: name !== undefined ? name : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        ntn: ntn !== undefined ? ntn : undefined,
        strn: strn !== undefined ? strn : undefined,
        cashTaxRate: cashTaxRate !== undefined ? parseFloat(cashTaxRate) : undefined,
        cardTaxRate: cardTaxRate !== undefined ? parseFloat(cardTaxRate) : undefined,
        receiptWhatsAppString: receiptWhatsAppString !== undefined ? receiptWhatsAppString : undefined,
        receiptAddressString: receiptAddressString !== undefined ? receiptAddressString : undefined,
        receiptRaastString: receiptRaastString !== undefined ? receiptRaastString : undefined,
        receiptBankString: receiptBankString !== undefined ? receiptBankString : undefined,
        receiptEasyPaisaString: receiptEasyPaisaString !== undefined ? receiptEasyPaisaString : undefined,
        receiptJazzCashString: receiptJazzCashString !== undefined ? receiptJazzCashString : undefined,
        kitchenPrinterIp: kitchenPrinterIp !== undefined ? kitchenPrinterIp : undefined,
        kitchenPrinterPort: kitchenPrinterPort !== undefined ? parseInt(kitchenPrinterPort) || null : undefined,
        cashierPrinterIp: cashierPrinterIp !== undefined ? cashierPrinterIp : undefined,
        cashierPrinterPort: cashierPrinterPort !== undefined ? parseInt(cashierPrinterPort) || null : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
