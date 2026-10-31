import { NextRequest, NextResponse } from "next/server";
import net from "net";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { 
      ip, 
      port, 
      orderId 
    } = await req.json();

    if (!ip) {
      return NextResponse.json({ error: "No printer IP configured." }, { status: 400 });
    }

    if (!orderId) {
      return NextResponse.json({ error: "No order ID provided." }, { status: 400 });
    }

    // Fetch complete order details with tenant, user, customer, table, and items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { name: true } }
          }
        },
        user: { select: { name: true } },
        customer: { select: { name: true, phone: true } },
        table: { select: { name: true } },
        tenant: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const printPort = parseInt(port) || 9100;

    // ESC/POS Command bytes
    const esc = "\x1b";
    const gs = "\x1d";
    const initialize = esc + "@";
    const boldOn = esc + "E\x01";
    const boldOff = esc + "E\x00";
    const fontLarge = gs + "!\x11"; // double height & width
    const fontNormal = gs + "!\x00";
    const alignCenter = esc + "a\x01";
    const alignLeft = esc + "a\x00";
    const alignRight = esc + "a\x02";
    const cut = gs + "V\x41\x03"; // feed and cut

    let data = "";
    data += initialize;

    // Header - Business Name
    data += alignCenter + fontLarge + boldOn + (order.tenant.name || "JOSAN FOODS").toUpperCase() + "\n" + fontNormal + boldOff;
    
    // Receipt Label
    data += boldOn + "RECEIPT\n" + boldOff;
    data += alignLeft;
    
    // Metadata block
    data += "Date: " + new Date(order.createdAt).toLocaleString() + "\n";
    data += "Order #: " + order.orderNumber + "\n";
    
    let formattedType = order.orderType;
    if (order.orderType === "DINE_IN") {
      formattedType = order.table?.name ? `Dine In (Table: ${order.table.name})` : "Dine In";
    } else if (order.orderType === "TAKEAWAY") {
      formattedType = "Take Away";
    } else if (order.orderType === "DELIVERY") {
      formattedType = "Delivery";
    }
    data += "Type: " + formattedType + "\n";
    data += "Payment: " + (order.paymentStatus === "PAID" ? "PAID" : "PENDING") + " (" + order.paymentMethod + ")\n";
    data += "Cashier: " + (order.user?.name || "System") + "\n";
    
    if (order.customer) {
      data += "Customer: " + order.customer.name + (order.customer.phone ? ` (${order.customer.phone})` : "") + "\n";
    }
    
    data += "--------------------------------\n";
    data += boldOn + "Item            Qty       Total\n" + boldOff;
    data += "--------------------------------\n";

    // Loop through order items
    order.items.forEach(item => {
      const name = item.notes ? `${item.product?.name} (${item.notes})` : (item.product?.name || "Item");
      const qty = item.quantity.toString();
      const priceTotal = (item.price * item.quantity).toFixed(2);
      
      // Pad spaces to align columns for a 32-character receipt (or 40-character receipt)
      // Name: 16 chars, Qty: 6 chars, Total: 10 chars
      const namePart = name.substring(0, 15).padEnd(16, " ");
      const qtyPart = qty.padStart(4, " ").padEnd(6, " ");
      const totalPart = priceTotal.padStart(10, " ");
      
      data += namePart + qtyPart + totalPart + "\n";
      
      // Print full item name on next line if it was truncated
      if (name.length > 15) {
        data += "  " + name.substring(15) + "\n";
      }
    });

    data += "--------------------------------\n";

    // Totals Block
    const subtotal = (order.totalAmount - order.tax - (order.deliveryCharges || 0) + order.discount).toFixed(2);
    data += "Subtotal:".padEnd(20, " ") + subtotal.padStart(12, " ") + "\n";
    if (order.discount > 0) {
      data += "Discount:".padEnd(20, " ") + `-${order.discount.toFixed(2)}`.padStart(12, " ") + "\n";
    }
    if (order.tax > 0) {
      data += "Tax:".padEnd(20, " ") + order.tax.toFixed(2).padStart(12, " ") + "\n";
    }
    if (order.deliveryCharges > 0) {
      data += "Delivery:".padEnd(20, " ") + order.deliveryCharges.toFixed(2).padStart(12, " ") + "\n";
    }
    data += "--------------------------------\n";
    data += boldOn + "TOTAL:".padEnd(15, " ") + `PKR ${order.totalAmount.toFixed(2)}`.padStart(17, " ") + "\n" + boldOff;
    data += "--------------------------------\n";

    // Special Instructions
    if (order.specialInstructions) {
      data += boldOn + "Instructions:\n" + boldOff;
      data += order.specialInstructions + "\n";
      data += "--------------------------------\n";
    }

    // Business details & addresses at bottom
    data += alignCenter;
    if (order.tenant.receiptAddressString) {
      data += "Address: " + order.tenant.receiptAddressString + "\n";
    }
    if (order.tenant.receiptWhatsAppString) {
      data += "WhatsApp: " + order.tenant.receiptWhatsAppString + "\n";
    }
    if (order.tenant.ntn) {
      data += "NTN: " + order.tenant.ntn + "\n";
    }
    if (order.tenant.strn) {
      data += "STRN: " + order.tenant.strn + "\n";
    }

    // Payment channels
    if (
      order.tenant.receiptEasyPaisaString || 
      order.tenant.receiptJazzCashString || 
      order.tenant.receiptRaastString || 
      order.tenant.receiptBankString
    ) {
      data += "\nPayment Channels:\n";
      if (order.tenant.receiptEasyPaisaString) data += "EasyPaisa: " + order.tenant.receiptEasyPaisaString + "\n";
      if (order.tenant.receiptJazzCashString) data += "JazzCash: " + order.tenant.receiptJazzCashString + "\n";
      if (order.tenant.receiptRaastString) data += "Raast ID: " + order.tenant.receiptRaastString + "\n";
      if (order.tenant.receiptBankString) data += "Bank: " + order.tenant.receiptBankString + "\n";
    }

    data += "\n" + boldOn + "THANK YOU FOR YOUR VISIT\n" + boldOff;
    data += "Powered by Lincoz Tech\n\n\n\n\n";
    data += cut;

    // Send to printer via TCP socket
    const client = new net.Socket();
    const printPromise = new Promise<void>((resolve, reject) => {
      client.setTimeout(4000);
      client.connect(printPort, ip, () => {
        client.write(data, "ascii", () => {
          client.destroy();
          resolve();
        });
      });
      client.on("error", (err) => {
        client.destroy();
        reject(err);
      });
      client.on("timeout", () => {
        client.destroy();
        reject(new Error("Connection timeout"));
      });
    });

    await printPromise;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("TCP Cashier Print Error:", error);
    return NextResponse.json({ error: error.message || "Failed to connect to cashier printer" }, { status: 500 });
  }
}
