import { NextRequest, NextResponse } from "next/server";
import net from "net";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { 
      ip, 
      port, 
      orderId, 
      orderNumber, 
      orderType, 
      tableName, 
      items: reqItems, 
      specialInstructions: reqSpecialInstructions 
    } = await req.json();

    if (!ip) {
      return NextResponse.json({ error: "No printer IP configured." }, { status: 400 });
    }

    let itemsToPrint: any[] = [];
    let number = orderNumber || "";
    let type = orderType || "";
    let tblName = tableName || "";
    let instructions = reqSpecialInstructions || "";
    let dbItemsRaw: any[] = [];

    if (orderId) {
      // Fetch order with only items not yet printed to kitchen
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            where: { printed: false },
            select: { id: true, quantity: true, product: { select: { name: true } }, notes: true }
          },
          table: { select: { name: true } }
        }
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
      }

      dbItemsRaw = order.items;
      itemsToPrint = order.items.map(it => ({
        name: it.product?.name || "Item",
        quantity: it.quantity,
        notes: it.notes
      }));
      number = order.orderNumber;
      type = order.orderType;
      tblName = order.table?.name || "";
      instructions = order.specialInstructions || "";
    } else if (reqItems && Array.isArray(reqItems)) {
      itemsToPrint = reqItems.map((it: any) => ({
        name: it.name,
        quantity: it.quantity,
        notes: it.instructions || it.notes
      }));
    } else {
      return NextResponse.json({ error: "No items to print." }, { status: 400 });
    }

    if (itemsToPrint.length === 0) {
      return NextResponse.json({ success: true, message: "No new items to print" });
    }

    const printPort = parseInt(port) || 9100;

    // Build ESC/POS command string
    const esc = "\x1b";
    const gs = "\x1d";
    const initialize = esc + "@";
    const boldOn = esc + "E\x01";
    const boldOff = esc + "E\x00";
    const fontLarge = gs + "!\x11"; // double height & width
    const fontNormal = gs + "!\x00";
    const alignCenter = esc + "a\x01";
    const alignLeft = esc + "a\x00";
    const cut = gs + "V\x41\x03"; // feed and cut

    let data = "";
    data += initialize;
    data += alignCenter + fontLarge + boldOn + "KITCHEN ORDER\n" + fontNormal + boldOff;
    
    let typeLabel = type;
    if (type === "DINE_IN") {
      typeLabel = tblName ? `Dine In - Table: ${tblName}` : "Dine In";
    } else if (type === "TAKEAWAY") {
      typeLabel = "Take Away";
    } else if (type === "DELIVERY") {
      typeLabel = "Delivery";
    }
    data += fontNormal + typeLabel + "\n";
    data += "--------------------------------\n";
    data += boldOn + "Order #: " + number + "\n" + boldOff;
    data += "Date: " + new Date().toLocaleString() + "\n";
    if (instructions) {
      data += boldOn + "Instructions: " + instructions + "\n" + boldOff;
    }
    data += "--------------------------------\n" + alignLeft;

    for (const item of itemsToPrint) {
      data += boldOn + item.quantity + " x " + item.name + boldOff + "\n";
      if (item.notes) {
        data += "   * " + item.notes + "\n";
      }
      data += "\n";
    }
    data += "--------------------------------\n\n\n\n\n";
    data += cut;

    // Send to printer via TCP
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

    // Mark items as printed in DB if we fetched from DB
    if (orderId && dbItemsRaw.length > 0) {
      await prisma.orderItem.updateMany({
        where: { id: { in: dbItemsRaw.map((i: any) => i.id) } },
        data: { printed: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("TCP Kitchen Print Error:", error);
    return NextResponse.json({ error: error.message || "Failed to connect to printer" }, { status: 500 });
  }
}
