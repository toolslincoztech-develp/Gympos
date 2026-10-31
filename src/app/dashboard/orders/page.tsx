"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Eye,
  ShoppingBag,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Printer,
  AlertTriangle,
  Loader2,
  Calendar,
  Download,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100",
  PENDING: "bg-amber-50 text-amber-600 border-amber-100",
  CANCELLED: "bg-rose-50 text-rose-600 border-rose-100",
  PREPARING: "bg-blue-50 text-blue-600 border-blue-100",
  READY: "bg-indigo-50 text-indigo-600 border-indigo-100",
};

const paymentIcons: Record<string, React.ReactNode> = {
  CASH: <Banknote className="w-4 h-4" />,
  CARD: <CreditCard className="w-4 h-4" />,
  UPI: <CreditCard className="w-4 h-4" />,
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const limit = 15;
  const receiptRef = React.useRef<HTMLDivElement>(null);

  // EOD states
  const [eodModalOpen, setEodModalOpen] = useState(false);
  const [eodLoading, setEodLoading] = useState(false);
  const [eodStats, setEodStats] = useState<any>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showClosed, setShowClosed] = useState<string>("all");

  // EOD History Filter states
  const [eodReportPeriod, setEodReportPeriod] = useState<"active" | "daily" | "weekly" | "monthly">("active");
  const eodViewMode = eodReportPeriod === "active" ? "active" : "closed";
  const [eodDateFilter, setEodDateFilter] = useState<string>(new Date().toISOString().split("T")[0]);
  const [eodWeekDateFilter, setEodWeekDateFilter] = useState<string>(new Date().toISOString().split("T")[0]);
  const [eodMonthFilter, setEodMonthFilter] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const getWeekRange = (dateString: string) => {
    if (!dateString) return { start: "", end: "", label: "" };
    const date = new Date(dateString);
    const day = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diffToMonday));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    return {
      start: formatDate(monday),
      end: formatDate(sunday),
      label: `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - ${sunday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    };
  };

  useEffect(() => {
    axios.get("/api/auth/me")
      .then((res) => setCurrentUser(res.data))
      .catch(() => {});
  }, []);

  const loadEodStats = async () => {
    setEodLoading(true);
    try {
      const params: any = {};
      if (eodReportPeriod !== "active") {
        params.closed = "true";
        if (eodReportPeriod === "daily" && eodDateFilter) {
          params.date = eodDateFilter;
        } else if (eodReportPeriod === "weekly" && eodWeekDateFilter) {
          const week = getWeekRange(eodWeekDateFilter);
          params.startDate = week.start;
          params.endDate = week.end;
        } else if (eodReportPeriod === "monthly" && eodMonthFilter !== "ALL") {
          params.month = eodMonthFilter;
        }
      }
      const res = await axios.get("/api/orders/reset", { params });
      setEodStats(res.data);
      setDownloaded(false);
      setConfirmed(false);
    } catch {
      toast.error("Failed to load closing report data");
    } finally {
      setEodLoading(false);
    }
  };

  useEffect(() => {
    if (eodModalOpen) {
      loadEodStats();
    }
  }, [eodModalOpen, eodReportPeriod, eodDateFilter, eodWeekDateFilter, eodMonthFilter]);

  // Export Daily Closing Report
  const handleExportEod = () => {
    if (!eodStats) return;
    try {
      const dateStr = new Date().toLocaleDateString();
      const timeStr = new Date().toLocaleTimeString();

      let title = "DAILY CLOSING REPORT";
      let dateLabel = "Date";
      let dateValue = `${dateStr} ${timeStr}`;
      let filename = `daily-closing-report-${new Date().toISOString().split("T")[0]}.csv`;

      if (eodReportPeriod !== "active") {
        if (eodReportPeriod === "daily") {
          title = "DAILY CLOSING REPORT (ARCHIVED)";
          dateLabel = "Closing Date";
          dateValue = eodDateFilter;
          filename = `archived-daily-report-${eodDateFilter}.csv`;
        } else if (eodReportPeriod === "weekly") {
          title = "WEEKLY CLOSING REPORT (ARCHIVED)";
          dateLabel = "Closing Week";
          const week = getWeekRange(eodWeekDateFilter);
          dateValue = week.label;
          filename = `archived-weekly-report-${week.start}-to-${week.end}.csv`;
        } else {
          title = "MONTHLY CLOSING REPORT (ARCHIVED)";
          dateLabel = "Closing Month";
          const list = getMonthsList();
          const match = list.find(m => m.value === eodMonthFilter);
          dateValue = match ? match.label : eodMonthFilter;
          filename = `archived-monthly-report-${eodMonthFilter}.csv`;
        }
      }

      let csv = `${title}\n`;
      csv += `${dateLabel},${dateValue}\n`;
      csv += `Tenant,"${eodStats.tenant?.name || "N/A"}"\n`;
      csv += `Address,"${eodStats.tenant?.address || ""}"\n`;
      csv += `Phone,"${eodStats.tenant?.phone || ""}"\n`;
      if (eodStats.tenant?.ntn) csv += `NTN,${eodStats.tenant.ntn}\n`;
      if (eodStats.tenant?.strn) csv += `STRN,${eodStats.tenant.strn}\n`;
      csv += `\n`;

      csv += `SUMMARY METRICS\n`;
      csv += `Metric,Value\n`;
      csv += `Total Orders,${eodStats.totalOrders}\n`;
      csv += `Gross Revenue,PKR ${eodStats.totalRevenue.toFixed(2)}\n`;
      csv += `Total Discounts,PKR ${eodStats.totalDiscount.toFixed(2)}\n`;
      csv += `Total Taxes,PKR ${eodStats.totalTax.toFixed(2)}\n`;
      csv += `Net Sales,PKR ${eodStats.netSales.toFixed(2)}\n`;
      csv += `\n`;

      csv += `PAYMENT METHODS BREAKDOWN\n`;
      csv += `Method,Orders Count,Total Amount\n`;
      eodStats.paymentMethods.forEach((pm: any) => {
        csv += `${pm.name},${pm.count},PKR ${pm.total.toFixed(2)}\n`;
      });
      csv += `\n`;

      csv += `ORDER TYPES BREAKDOWN\n`;
      csv += `Type,Orders Count,Total Amount\n`;
      eodStats.orderTypes.forEach((ot: any) => {
        csv += `${ot.name},${ot.count},PKR ${ot.total.toFixed(2)}\n`;
      });
      csv += `\n`;

      csv += `CASHIER PERFORMANCE\n`;
      csv += `Cashier Name,Orders Count,Total Sales\n`;
      eodStats.cashiers.forEach((c: any) => {
        csv += `"${c.name}",${c.count},PKR ${c.total.toFixed(2)}\n`;
      });
      csv += `\n`;

      csv += `PRODUCT SALES SUMMARY\n`;
      csv += `Product Name,Quantity Sold,Total Revenue\n`;
      eodStats.products.forEach((p: any) => {
        csv += `"${p.name}",${p.quantity},PKR ${p.total.toFixed(2)}\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloaded(true);
      toast.success("Closing report saved successfully");
    } catch {
      toast.error("Failed to export closing report");
    }
  };

  // Print Daily Closing Report
  const handlePrintEod = () => {
    if (!eodStats) return;
    setDownloaded(true);
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Popup blocked! Please allow popups to print.");
      return;
    }

    const tenantName = eodStats.tenant?.name || "Cheesy Bite";
    const timeStr = new Date().toLocaleTimeString();

    let title = "Daily Closing Summary";
    let dateLabel = "Closing Date";
    let dateValue = new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (eodReportPeriod !== "active") {
      if (eodReportPeriod === "daily") {
        title = "Daily Closing Summary (Archived)";
        dateLabel = "Closing Date";
        const parsedDate = new Date(eodDateFilter);
        dateValue = isNaN(parsedDate.getTime()) ? eodDateFilter : parsedDate.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      } else if (eodReportPeriod === "weekly") {
        title = "Weekly Closing Summary (Archived)";
        dateLabel = "Closing Week";
        const week = getWeekRange(eodWeekDateFilter);
        dateValue = week.label;
      } else {
        title = "Monthly Closing Summary (Archived)";
        dateLabel = "Closing Month";
        const list = getMonthsList();
        const match = list.find(m => m.value === eodMonthFilter);
        dateValue = match ? match.label : eodMonthFilter;
      }
    }

    win.document.write(`
      <html>
      <head>
        <title>${title} - ${tenantName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 15mm 10mm 15mm;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #1e293b;
            font-size: 11px;
            line-height: 1.4;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .header {
            border-bottom: 2px solid #2563eb;
            padding-bottom: 6px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .header-title {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .tenant-info {
            font-size: 9.5px;
            color: #475569;
            text-align: right;
            line-height: 1.3;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 10px;
            font-size: 9.5px;
            background-color: #f8fafc;
            padding: 6px 10px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
            margin-bottom: 10px;
          }
          .metric-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 4px 6px;
            border-radius: 6px;
            text-align: center;
          }
          .metric-card.net-sales {
            background-color: #eff6ff;
            border-color: #bfdbfe;
          }
          .metric-label {
            font-size: 7.5px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 750;
            letter-spacing: 0.5px;
          }
          .metric-value {
            font-size: 11.5px;
            font-weight: 850;
            color: #0f172a;
            margin-top: 1px;
          }
          .metric-card.net-sales .metric-value {
            color: #2563eb;
          }
          .section-title {
            font-size: 10px;
            font-weight: 750;
            color: #0f172a;
            border-bottom: 1.5px solid #cbd5e1;
            padding-bottom: 2px;
            margin-top: 8px;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .tables-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5px;
          }
          th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 700;
            text-align: left;
            padding: 3px 5px;
            border-bottom: 1px solid #cbd5e1;
          }
          td {
            padding: 3px 5px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
            font-weight: 600;
          }
          .text-right {
            text-align: right;
          }
          .footer-note {
            text-align: center;
            font-size: 8px;
            color: #94a3b8;
            margin-top: 15px;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
          }
          .product-summary-container {
            margin-top: 8px;
          }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="header">
          <h1 class="header-title">${title}</h1>
          <div class="tenant-info">
            <strong>${tenantName}</strong><br/>
            ${eodStats.tenant?.address ? `${eodStats.tenant.address}` : ""}${eodStats.tenant?.phone ? ` | Ph: ${eodStats.tenant.phone}` : ""}<br/>
            ${eodStats.tenant?.ntn ? `NTN: ${eodStats.tenant.ntn}` : ""}${eodStats.tenant?.strn ? ` | STRN: ${eodStats.tenant.strn}` : ""}
          </div>
        </div>

        <div class="meta-grid">
          <div><strong>${dateLabel}:</strong> ${dateValue}</div>
          <div class="text-right"><strong>Generated:</strong> ${timeStr}</div>
        </div>

        <div class="section-title">Summary Metrics</div>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total Orders</div>
            <div class="metric-value">${eodStats.totalOrders}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Gross Revenue</div>
            <div class="metric-value">PKR ${eodStats.totalRevenue.toFixed(0)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Discounts</div>
            <div class="metric-value">PKR ${eodStats.totalDiscount.toFixed(0)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Taxes</div>
            <div class="metric-value">PKR ${eodStats.totalTax.toFixed(0)}</div>
          </div>
          <div class="metric-card net-sales">
            <div class="metric-label">Net Sales</div>
            <div class="metric-value">PKR ${eodStats.netSales.toFixed(0)}</div>
          </div>
        </div>

        <div class="tables-grid">
          <div>
            <div class="section-title">Payment Methods</div>
            <table>
              <thead>
                <tr>
                  <th>Method</th>
                  <th class="text-right">Orders</th>
                  <th class="text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                ${eodStats.paymentMethods.map((pm: any) => `
                  <tr>
                    <td>${pm.name}</td>
                    <td class="text-right">${pm.count}</td>
                    <td class="text-right">PKR ${pm.total.toFixed(2)}</td>
                  </tr>
                `).join("")}
                ${eodStats.paymentMethods.length === 0 ? '<tr><td colspan="3" style="text-align:center; color:#94a3b8; font-style:italic;">No payments recorded</td></tr>' : ''}
              </tbody>
            </table>

            <div class="section-title" style="margin-top: 8px;">Order Types</div>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th class="text-right">Orders</th>
                  <th class="text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                ${eodStats.orderTypes.map((ot: any) => `
                  <tr>
                    <td>${ot.name}</td>
                    <td class="text-right">${ot.count}</td>
                    <td class="text-right">PKR ${ot.total.toFixed(2)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div>
            <div class="section-title">Cashier Performance</div>
            <table>
              <thead>
                <tr>
                  <th>Cashier</th>
                  <th class="text-right">Orders</th>
                  <th class="text-right">Total Sales</th>
                </tr>
              </thead>
              <tbody>
                ${eodStats.cashiers.map((c: any) => `
                  <tr>
                    <td>${c.name}</td>
                    <td class="text-right">${c.count}</td>
                    <td class="text-right">PKR ${c.total.toFixed(2)}</td>
                  </tr>
                `).join("")}
                ${eodStats.cashiers.length === 0 ? '<tr><td colspan="3" style="text-align:center; color:#94a3b8; font-style:italic;">No cashier activity</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>

        <div class="product-summary-container">
          <div class="section-title">Sold Products Summary</div>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th class="text-right" style="width: 100px;">Quantity Sold</th>
                <th class="text-right" style="width: 150px;">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${eodStats.products.map((p: any) => `
                <tr>
                  <td>${p.name}</td>
                  <td class="text-right">${p.quantity}</td>
                  <td class="text-right">PKR ${p.total.toFixed(2)}</td>
                </tr>
              `).join("")}
              ${eodStats.products.length === 0 ? '<tr><td colspan="3" style="text-align:center; color:#94a3b8; font-style:italic;">No products sold</td></tr>' : ''}
            </tbody>
          </table>
        </div>

        <div class="footer-note">
          This report is a permanent business record. Daily Closing archives active database logs to start the next business day fresh.<br/>
          <strong>Lincoz POS System</strong> - Powered by Lincoz Tech
        </div>
      </body>
      </html>
    `);
    win.document.close();
  };

  // Perform daily reset (POST)
  const handleResetDay = async () => {
    if (!confirmed) return;
    setResetting(true);
    try {
      const res = await axios.post("/api/orders/reset");
      toast.success(`Daily closing complete! Reset ${res.data.deletedCount} orders.`);
      setEodModalOpen(false);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to reset daily sales");
    } finally {
      setResetting(false);
    }
  };

  const handlePrint = () => {
    if (!selectedOrder) return;
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Popup blocked! Please allow popups to print.");
      return;
    }
    const businessName = selectedOrder.tenant?.name || "Cheesy Bite";
    const addressHtml = selectedOrder.tenant?.receiptAddressString
      ? `<div style="margin-bottom: 2px;">Address: ${selectedOrder.tenant.receiptAddressString}</div>`
      : "";
    const whatsAppHtml = selectedOrder.tenant?.receiptWhatsAppString
      ? `<div style="margin-bottom: 4px;">WhatsApp: ${selectedOrder.tenant.receiptWhatsAppString}</div>`
      : "";
    const ntnHtml = selectedOrder.tenant?.ntn ? `<div style="font-size: 9px;">NTN: ${selectedOrder.tenant.ntn}</div>` : "";
    const strnHtml = selectedOrder.tenant?.strn ? `<div style="font-size: 9px;">STRN: ${selectedOrder.tenant.strn}</div>` : "";
    
    let paymentChannelsHtml = "";
    if (
      selectedOrder.tenant?.receiptEasyPaisaString ||
      selectedOrder.tenant?.receiptJazzCashString ||
      selectedOrder.tenant?.receiptRaastString ||
      selectedOrder.tenant?.receiptBankString
    ) {
      paymentChannelsHtml = `
        <div style="border-top: 1px dashed #000000; margin-top: 6px; padding-top: 4px;">
          <div style="font-weight: bold; text-transform: uppercase; margin-bottom: 3px;">Payment Channels:</div>
          ${selectedOrder.tenant.receiptEasyPaisaString ? `<div>EasyPaisa: ${selectedOrder.tenant.receiptEasyPaisaString}</div>` : ""}
          ${selectedOrder.tenant.receiptJazzCashString ? `<div>JazzCash: ${selectedOrder.tenant.receiptJazzCashString}</div>` : ""}
          ${selectedOrder.tenant.receiptRaastString ? `<div>Raast ID: ${selectedOrder.tenant.receiptRaastString}</div>` : ""}
          ${selectedOrder.tenant.receiptBankString ? `<div>Bank: ${selectedOrder.tenant.receiptBankString}</div>` : ""}
        </div>
      `;
    }

    const itemsHtml = (selectedOrder.items || []).map((item: any) => {
      const prodName = item.product?.name || "Product";
      const notesPart = item.notes ? ` (${item.notes})` : "";
      const fullName = prodName + notesPart;
      const qty = item.quantity;
      const totalStr = (item.price * qty).toFixed(2);
      return `
        <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: bold;">
          <span style="width: 50%; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${fullName}</span>
          <span style="width: 25%; text-align: center;">${qty}</span>
          <span style="width: 25%; text-align: right;">${totalStr}</span>
        </div>
      `;
    }).join("");

    const subtotal = (selectedOrder.totalAmount - selectedOrder.tax - (selectedOrder.deliveryCharges || 0) + selectedOrder.discount).toFixed(2);
    const discountHtml = selectedOrder.discount > 0
      ? `<div style="display: flex; justify-content: space-between; font-weight: bold;"><span>Discount:</span><span>-${selectedOrder.discount.toFixed(2)}</span></div>`
      : "";
    const deliveryHtml = (selectedOrder.deliveryCharges || 0) > 0
      ? `<div style="display: flex; justify-content: space-between;"><span>Delivery Charges:</span><span>${selectedOrder.deliveryCharges.toFixed(2)}</span></div>`
      : "";

    const tableHtml = (selectedOrder.orderType === "DINE_IN" && selectedOrder.table?.name)
      ? `<div style="border-top: 1px dashed #000000; padding-top: 6px; font-size: 11px; font-weight: bold; text-align: center; margin-bottom: 8px;">TABLE: ${selectedOrder.table.name}</div>`
      : "";

    const specialInstructionsHtml = selectedOrder.specialInstructions
      ? `<div style="border-top: 1px dashed #000000; margin: 8px 0;"></div>
         <div style="font-size: 10px; font-weight: bold; text-align: left;">
           SPECIAL INSTRUCTION:<br/>
           <span style="font-size: 11px;">${selectedOrder.specialInstructions}</span>
         </div>`
      : "";

    let deliveryTakeawayHtml = "";
    if (selectedOrder.orderType === "DELIVERY" && selectedOrder.notes) {
      const notesLines = selectedOrder.notes.split("\n").map((line: string) => `<div style="font-weight: bold; line-height: 1.3;">${line}</div>`).join("");
      const riderHtml = selectedOrder.riderName ? `<div style="margin-top: 4px; font-weight: bold; color: #333333;">Rider: ${selectedOrder.riderName}</div>` : "";
      deliveryTakeawayHtml = `
        <div style="border-top: 1px dashed #000000; padding-top: 6px; font-size: 10px; text-align: left; margin-bottom: 8px;">
          <div style="font-weight: bold; font-size: 8px; color: #555555; text-transform: uppercase; letter-spacing: 0.05em;">DELIVERY TO:</div>
          ${notesLines}
          ${riderHtml}
        </div>
      `;
    } else if (selectedOrder.orderType === "TAKEAWAY" && selectedOrder.notes) {
      const notesLines = selectedOrder.notes.split("\n").map((line: string) => `<div style="font-weight: bold; line-height: 1.3;">${line}</div>`).join("");
      deliveryTakeawayHtml = `
        <div style="border-top: 1px dashed #000000; padding-top: 6px; font-size: 10px; text-align: left; margin-bottom: 8px;">
          <div style="font-weight: bold; font-size: 8px; color: #555555; text-transform: uppercase; letter-spacing: 0.05em;">TAKEAWAY CUSTOMER:</div>
          ${notesLines}
        </div>
      `;
    }

    const logoHtml = selectedOrder.tenant?.logoUrl
      ? `<img src="${selectedOrder.tenant.logoUrl}" style="max-width: 80px; max-height: 80px; margin: 0 auto 8px auto; display: block;" alt="Business Logo" />`
      : "";


    win.document.write(`
      <html><head><title>${businessName}</title>
      <style>
        @page { 
          size: 80mm auto; 
          margin: 4mm; 
        }
        html, body { 
          margin: 0; 
          padding: 0; 
          width: 100%; 
          box-sizing: border-box;
          font-family: 'Arial', sans-serif; 
          font-size: 13px; 
          font-weight: bold;
          background-color: #ffffff !important; 
          color: #000000 !important; 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact;
        }
        * {
          box-sizing: border-box;
          color: #000000 !important;
          text-shadow: none !important;
          font-weight: bold !important;
        }
        .receipt-body {
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 4px !important;
          margin: 0 !important;
          border: none !important;
          box-shadow: none !important;
        }
      </style></head><body>
      <div class="receipt-body">
        <div style="text-align: center; margin-bottom: 12px;">
          <div style="font-size: 10px; color: #000000; line-height: 1.4; font-weight: bold;">
            ${logoHtml}
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; text-transform: uppercase;">
              ${businessName}
            </div>
            <div style="font-weight: bold; font-size: 11px; margin-bottom: 6px; text-transform: uppercase;">RECEIPT</div>
            Date: ${new Date(selectedOrder.createdAt || Date.now()).toLocaleString()}<br/>
            Order #: ${selectedOrder.orderNumber}<br/>
            Type: <span style="font-weight: bold;">${selectedOrder.orderType.replace("_", " ")}</span><br/>
            Payment: <span style="font-weight: bold;">${selectedOrder.status === "COMPLETED" ? "PAID" : "PENDING"}</span><br/>
            Cashier: <span style="font-weight: bold;">${selectedOrder.user?.name || "System"}</span>
          </div>
        </div>

        ${tableHtml}
        
        <div style="border-top: 1px dashed #000000; margin: 8px 0;"></div>
        
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px;">
          <span style="width: 50%; text-align: left;">Item</span>
          <span style="width: 25%; text-align: center;">Qty</span>
          <span style="width: 25%; text-align: right;">Total</span>
        </div>
        
        <div style="border-top: 1px dashed #000000; margin: 8px 0;"></div>
        
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${itemsHtml}
        </div>
        
        <div style="border-top: 1px dashed #000000; margin: 8px 0;"></div>
        
        <div style="display: flex; flex-direction: column; gap: 2px; font-size: 10px; font-weight: bold; text-align: right;">
          <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>${subtotal}</span></div>
          ${discountHtml}
          <div style="display: flex; justify-content: space-between;"><span>Tax:</span><span>${selectedOrder.tax.toFixed(2)}</span></div>
          ${deliveryHtml}
        </div>
        
        <div style="border-top: 1px dashed #000000; margin: 8px 0;"></div>
   
        <div style="display: flex; justify-content: space-between; font-weight: 950; font-size: 14px;">
          <span>TOTAL:</span><span>PKR ${selectedOrder.totalAmount.toFixed(2)}</span>
        </div>

        ${specialInstructionsHtml}
        ${deliveryTakeawayHtml}

        <div style="border-top: 1px dashed #000000; margin: 8px 0;"></div>
        <div style="text-align: center; margin-bottom: 8px;">
          <div style="font-size: 10px; font-weight: bold; text-align: center; line-height: 1.4;">
            ${addressHtml}
            ${whatsAppHtml}
            ${ntnHtml}
            ${strnHtml}
            ${paymentChannelsHtml}
          </div>
        </div>
        
        <div style="text-align: center; padding-top: 12px; font-size: 10px; font-weight: bold;">
          <p style="font-weight: bold; margin: 0;">THANK YOU FOR YOUR VISIT</p>
          <p style="color: #000000; margin-top: 4px; margin-bottom: 0; font-size: 9px;">Powered by Lincoz Tech</p>
        </div>
        <div style="height: 90px;"></div>
      </div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
      win.close();
    }, 350);
  };

  const triggerCashierPrint = async (order: any) => {
    if (!order) return;
    // Check localStorage first (set by POS printer setup), then fall back to tenant settings
    const localIp = typeof window !== "undefined" ? localStorage.getItem("cashierPrinterIp") : null;
    const localPort = typeof window !== "undefined" ? localStorage.getItem("cashierPrinterPort") : null;
    const cashierIp = localIp || order.tenant?.cashierPrinterIp;
    const cashierPort = localPort ? parseInt(localPort) : (order.tenant?.cashierPrinterPort || 9100);

    if (cashierIp) {
      try {
        const res = await axios.post("/api/print/bill", {
          ip: cashierIp,
          port: cashierPort,
          orderId: order.id
        });
        if (res.data.success) {
          toast.success("Receipt sent to cashier printer!");
        } else {
          throw new Error("Cashier printer offline");
        }
      } catch (err) {
        console.error(err);
        toast.warning("Cashier printer offline. Opening browser print dialog...");
        handlePrint();
      }
    } else {
      handlePrint();
    }
  };

  const getMonthsList = () => {
    const list = [];
    const date = new Date();
    date.setDate(1);
    for (let i = 0; i < 12; i++) {
      const m = date.getMonth();
      const y = date.getFullYear();
      const name = date.toLocaleString("en-US", { month: "long" });
      const monthVal = String(m + 1).padStart(2, "0");
      // Label like "May 2026", value "2026-05"
      list.push({ label: `${name} ${y}`, value: `${y}-${monthVal}` });
      date.setMonth(date.getMonth() - 1);
    }
    return list;
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (statusFilter !== "ALL") params.status = statusFilter;

      if (dateFilter) {
        params.startDate = dateFilter;
        params.endDate = dateFilter;
      } else if (monthFilter !== "ALL") {
        const [year, month] = monthFilter.split("-");
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        params.startDate = `${year}-${month}-01`;
        params.endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
      }

      params.showClosed = showClosed;

      const res = await axios.get("/api/orders", { params });
      setOrders(res.data.orders);
      setTotal(res.data.total);
    } catch (err: any) {
      console.error("fetchOrders error:", err);
      toast.error(`Failed to load orders: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, dateFilter, monthFilter, showClosed]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateFilter, monthFilter, showClosed]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = orders.filter(
    (o) =>
      String(o.orderNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCancelOrder = async (id: string) => {
    if (!confirm("Are you sure you want to CANCEL this order? This will restore stock and free up the table.")) return;
    setCancelling(true);
    try {
      await axios.patch(`/api/orders/${id}`, { status: "CANCELLED" });
      toast.success("Order cancelled successfully");
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm("Are you sure you want to permanently DELETE this order? This action cannot be undone.")) return;
    try {
      await axios.delete(`/api/orders/${id}`);
      toast.success("Order deleted successfully");
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete order");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sales Log</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Track and manage all sales transactions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-bold text-sm">
            <ShoppingBag className="w-4 h-4" />
            {total} Total Orders
          </div>
          <Button
            variant="destructive"
            className="h-10 rounded-xl font-bold px-4 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100 flex items-center gap-2"
            onClick={() => setEodModalOpen(true)}
            disabled={loading}
          >
            <AlertTriangle className="w-4 h-4" />
            Daily Closing
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[280px] max-w-md group">
          <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <Input
            placeholder="Search by order # or customer..."
            className="pl-11 h-12 rounded-xl border-slate-200 bg-white text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
          <SelectTrigger className="h-12 rounded-xl w-44 bg-white border-slate-200 text-sm font-bold text-slate-700">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="font-bold text-xs">All Statuses</SelectItem>
            <SelectItem value="COMPLETED" className="font-bold text-xs">Completed</SelectItem>
            <SelectItem value="PENDING" className="font-bold text-xs">Pending</SelectItem>
            <SelectItem value="PREPARING" className="font-bold text-xs">Preparing</SelectItem>
            <SelectItem value="READY" className="font-bold text-xs">Ready</SelectItem>
            <SelectItem value="CANCELLED" className="font-bold text-xs">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-12">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</span>
          <input 
            type="date"
            className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-28 cursor-pointer"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setMonthFilter("ALL");
            }}
          />
        </div>

        {/* Month Filter */}
        <select 
          className="h-12 rounded-xl w-44 bg-white border border-slate-200 px-3 font-bold text-xs text-slate-700 outline-none cursor-pointer"
          value={monthFilter}
          onChange={(e) => {
            setMonthFilter(e.target.value);
            setDateFilter("");
          }}
        >
          <option value="ALL">All Months</option>
          {getMonthsList().map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {/* Record Type (Active/Closed) Filter */}
        <select 
          className="h-12 rounded-xl w-48 bg-white border border-slate-200 px-3 font-bold text-xs text-slate-700 outline-none cursor-pointer"
          value={showClosed}
          onChange={(e) => {
            setShowClosed(e.target.value);
          }}
        >
          <option value="all">All Records (Active & Closed)</option>
          <option value="false">Active Session Orders</option>
          <option value="true">Closed (EOD) Records</option>
        </select>

        {/* Reset Filters */}
        {(statusFilter !== "ALL" || dateFilter || monthFilter !== "ALL" || showClosed !== "all" || search) && (
          <Button 
            variant="ghost" 
            onClick={() => {
              setStatusFilter("ALL");
              setDateFilter("");
              setMonthFilter("ALL");
              setShowClosed("all");
              setSearch("");
            }}
            className="text-rose-500 font-bold hover:bg-rose-50 rounded-xl h-12 text-xs"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-5 px-6 font-bold text-slate-700 min-w-[120px]">Order</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[150px]">Customer</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[100px]">Type</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[120px]">Payment</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[100px]">Amount</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[130px]">Status</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[150px]">Time</TableHead>
                <TableHead className="text-right font-bold text-slate-700 px-6 min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <div className="h-12 bg-slate-50 rounded-xl animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-slate-400 font-medium">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order, idx) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col">
                      <p className="font-bold text-slate-900">{order.orderNumber}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-bold">
                          {order.user?.name?.charAt(0)}
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
                          Cashier: {order.user?.name || "System"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-slate-700">{order.customer?.name || "Walk-in"}</p>
                    {order.table?.name && (
                      <Badge variant="ghost" className="text-[10px] bg-blue-50 text-blue-600 mt-1">
                        Table: {order.table.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold text-xs">
                      {order.orderType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm">
                      {paymentIcons[order.paymentMethod] || <CreditCard className="w-4 h-4" />}
                      {order.paymentMethod}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-black text-slate-900">PKR {order.totalAmount.toFixed(2)}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-bold text-xs px-3 py-1 ${statusColors[order.status] || ""}`}
                    >
                      {order.status === "COMPLETED" ? (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : order.status === "CANCELLED" ? (
                        <XCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-slate-500 font-medium">
                      {new Date(order.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-blue-600 rounded-xl"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="w-5 h-5" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 font-medium">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} orders
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-bold text-slate-700 px-3">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-[420px] max-h-[95vh] overflow-y-auto scroll-left rounded-[2.5rem] p-6 bg-white border-none shadow-2xl">
          <div style={{ direction: "ltr" }}>
            <DialogHeader className="pb-2">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" /> Order Details
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4 pt-1">
                {/* Receipt Content Wrapper with Jagged Thermal Roll Aesthetic */}
                <div className="relative py-2 bg-slate-50 rounded-2xl border border-slate-100/80 p-4">
                  {/* Jagged Top Pattern */}
                  <div className="w-[300px] mx-auto h-[6px]" style={{
                    backgroundImage: "linear-gradient(-45deg, transparent 4px, #ffffff 4px), linear-gradient(45deg, transparent 4px, #ffffff 4px)",
                    backgroundSize: "8px 8px",
                    backgroundRepeat: "repeat-x"
                  }} />
                  {/* Main Receipt Body */}
                  <div ref={receiptRef} className="receipt-body font-mono text-xs bg-white text-black p-6 w-[300px] mx-auto border-x border-slate-200/50 shadow-md" style={{ backgroundColor: "#ffffff", color: "#000000", fontFamily: "monospace" }}>
                    <div style={{ textAlign: "center", marginBottom: "12px" }}>
                      <div style={{ fontSize: "10px", color: "#000000", lineHeight: "1.4", fontWeight: "bold" }}>
                        {selectedOrder.tenant?.logoUrl && (
                          <img 
                            src={selectedOrder.tenant.logoUrl} 
                            style={{ maxWidth: "80px", maxHeight: "80px", margin: "0 auto 8px auto", display: "block" }} 
                            alt="Business Logo" 
                          />
                        )}
                        <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px", textTransform: "uppercase" }}>
                          {selectedOrder.tenant?.name || "Cheesy Bite"}
                        </div>
                        <div style={{ fontWeight: "bold", fontSize: "11px", marginBottom: "6px", textTransform: "uppercase" }}>RECEIPT</div>
                        Date: {new Date(selectedOrder.createdAt || Date.now()).toLocaleString()}<br/>
                        Order #: ${selectedOrder.orderNumber}<br/>
                        Type: <span style={{ fontWeight: "bold" }}>{selectedOrder.orderType.replace("_", " ")}</span><br/>
                        Payment: <span style={{ fontWeight: "bold" }}>{selectedOrder.status === "COMPLETED" ? "PAID" : "PENDING"}</span><br/>
                        Cashier: <span style={{ fontWeight: "bold" }}>{selectedOrder.user?.name || "System"}</span>
                      </div>
                    </div>

                    {selectedOrder.orderType === "DINE_IN" && selectedOrder.table?.name && (
                      <div style={{ borderTop: "1px dashed #000000", paddingTop: "6px", fontSize: "11px", fontWeight: "bold", textAlign: "center", marginBottom: "8px" }}>
                        TABLE: {selectedOrder.table.name}
                      </div>
                    )}
                    
                    <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}></div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "11px" }}>
                      <span style={{ width: "50%", textAlign: "left" }}>Item</span>
                      <span style={{ width: "25%", textAlign: "center" }}>Qty</span>
                      <span style={{ width: "25%", textAlign: "right" }}>Total</span>
                    </div>
                    
                    <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}></div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {selectedOrder.items?.map((item: any) => (
                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: "bold" }}>
                          <span style={{ width: "50%", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.notes ? `${item.product?.name} (${item.notes})` : (item.product?.name || "Product")}
                          </span>
                          <span style={{ width: "25%", textAlign: "center" }}>{item.quantity}</span>
                          <span style={{ width: "25%", textAlign: "right" }}>{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}></div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "10px", fontWeight: "bold", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal:</span><span>{(selectedOrder.totalAmount - selectedOrder.tax - (selectedOrder.deliveryCharges || 0) + selectedOrder.discount).toFixed(2)}</span></div>
                      {selectedOrder.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}><span>Discount:</span><span>-{selectedOrder.discount.toFixed(2)}</span></div>}
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tax:</span><span>{selectedOrder.tax.toFixed(2)}</span></div>
                      {(selectedOrder.deliveryCharges || 0) > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Delivery Charges:</span><span>{selectedOrder.deliveryCharges.toFixed(2)}</span></div>}
                    </div>
                    
                    <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}></div>
     
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "950", fontSize: "14px" }}>
                      <span>TOTAL:</span><span>PKR {selectedOrder.totalAmount.toFixed(2)}</span>
                    </div>

                    {selectedOrder.specialInstructions && (
                      <>
                        <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}></div>
                        <div style={{ fontSize: "10px", fontWeight: "bold", textAlign: "left" }}>
                          SPECIAL INSTRUCTION:<br/>
                          <span style={{ fontSize: "11px" }}>{selectedOrder.specialInstructions}</span>
                        </div>
                      </>
                    )}

                    {/* Delivery & Takeaway info */}
                    {selectedOrder.orderType === "DELIVERY" && selectedOrder.notes && (
                      <div style={{ borderTop: "1px dashed #000000", paddingTop: "6px", fontSize: "10px", textAlign: "left", marginBottom: "8px" }}>
                        <div style={{ fontWeight: "bold", fontSize: "8px", color: "#555555", textTransform: "uppercase", letterSpacing: "0.05em" }}>DELIVERY TO:</div>
                        {selectedOrder.notes.split("\n").map((line: string, idx: number) => (
                          <div key={idx} style={{ fontWeight: "bold", lineHeight: "1.3" }}>{line}</div>
                        ))}
                        {selectedOrder.riderName && (
                          <div style={{ marginTop: "4px", fontWeight: "bold", color: "#333333" }}>Rider: {selectedOrder.riderName}</div>
                        )}
                      </div>
                    )}
                    
                    {selectedOrder.orderType === "TAKEAWAY" && selectedOrder.notes && (
                      <div style={{ borderTop: "1px dashed #000000", paddingTop: "6px", fontSize: "10px", textAlign: "left", marginBottom: "8px" }}>
                        <div style={{ fontWeight: "bold", fontSize: "8px", color: "#555555", textTransform: "uppercase", letterSpacing: "0.05em" }}>TAKEAWAY CUSTOMER:</div>
                        {selectedOrder.notes.split("\n").map((line: string, idx: number) => (
                          <div key={idx} style={{ fontWeight: "bold", lineHeight: "1.3" }}>{line}</div>
                        ))}
                      </div>
                    )}

                    {/* Business Logo, Name, Address & payment settings moved here (under total bill) */}
                    <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}></div>
                    <div style={{ textAlign: "center", marginBottom: "8px" }}>
                      {/* Logo & Name are now displayed at the top */}
                      <div style={{ fontSize: "10px", fontWeight: "bold", textAlign: "center", lineHeight: "1.4" }}>
                        {selectedOrder.tenant?.receiptAddressString && (
                          <div style={{ marginBottom: "2px" }}>
                            Address: {selectedOrder.tenant.receiptAddressString}
                          </div>
                        )}
                        {selectedOrder.tenant?.receiptWhatsAppString && (
                          <div style={{ marginBottom: "4px" }}>
                            WhatsApp: {selectedOrder.tenant.receiptWhatsAppString}
                          </div>
                        )}
                        {selectedOrder.tenant?.ntn && (
                          <div style={{ fontSize: "9px" }}>
                            NTN: {selectedOrder.tenant.ntn}
                          </div>
                        )}
                        {selectedOrder.tenant?.strn && (
                          <div style={{ fontSize: "9px" }}>
                            STRN: {selectedOrder.tenant.strn}
                          </div>
                        )}
                        {(selectedOrder.tenant?.receiptEasyPaisaString || selectedOrder.tenant?.receiptJazzCashString || selectedOrder.tenant?.receiptRaastString || selectedOrder.tenant?.receiptBankString) && (
                          <div style={{ borderTop: "1px dashed #000000", marginTop: "6px", paddingTop: "4px" }}>
                            <div style={{ fontWeight: "bold", textTransform: "uppercase", marginBottom: "3px" }}>Payment Channels:</div>
                            {selectedOrder.tenant.receiptEasyPaisaString && <div>EasyPaisa: {selectedOrder.tenant.receiptEasyPaisaString}</div>}
                            {selectedOrder.tenant.receiptJazzCashString && <div>JazzCash: {selectedOrder.tenant.receiptJazzCashString}</div>}
                            {selectedOrder.tenant.receiptRaastString && <div>Raast ID: {selectedOrder.tenant.receiptRaastString}</div>}
                            {selectedOrder.tenant.receiptBankString && <div>Bank: {selectedOrder.tenant.receiptBankString}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: "center", paddingTop: "12px", fontSize: "10px", fontWeight: "bold" }}>
                      <p style={{ fontWeight: "bold", margin: "0" }}>THANK YOU FOR YOUR VISIT</p>
                      <p style={{ color: "#000000", marginTop: "4px", marginBottom: "0", fontSize: "9px" }}>Powered by Lincoz Tech</p>
                    </div>
                    {/* Extra bottom padding to feed paper past the physical cutter of thermal printer */}
                    <div style={{ height: "90px" }}></div>
                  </div>

                  {/* Jagged Bottom Pattern */}
                  <div className="w-[300px] mx-auto h-[6px]" style={{
                    backgroundImage: "linear-gradient(-135deg, transparent 4px, #ffffff 4px), linear-gradient(135deg, transparent 4px, #ffffff 4px)",
                    backgroundSize: "8px 8px",
                    backgroundRepeat: "repeat-x"
                  }} />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => triggerCashierPrint(selectedOrder)} className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100 text-white flex items-center justify-center">
                    <Printer className="mr-2 w-4 h-4" /> Print Bill
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedOrder(null)} className="flex-1 h-11 rounded-xl font-bold border-slate-200 hover:bg-slate-50">
                    Close
                  </Button>
                </div>

                {selectedOrder.status !== "CANCELLED" && selectedOrder.status !== "COMPLETED" && (
                  <div className="pt-2 border-t border-slate-100">
                    <Button 
                      variant="ghost" 
                      disabled={cancelling}
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      className="w-full h-11 rounded-xl text-amber-600 hover:bg-amber-50 hover:text-amber-700 font-bold border border-amber-100"
                    >
                      {cancelling ? "Cancelling..." : "Cancel / Void Order"}
                    </Button>
                  </div>
                )}

                {currentUser && (currentUser.role === "TENANT_ADMIN" || currentUser.role === "BRANCH_MANAGER") && (
                  <div className="pt-2 border-t border-slate-100">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleDeleteOrder(selectedOrder.id)}
                      className="w-full h-11 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold border border-rose-100"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Order (Admin Only)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Closing Report Modal */}
      <Dialog open={eodModalOpen} onOpenChange={setEodModalOpen}>
        <DialogContent className="w-full sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[1400px] max-h-[90vh] overflow-y-auto rounded-none sm:rounded-3xl p-4 sm:p-6 bg-white">
          <DialogHeader className="border-b pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600 animate-pulse" />
                  Daily Closing (End of Day) Summary
                </DialogTitle>
                <p className="text-slate-500 font-medium text-xs mt-0.5">Generate, view, and print business closing summaries.</p>
              </div>

              {/* EOD Session Mode Selector */}
              <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto items-center gap-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-2 hidden sm:inline">Select Period:</span>
                <select
                  value={eodReportPeriod}
                  onChange={(e: any) => {
                    setEodReportPeriod(e.target.value);
                    setDownloaded(false);
                    setConfirmed(false);
                  }}
                  className="h-8 rounded-lg bg-white border border-slate-200 px-3 font-bold text-xs text-slate-700 outline-none cursor-pointer"
                >
                  <option value="active">Current Active Session</option>
                  <option value="daily">Custom Date (Closed Sales)</option>
                  <option value="weekly">Complete Week (Closed Sales)</option>
                  <option value="monthly">Month (Closed Sales)</option>
                </select>
              </div>
            </div>

            {/* Historical Filters Row */}
            {eodReportPeriod !== "active" && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                {eodReportPeriod === "daily" && (
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 h-9">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Date</span>
                    <input
                      type="date"
                      className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-28 cursor-pointer"
                      value={eodDateFilter}
                      onChange={(e) => setEodDateFilter(e.target.value)}
                    />
                  </div>
                )}

                {eodReportPeriod === "weekly" && (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 h-9">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Date in Week</span>
                      <input
                        type="date"
                        className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-28 cursor-pointer"
                        value={eodWeekDateFilter}
                        onChange={(e) => setEodWeekDateFilter(e.target.value)}
                      />
                    </div>
                    <div className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-100">
                      Week Range: {getWeekRange(eodWeekDateFilter).label}
                    </div>
                  </div>
                )}

                {eodReportPeriod === "monthly" && (
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 h-9">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Month</span>
                    <select
                      className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-40 cursor-pointer"
                      value={eodMonthFilter}
                      onChange={(e) => setEodMonthFilter(e.target.value)}
                    >
                      <option value="ALL">Select Month</option>
                      {getMonthsList().map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </DialogHeader>

          {eodLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <p className="font-semibold">Calculating closing stats...</p>
            </div>
          ) : eodStats ? (
            <div className="space-y-6 pt-4">
              {/* Warning/Info box */}
              {eodReportPeriod === "active" ? (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-rose-900">Start Next Day Fresh</h4>
                    <p className="text-sm text-rose-700 font-medium mt-0.5">
                      Performing the Daily Closing resets all active sales and order logs to zero. You MUST print or download the report before completing the closing sequence as this data cannot be recovered.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
                  <Calendar className="w-6 h-6 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="font-bold text-blue-900">Archived Closing Report</h4>
                    <p className="text-sm text-blue-700 font-medium mt-0.5">
                      You are viewing historical closing records for {
                        eodReportPeriod === "daily" ? `date: ${eodDateFilter}` :
                        eodReportPeriod === "weekly" ? `week: ${getWeekRange(eodWeekDateFilter).label}` :
                        `month: ${eodMonthFilter}`
                      }. Active session sales are not affected.
                    </p>
                  </div>
                </div>
              )}

              {/* Main metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
                  <span className="text-2xl font-black text-slate-800 block mt-1">{eodStats.totalOrders}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gross Revenue</span>
                  <span className="text-2xl font-black text-slate-800 block mt-1">PKR {eodStats.totalRevenue.toFixed(0)}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Discounts</span>
                  <span className="text-2xl font-black text-slate-800 block mt-1">PKR {eodStats.totalDiscount.toFixed(0)}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Taxes Collected</span>
                  <span className="text-2xl font-black text-slate-800 block mt-1">PKR {eodStats.totalTax.toFixed(0)}</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl col-span-2 md:col-span-1">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Net Sales</span>
                  <span className="text-2xl font-black text-blue-600 block mt-1">PKR {eodStats.netSales.toFixed(0)}</span>
                </div>
              </div>

              {/* Breakdowns columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Payment Methods & Order Types */}
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                    <h4 className="font-bold text-slate-900 mb-3 border-b pb-2">Payment Methods</h4>
                    <div className="space-y-2 text-sm font-semibold">
                      {eodStats.paymentMethods.map((pm: any) => (
                        <div key={pm.name} className="flex justify-between">
                          <span className="text-slate-500">{pm.name} ({pm.count})</span>
                          <span className="text-slate-900">PKR {pm.total.toFixed(2)}</span>
                        </div>
                      ))}
                      {eodStats.paymentMethods.length === 0 && (
                        <div className="text-slate-400 italic text-center py-2">No payments yet</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                    <h4 className="font-bold text-slate-900 mb-3 border-b pb-2">Order Types</h4>
                    <div className="space-y-2 text-sm font-semibold">
                      {eodStats.orderTypes.map((ot: any) => (
                        <div key={ot.name} className="flex justify-between">
                          <span className="text-slate-500">{ot.name} ({ot.count})</span>
                          <span className="text-slate-900">PKR {ot.total.toFixed(2)}</span>
                        </div>
                      ))}
                      {eodStats.orderTypes.length === 0 && (
                        <div className="text-slate-400 italic text-center py-2">No orders recorded</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cashier performance & Products summary */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                    <h4 className="font-bold text-slate-900 mb-3 border-b pb-2">Cashier Activity</h4>
                    <div className="space-y-2 text-sm font-semibold">
                      {eodStats.cashiers.map((c: any) => (
                        <div key={c.name} className="flex justify-between">
                          <span className="text-slate-500">{c.name} ({c.count} orders)</span>
                          <span className="text-slate-900">PKR {c.total.toFixed(2)}</span>
                        </div>
                      ))}
                      {eodStats.cashiers.length === 0 && (
                        <div className="text-slate-400 italic text-center py-2">No cashier data</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-2xl max-h-[300px] overflow-y-auto">
                    <h4 className="font-bold text-slate-900 mb-3 border-b pb-2 sticky top-0 bg-white">Sold Products Summary</h4>
                    <div className="space-y-2 text-sm font-semibold">
                      {eodStats.products.map((p: any) => (
                        <div key={p.name} className="flex justify-between">
                          <span className="text-slate-500 truncate max-w-[250px]">{p.name} <span className="text-blue-600 font-bold ml-1">x{p.quantity}</span></span>
                          <span className="text-slate-900">PKR {p.total.toFixed(2)}</span>
                        </div>
                      ))}
                      {eodStats.products.length === 0 && (
                        <div className="text-slate-400 italic text-center py-2">No products sold yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons and confirmation */}
              <div className="border-t border-slate-100 pt-6 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 rounded-xl font-bold bg-white text-slate-700 flex items-center gap-2 border-slate-200"
                      onClick={handleExportEod}
                    >
                      <Download className="w-4 h-4" />
                      Save Excel / CSV
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 rounded-xl font-bold bg-white text-slate-700 flex items-center gap-2 border-slate-200"
                      onClick={handlePrintEod}
                    >
                      <Printer className="w-4 h-4" />
                      Print Closing Report
                    </Button>
                  </div>

                  {eodViewMode === "active" && (
                    <label className="flex items-center gap-2 cursor-pointer select-none border border-slate-200 hover:border-blue-300 p-3 rounded-xl transition-all">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                      />
                      <span className="text-xs font-bold text-slate-600">I have downloaded/printed the report</span>
                    </label>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-12 rounded-xl font-semibold px-6"
                    onClick={() => setEodModalOpen(false)}
                    disabled={resetting}
                  >
                    {eodViewMode === "active" ? "Cancel" : "Close"}
                  </Button>
                  {eodViewMode === "active" && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="h-12 rounded-xl font-bold px-8 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!confirmed || resetting || !downloaded}
                      onClick={handleResetDay}
                    >
                      {resetting ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        "Complete End of Day & Clear Sales"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 font-medium">
              No report details available.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
