"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard,
  Banknote, User, Printer, LayoutGrid, List, Tag,
  CheckCircle2, X, Smartphone, Utensils, Package, History,
  ChevronLeft, ChevronRight, AlertTriangle, Loader2, Calendar, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-rose-600 bg-rose-50 rounded-xl m-4 border border-rose-200">
          <h2 className="text-2xl font-bold mb-4">POS Render Crash</h2>
          <p className="font-mono text-sm whitespace-pre-wrap">{this.state.error?.toString()}</p>
          <p className="font-mono text-xs whitespace-pre-wrap mt-2">{this.state.error?.stack}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function POSContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [discount, setDiscount] = useState("0");
  const [discountType, setDiscountType] = useState<"PERCENT" | "AMOUNT">("AMOUNT");
  const [deliveryCharges, setDeliveryCharges] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [orderType, setOrderType] = useState("RETAIL");
  const [selectedTable, setSelectedTable] = useState("");
  const [riderName, setRiderName] = useState("");
  const [deliveryCustomerName, setDeliveryCustomerName] = useState("");
  const [deliveryCustomerPhone, setDeliveryCustomerPhone] = useState("");
  const [deliveryCustomerAddress, setDeliveryCustomerAddress] = useState("");
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [tenantSettings, setTenantSettings] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isRenamingTable, setIsRenamingTable] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const receiptRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  const [printerSetupOpen, setPrinterSetupOpen] = useState(false);
  const [localCashierIp, setLocalCashierIp] = useState("");
  const [localKitchenIp, setLocalKitchenIp] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocalCashierIp(localStorage.getItem("cashierPrinterIp") || "");
      setLocalKitchenIp(localStorage.getItem("kitchenPrinterIp") || "");
    }
  }, []);

  const handleSavePrinters = () => {
    localStorage.setItem("cashierPrinterIp", localCashierIp);
    localStorage.setItem("kitchenPrinterIp", localKitchenIp);
    toast.success("Printer IP settings saved locally!");
    setPrinterSetupOpen(false);
  };

  // Sizing Modal selection states
  const [selectedSizingProduct, setSelectedSizingProduct] = useState<any | null>(null);
  const [customizingDealProduct, setCustomizingDealProduct] = useState<any | null>(null);
  const [dealSelections, setDealSelections] = useState<{ [productId: string]: string }>({});

  // Orders Log states
  const [showOrdersLog, setShowOrdersLog] = useState(false);
  const [ordersLogList, setOrdersLogList] = useState<any[]>([]);
  const [ordersFilterStatus, setOrdersFilterStatus] = useState<string>(""); // No status filter by default
  const [ordersFilterDate, setOrdersFilterDate] = useState<string>("ALL"); // Show all dates by default

  // Active Editing Mode state
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // EOD states
  const [eodModalOpen, setEodModalOpen] = useState(false);
  const [eodLoading, setEodLoading] = useState(false);
  const [eodStats, setEodStats] = useState<any>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [resetting, setResetting] = useState(false);

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

  const getMonthsList = () => {
    const list = [];
    const date = new Date();
    date.setDate(1);
    for (let i = 0; i < 12; i++) {
      const m = date.getMonth();
      const y = date.getFullYear();
      const name = date.toLocaleString("en-US", { month: "long" });
      const monthVal = String(m + 1).padStart(2, "0");
      list.push({ label: `${name} ${y}`, value: `${y}-${monthVal}` });
      date.setMonth(date.getMonth() - 1);
    }
    return list;
  };

  const loadData = async () => {
    try {
      const [pRes, catRes, authRes] = await Promise.all([
        axios.get("/api/products").catch(e => { console.error("POS: Products fail", e); return { data: [] }; }),
        axios.get("/api/categories").catch(e => { console.error("POS: Categories fail", e); return { data: [] }; }),
        axios.get("/api/auth/me").catch(e => { console.error("POS: Auth fail", e); return { data: {} }; }),
      ]);

      setProducts(Array.isArray(pRes.data) ? pRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      if (authRes.data) {
        setCurrentUser(authRes.data);
        setTenantSettings(authRes.data.tenant);

        const hasRestaurant = authRes.data.tenant?.modules?.some((tm: any) => tm.module.name === "RESTAURANT_PRO");
        if (hasRestaurant) {
          setOrderType("DINE_IN");
        }
      }
      setLoading(false);

      // Load secondary data in background without blocking POS UI
      Promise.all([
        axios.get("/api/customers").catch(() => ({ data: [] })),
        axios.get("/api/orders?limit=100").catch(() => ({ data: { orders: [] } })),
      ]).then(([cRes, oRes]) => {
        setCustomers(Array.isArray(cRes.data) ? cRes.data : []);
        setOrdersLogList(oRes && oRes.data && Array.isArray(oRes.data.orders) ? oRes.data.orders : []);
      });
    } catch (err) {
      console.error("POS: Critical load error", err);
      toast.error("POS initialization failed. Check connection.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
      toast.success(`Daily closing complete! Reset \${res.data.deletedCount} orders.`);
      setEodModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to reset daily sales");
    } finally {
      setResetting(false);
    }
  };

  const addToCart = (product: any) => {
    // Intercept if product has sizes/variants
    const productSizes = product.sizes ? (typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes) : null;
    if (productSizes && Array.isArray(productSizes) && productSizes.length > 0) {
      setSelectedSizingProduct(product);
      return;
    }

    const isDeal = product.type === "DEAL";
    if (isDeal) {
      // Check if any ingredient in the deal is customizable: has size variations or is a category option
      const customizableItems = product.dealItems?.filter((di: any) => {
        if (di.categoryId) return true;
        const sizes = di.product?.sizes ? (typeof di.product.sizes === "string" ? JSON.parse(di.product.sizes) : di.product.sizes) : null;
        return sizes && Array.isArray(sizes) && sizes.length > 0;
      }) || [];

      if (customizableItems.length > 0) {
        // Initialize default selections with the first option for each customizable item
        const defaults: { [key: string]: string } = {};
        customizableItems.forEach((di: any) => {
          if (di.productId) {
            const sizes = di.product?.sizes ? (typeof di.product.sizes === "string" ? JSON.parse(di.product.sizes) : di.product.sizes) : [];
            if (sizes.length > 0) {
              defaults[di.product.id] = sizes[0].sizeName;
            }
          } else if (di.categoryId) {
            const catProds = products.filter(p => p.categoryId === di.categoryId);
            if (catProds.length > 0) {
              defaults[di.id + "_prod"] = catProds[0].id;
              const firstProdSizes = catProds[0].sizes ? (typeof catProds[0].sizes === "string" ? JSON.parse(catProds[0].sizes) : catProds[0].sizes) : [];
              if (firstProdSizes.length > 0) {
                defaults[di.id + "_size"] = firstProdSizes[0].sizeName;
              } else {
                defaults[di.id + "_size"] = "Standard";
              }
            }
          }
        });
        setDealSelections(defaults);
        setCustomizingDealProduct(product);
        return;
      }
    }

    if (!isDeal && product.stock <= 0) return toast.error("Out of stock");
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (!isDeal && existing.quantity >= product.stock) return toast.error("Not enough stock");
      setCart(cart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const addSizeToCart = (product: any, size: any) => {
    const cartId = `${product.id}-${size.sizeName}`;
    const existing = cart.find((item) => item.id === cartId);

    // Determine maximum allowed stock
    const maxStock = size.stock !== undefined ? parseInt(size.stock) : product.stock;

    if (size.stock !== undefined && parseInt(size.stock) <= 0) {
      return toast.error("Out of stock for this size variant");
    }

    if (existing) {
      if (existing.quantity >= maxStock) return toast.error("Not enough stock for this size variant");
      setCart(cart.map((item) =>
        item.id === cartId ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, {
        ...product,
        id: cartId,
        productId: product.id,
        name: `${product.name} (${size.sizeName})`,
        price: parseFloat(size.price) || 0,
        notes: size.sizeName, // Store selected size name inside order item notes
        quantity: 1
      }]);
    }
    toast.success(`${product.name} (${size.sizeName}) added to cart`);
    setSelectedSizingProduct(null);
  };

  const removeFromCart = (id: string) => setCart(cart.filter((item) => item.id !== id));

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        if (delta > 0) {
          const originalProd = products.find(p => p.id === (item.productId || item.id));
          if (originalProd) {
            const sizesList = originalProd.sizes ? (typeof originalProd.sizes === "string" ? JSON.parse(originalProd.sizes) : originalProd.sizes) : [];
            const isSizeVariant = item.notes && sizesList && sizesList.length > 0;
            if (isSizeVariant) {
              const sz = sizesList.find((s: any) => s.sizeName === item.notes);
              if (sz && sz.stock !== undefined) {
                const maxStock = parseInt(sz.stock);
                if (newQty > maxStock) {
                  toast.error(`Not enough stock. Only ${maxStock} left.`);
                  return item;
                }
              }
            } else if (originalProd.type !== "DEAL") {
              const maxStock = originalProd.stock || 0;
              if (newQty > maxStock) {
                toast.error(`Not enough stock. Only ${maxStock} left.`);
                return item;
              }
            }
          }
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountVal = parseFloat(discount) || 0;
  const discountAmt = discountType === "PERCENT"
    ? Math.min((subtotal * discountVal) / 100, subtotal)
    : Math.min(discountVal, subtotal);
  const taxable = subtotal - discountAmt;

  const cashTaxRate = tenantSettings?.cashTaxRate !== undefined ? tenantSettings.cashTaxRate : 16;
  const cardTaxRate = tenantSettings?.cardTaxRate !== undefined ? tenantSettings.cardTaxRate : 5;
  const taxRatePercent = paymentMethod === "CASH" ? cashTaxRate : cardTaxRate;
  const tax = taxable * (taxRatePercent / 100);

  const deliveryAmt = orderType === "DELIVERY" ? (parseFloat(deliveryCharges) || 0) : 0;
  const total = taxable + tax + deliveryAmt;

  const printKitchenBrowserFallback = (order: any, newItems: any[]) => {
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Popup blocked! Please enable popups to print kitchen KOT.");
      return;
    }
    const tableName = tables.find(t => t.id === order.tableId)?.name || "";
    win.document.write(`
      <html><head><title>KOT - Order #${order.orderNumber}</title>
      <style>
        @page { size: 80mm auto; margin: 0; }
        html, body {
          margin: 0;
          padding: 8px;
          width: 72mm;
          font-family: 'Arial', sans-serif;
          font-size: 15px;
          font-weight: bold;
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        .center { text-align: center; }
        .large { font-size: 22px; font-weight: 900; }
        .divider { border-top: 2px dashed #000000; margin: 8px 0; }
        .item-row { margin-bottom: 8px; font-size: 18px; }
        .instructions { font-size: 14px; font-style: italic; margin-left: 12px; font-weight: bold; }
      </style></head><body>
        <div class="center large">KITCHEN ORDER</div>
        <div class="center" style="font-size: 15px; font-weight: normal; margin-top: 4px;">
          ${order.orderType === "DINE_IN"
        ? (tableName ? `Dine In - Table: ${tableName}` : "Dine In")
        : order.orderType === "TAKEAWAY"
          ? "Take Away"
          : order.orderType === "DELIVERY"
            ? "Delivery"
            : order.orderType
      }
        </div>
        <div class="divider"></div>
        <div>Order #: ${order.orderNumber}</div>
        <div>Date: ${new Date(order.createdAt || Date.now()).toLocaleString()}</div>
        <div class="divider"></div>
        <div>
          ${newItems.map(item => `
            <div class="item-row">
              <span>${item.quantity} x ${item.name}</span>
              ${item.instructions ? `<div class="instructions">* ${item.instructions}</div>` : ""}
            </div>
          `).join("")}
        </div>
        <div class="divider"></div>
        <div style="height: 40px;"></div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
      win.close();
    }, 350);
  };

  const triggerKitchenPrint = async (order: any, cartItemsBeforeReset: any[]) => {
    const newItems = cartItemsBeforeReset.map(item => {
      const qtyDiff = item.quantity - (item.originalQuantity || 0);

      // Combine notes (e.g. customized choices like flavor/size) and instructions (extra requests)
      let combinedInstructions = item.notes || "";
      if (item.instructions) {
        combinedInstructions = combinedInstructions
          ? `${combinedInstructions} [${item.instructions}]`
          : `[${item.instructions}]`;
      }

      return {
        name: item.name,
        quantity: qtyDiff,
        instructions: combinedInstructions
      };
    }).filter(item => item.quantity > 0);

    if (newItems.length === 0) {
      toast.info("No new items added to send to kitchen.");
      return;
    }

    const activeKitchenIp = (typeof window !== "undefined" ? localStorage.getItem("kitchenPrinterIp") : "") || tenantSettings?.kitchenPrinterIp;
    const activeKitchenPort = (typeof window !== "undefined" ? localStorage.getItem("kitchenPrinterPort") : "") || tenantSettings?.kitchenPrinterPort || 9100;

    if (activeKitchenIp) {
      try {
        const res = await axios.post("/api/print/kitchen", {
          ip: activeKitchenIp,
          port: activeKitchenPort,
          orderNumber: order.orderNumber,
          tableName: tables.find(t => t.id === order.tableId)?.name || "",
          orderType: order.orderType,
          items: newItems,
          specialInstructions: order.specialInstructions || ""
        });
        if (res.data.success) {
          toast.success("KOT sent to kitchen printer!");
        } else {
          throw new Error("Printer offline");
        }
      } catch (err) {
        console.error(err);
        toast.warning("Kitchen printer offline. Printing KOT via browser...");
        printKitchenBrowserFallback(order, newItems);
      }
    } else {
      printKitchenBrowserFallback(order, newItems);
    }
  };

  const handleCheckout = async (isPending = false) => {
    if (cart.length === 0) return toast.error("Cart is empty");

    const tenantModuleList = tenantSettings?.modules || currentUser?.tenant?.modules || [];
    const activeModuleNames = tenantModuleList.map((tm: any) => typeof tm === "string" ? tm : (tm.module?.name || tm.name || tm.code || tm.moduleId || "")).filter(Boolean);
    const isPharm = activeModuleNames.includes("PHARMACY_SPECIAL");
    const isGymClub = activeModuleNames.includes("GYM_FITNESS_PRO");
    const hasRestaurant = activeModuleNames.includes("RESTAURANT_PRO") || activeModuleNames.includes("BAKERY_PRO");

    if (hasRestaurant) {
      if (orderType === "DINE_IN" && (!selectedTable || selectedTable === "none")) {
        return toast.error("Please select a table for Dine-in orders.");
      }
      if (orderType === "DELIVERY" && (!deliveryCustomerName || !deliveryCustomerPhone || !deliveryCustomerAddress)) {
        return toast.error("Please provide complete delivery details (Name, Phone, Address).");
      }
      if (orderType === "TAKEAWAY" && (!deliveryCustomerName || !deliveryCustomerPhone)) {
        return toast.error("Please provide takeaway customer details (Name, Phone).");
      }
    }

    setIsProcessing(true);

    let finalNotes = "";
    if (orderType === "DELIVERY") {
      finalNotes = `Customer: ${deliveryCustomerName}\nPhone: ${deliveryCustomerPhone}\nAddress: ${deliveryCustomerAddress}`;
    } else if (orderType === "TAKEAWAY") {
      finalNotes = `Customer: ${deliveryCustomerName}\nPhone: ${deliveryCustomerPhone}`;
    }

    try {
      const checkoutItems = cart.map((item) => {
        let finalNotes = item.notes || "";
        if (item.instructions) {
          finalNotes = finalNotes ? `${finalNotes} [${item.instructions}]` : `[${item.instructions}]`;
        }
        return {
          productId: item.productId || item.id,
          quantity: item.quantity,
          price: item.price,
          notes: finalNotes || null
        };
      });

      const res = await axios.post("/api/orders", {
        items: checkoutItems,
        totalAmount: total,
        paymentMethod: paymentMethod,
        discount: discountAmt,
        tax,
        deliveryCharges: (parseFloat(deliveryCharges) || 0), // custom charges input on the fly
        specialInstructions: specialInstructions || null,
        orderType,
        customerId: selectedCustomer && selectedCustomer !== "none" ? selectedCustomer : undefined,
        tableId: selectedTable && selectedTable !== "none" ? selectedTable : undefined,
        riderName: orderType === "DELIVERY" ? riderName : undefined,
        notes: finalNotes || null,
        status: isPending ? "PENDING" : "COMPLETED",
        paymentStatus: isPending ? "UNPAID" : "PAID",
      });

      const orderData = res.data;

      // Handle Kitchen Printing if pending
      if (isPending) {
        await triggerKitchenPrint(orderData, cart);
      }

      setLastOrder({
        ...orderData,
        items: cart,
        customer: customers.find((c) => c.id === selectedCustomer)
      });

      setCart([]);
      setDiscount("0");
      setDiscountType("AMOUNT");
      setDeliveryCharges("0");
      setSpecialInstructions("");
      setRiderName("");
      setDeliveryCustomerName("");
      setDeliveryCustomerPhone("");
      setDeliveryCustomerAddress("");
      setSelectedCustomer("");
      setSelectedTable("");
      setDetailsSaved(false);

      if (!isPending) {
        setShowReceipt(true);
        toast.success("Order processed and paid!");
        triggerCashierPrint(orderData);
      } else {
        toast.success("Order sent to kitchen!");
      }
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Checkout failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateOrder = async (isPending = false) => {
    if (cart.length === 0) return toast.error("Cart is empty");

    const tenantModuleList = tenantSettings?.modules || currentUser?.tenant?.modules || [];
    const activeModuleNames = tenantModuleList.map((tm: any) => typeof tm === "string" ? tm : (tm.module?.name || tm.name || tm.code || tm.moduleId || "")).filter(Boolean);
    const isPharm = activeModuleNames.includes("PHARMACY_SPECIAL");
    const isGymClub = activeModuleNames.includes("GYM_FITNESS_PRO");
    const hasRestaurant = activeModuleNames.includes("RESTAURANT_PRO") || activeModuleNames.includes("BAKERY_PRO");

    if (hasRestaurant) {
      if (orderType === "DINE_IN" && (!selectedTable || selectedTable === "none")) {
        return toast.error("Please select a table for Dine-in orders.");
      }
      if (orderType === "DELIVERY" && (!deliveryCustomerName || !deliveryCustomerPhone || !deliveryCustomerAddress)) {
        return toast.error("Please provide complete delivery details (Name, Phone, Address).");
      }
      if (orderType === "TAKEAWAY" && (!deliveryCustomerName || !deliveryCustomerPhone)) {
        return toast.error("Please provide takeaway customer details (Name, Phone).");
      }
    }

    setIsProcessing(true);

    let finalNotes = "";
    if (orderType === "DELIVERY") {
      finalNotes = `Customer: ${deliveryCustomerName}\nPhone: ${deliveryCustomerPhone}\nAddress: ${deliveryCustomerAddress}`;
    } else if (orderType === "TAKEAWAY") {
      finalNotes = `Customer: ${deliveryCustomerName}\nPhone: ${deliveryCustomerPhone}`;
    }

    try {
      const checkoutItems = cart.map((item) => {
        let finalNotes = item.notes || "";
        if (item.instructions) {
          finalNotes = finalNotes ? `${finalNotes} [${item.instructions}]` : `[${item.instructions}]`;
        }
        return {
          productId: item.productId || item.id,
          quantity: item.quantity,
          price: item.price,
          notes: finalNotes || null
        };
      });

      const res = await axios.patch(`/api/orders/${editingOrderId}`, {
        items: checkoutItems,
        totalAmount: total,
        paymentMethod: paymentMethod,
        discount: discountAmt,
        tax,
        deliveryCharges: (parseFloat(deliveryCharges) || 0), // custom charges input on the fly
        specialInstructions: specialInstructions || null,
        orderType,
        customerId: selectedCustomer && selectedCustomer !== "none" ? selectedCustomer : undefined,
        tableId: selectedTable && selectedTable !== "none" ? selectedTable : undefined,
        riderName: orderType === "DELIVERY" ? riderName : undefined,
        notes: finalNotes || null,
        status: isPending ? "PENDING" : "COMPLETED",
        paymentStatus: isPending ? "UNPAID" : "PAID",
      });

      const orderData = res.data;

      // Handle Kitchen Printing if pending
      if (isPending) {
        await triggerKitchenPrint(orderData, cart);
      }

      setLastOrder({
        ...orderData,
        items: cart,
        customer: customers.find((c) => c.id === selectedCustomer)
      });

      setCart([]);
      setDiscount("0");
      setDiscountType("AMOUNT");
      setDeliveryCharges("0");
      setSpecialInstructions("");
      setRiderName("");
      setDeliveryCustomerName("");
      setDeliveryCustomerPhone("");
      setDeliveryCustomerAddress("");
      setSelectedCustomer("");
      setSelectedTable("");
      setEditingOrderId(null);
      setDetailsSaved(false);

      if (!isPending) {
        setShowReceipt(true);
        toast.success("Order completed and paid!");
      } else {
        toast.success("Order updated in kitchen!");
      }
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Checkout update failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchOrdersLog = async () => {
    try {
      const res = await axios.get("/api/orders?limit=100", { withCredentials: true });
      setOrdersLogList(Array.isArray(res.data.orders) ? res.data.orders : []);
    } catch (err: any) {
      console.error("fetchOrdersLog error:", err);
      toast.error(`Failed to load orders log: ${err.response?.data?.error || err.message}`);
    }
  };
  // Automatically fetch orders log when the Orders Log dialog is opened
  useEffect(() => {
    if (showOrdersLog) {
      fetchOrdersLog();
    }
  }, [showOrdersLog]);
  const handleEditRunningOrder = (order: any) => {
    setEditingOrderId(order.id);
    setOrderType(order.orderType);
    setPaymentMethod(order.paymentMethod);
    setDiscountType("AMOUNT");
    setDiscount(String(order.discount || 0));
    setDeliveryCharges(String(order.deliveryCharges || 0));
    setSpecialInstructions(order.specialInstructions || "");
    setRiderName(order.riderName || "");
    setSelectedTable(order.tableId || "");
    setSelectedCustomer(order.customerId || "");

    // Parse delivery/takeaway customer details from order notes
    if (order.orderType === "DELIVERY" && order.notes) {
      const nameMatch = order.notes.match(/Customer:\s*(.*)/);
      const phoneMatch = order.notes.match(/Phone:\s*(.*)/);
      const addressMatch = order.notes.match(/Address:\s*(.*)/);

      setDeliveryCustomerName(nameMatch ? nameMatch[1].trim() : "");
      setDeliveryCustomerPhone(phoneMatch ? phoneMatch[1].trim() : "");
      setDeliveryCustomerAddress(addressMatch ? addressMatch[1].trim() : "");
      setDetailsSaved(true);
    } else if (order.orderType === "TAKEAWAY" && order.notes) {
      const nameMatch = order.notes.match(/Customer:\s*(.*)/);
      const phoneMatch = order.notes.match(/Phone:\s*(.*)/);

      setDeliveryCustomerName(nameMatch ? nameMatch[1].trim() : "");
      setDeliveryCustomerPhone(phoneMatch ? phoneMatch[1].trim() : "");
      setDeliveryCustomerAddress("");
      setDetailsSaved(true);
    } else {
      setDeliveryCustomerName("");
      setDeliveryCustomerPhone("");
      setDeliveryCustomerAddress("");
      setDetailsSaved(false);
    }

    // Map existing items back into cart correctly
    const mapped = order.items.map((it: any) => {
      const cartId = it.notes ? `${it.productId}-${it.notes}` : it.productId;

      let sizeNotes = it.notes || null;
      let instr = "";
      if (it.notes && it.notes.includes("[")) {
        const match = it.notes.match(/(.*)\s*\[(.*)\]/);
        if (match) {
          sizeNotes = match[1].trim() || null;
          instr = match[2].trim();
        } else {
          const onlyInstr = it.notes.match(/\[(.*)\]/);
          if (onlyInstr) {
            sizeNotes = null;
            instr = onlyInstr[1].trim();
          }
        }
      }

      return {
        id: cartId,
        productId: it.productId,
        name: sizeNotes ? `${it.product?.name} (${sizeNotes})` : (it.product?.name || "Product"),
        price: it.price,
        notes: sizeNotes,
        instructions: instr || undefined,
        quantity: it.quantity,
        originalQuantity: it.quantity
      };
    });
    setCart(mapped);
    setShowOrdersLog(false);
    toast.info(`Editing Running Order ${order.orderNumber}. Adjust items and click Update.`);
  };

  const handleTableSelect = (tableId: string) => {
    if (tableId === "none" || !tableId) {
      setSelectedTable("");
      return;
    }

    const table = tables.find((t) => t.id === tableId);
    if (table && table.status === "OCCUPIED") {
      const runningOrder = ordersLogList.find(
        (ord) => ord.tableId === tableId && ["PENDING", "PREPARING", "READY"].includes(ord.status)
      );

      if (runningOrder) {
        handleEditRunningOrder(runningOrder);
        toast.info(`Table "${table.name}" is occupied. Automatically loaded its running order!`);
        return;
      }
    }

    setSelectedTable(tableId);
  };

  const handlePrint = (orderToPrint?: any) => {
    const order = orderToPrint || lastOrder;
    if (!order) return;

    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Popup blocked! Please enable popups to print receipt.");
      return;
    }
    const businessName = tenantSettings?.name || "Cheesy Bite";

    const logoHtml = (!hasPharmacy && !isGym && tenantSettings?.logoUrl)
      ? `<img src="${tenantSettings.logoUrl}" style="max-width: 80px; max-height: 80px; margin: 0 auto 8px auto; display: block;" alt="Business Logo" />`
      : "";

    const titleHtml = (!hasPharmacy && !isGym)
      ? `<div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; text-transform: uppercase;">${businessName}</div>`
      : "";

    const receiptLabel = hasPharmacy
      ? "PHARMACY CASH RECEIPT"
      : isGym
        ? "GYM & FITNESS RECEIPT"
        : isBakery
          ? "BAKERY & CAFE RECEIPT"
          : "CASH RECEIPT";

    const tableName = order.tableId ? (tables.find(t => t.id === order.tableId)?.name || "") : "";
    const tableHtml = (order.orderType === "DINE_IN" && tableName)
      ? `<div style="border-top: 1px dashed #000000; padding-top: 6px; font-size: 11px; font-weight: bold; text-align: center; margin-bottom: 8px;">TABLE: ${tableName}</div>`
      : "";

    const itemsHtml = (order.items || []).map((item: any) => {
      const prodName = item.name || item.product?.name || "Product";
      const notesPart = item.notes ? ` (${item.notes})` : "";
      const fullName = prodName + notesPart;
      const qty = item.quantity;
      const totalStr = (item.price * qty).toFixed(2);
      const prodObj = products.find(p => p.id === (item.productId || item.id));
      const formulaHtml = (hasPharmacy && prodObj?.formula)
        ? `<div style="font-size: 8.5px; font-weight: bold; color: #555555; margin-left: 4px; font-style: italic;">Formula: ${prodObj.formula}</div>`
        : "";

      return `
        <div style="display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold;">
            <span style="width: 50%; text-align: left; word-break: break-all;">${fullName}</span>
            <span style="width: 25%; text-align: center;">${qty}</span>
            <span style="width: 25%; text-align: right;">${totalStr}</span>
          </div>
          ${formulaHtml}
        </div>
      `;
    }).join("");

    const subtotal = (order.totalAmount - (order.tax || 0) - (order.deliveryCharges || 0) + (order.discount || 0)).toFixed(2);
    const discountHtml = (order.discount > 0)
      ? `<div style="display: flex; justify-content: space-between; font-weight: bold;"><span>Discount:</span><span>-${order.discount.toFixed(2)}</span></div>`
      : "";
    const deliveryHtml = (order.deliveryCharges > 0)
      ? `<div style="display: flex; justify-content: space-between;"><span>Delivery Charges:</span><span>${order.deliveryCharges.toFixed(2)}</span></div>`
      : "";

    const addressHtml = tenantSettings?.receiptAddressString
      ? `<div style="margin-bottom: 2px;">Address: ${tenantSettings.receiptAddressString}</div>`
      : "";
    const whatsAppHtml = tenantSettings?.receiptWhatsAppString
      ? `<div style="margin-bottom: 4px;">WhatsApp: ${tenantSettings.receiptWhatsAppString}</div>`
      : "";
    const ntnHtml = tenantSettings?.ntn ? `<div style="font-size: 9px;">NTN: ${tenantSettings.ntn}</div>` : "";
    const strnHtml = tenantSettings?.strn ? `<div style="font-size: 9px;">STRN: ${tenantSettings.strn}</div>` : "";

    let paymentChannelsHtml = "";
    if (tenantSettings?.receiptEasyPaisaString || tenantSettings?.receiptJazzCashString || tenantSettings?.receiptRaastString || tenantSettings?.receiptBankString) {
      paymentChannelsHtml = `
        <div style="border-top: 1px dashed #000000; margin-top: 6px; padding-top: 4px;">
          <div style="font-weight: bold; text-transform: uppercase; margin-bottom: 3px;">Payment Channels:</div>
          ${tenantSettings.receiptEasyPaisaString ? `<div>EasyPaisa: ${tenantSettings.receiptEasyPaisaString}</div>` : ""}
          ${tenantSettings.receiptJazzCashString ? `<div>JazzCash: ${tenantSettings.receiptJazzCashString}</div>` : ""}
          ${tenantSettings.receiptRaastString ? `<div>Raast ID: ${tenantSettings.receiptRaastString}</div>` : ""}
          ${tenantSettings.receiptBankString ? `<div>Bank: ${tenantSettings.receiptBankString}</div>` : ""}
        </div>
      `;
    }

    const specialInstructionsHtml = order.specialInstructions
      ? `<div style="border-top: 1px dashed #000000; margin: 8px 0;"></div>
         <div style="font-size: 10px; font-weight: bold; text-align: left;">
           SPECIAL INSTRUCTION:<br/>
           <span style="font-size: 11px;">${order.specialInstructions}</span>
         </div>`
      : "";

    let deliveryTakeawayHtml = "";
    if (order.orderType === "DELIVERY" && order.notes) {
      const notesLines = order.notes.split("\n").map((line: string) => `<div style="font-weight: bold; line-height: 1.3;">${line}</div>`).join("");
      const riderHtml = order.riderName ? `<div style="margin-top: 4px; font-weight: bold; color: #333333;">Rider: ${order.riderName}</div>` : "";
      deliveryTakeawayHtml = `
        <div style="border-top: 1px dashed #000000; padding-top: 6px; font-size: 10px; text-align: left; margin-bottom: 8px;">
          <div style="font-weight: bold; font-size: 8px; color: #555555; text-transform: uppercase; letter-spacing: 0.05em;">DELIVERY TO:</div>
          ${notesLines}
          ${riderHtml}
        </div>
      `;
    } else if (order.orderType === "TAKEAWAY" && order.notes) {
      const notesLines = order.notes.split("\n").map((line: string) => `<div style="font-weight: bold; line-height: 1.3;">${line}</div>`).join("");
      deliveryTakeawayHtml = `
        <div style="border-top: 1px dashed #000000; padding-top: 6px; font-size: 10px; text-align: left; margin-bottom: 8px;">
          <div style="font-weight: bold; font-size: 8px; color: #555555; text-transform: uppercase; letter-spacing: 0.05em;">TAKEAWAY CUSTOMER:</div>
          ${notesLines}
        </div>
      `;
    }

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
            ${titleHtml}
            <div style="font-weight: bold; font-size: 11px; margin-bottom: 6px; text-transform: uppercase;">${receiptLabel}</div>
            Date: ${new Date(order.createdAt || Date.now()).toLocaleString()}<br/>
            Order #: ${order.orderNumber}<br/>
            Type: <span style="font-weight: bold;">${order.orderType.replace("_", " ")}</span><br/>
            Payment: <span style="font-weight: bold;">${(order.paymentStatus || order.status === "COMPLETED" ? "PAID" : "PENDING")}</span><br/>
            Cashier: <span style="font-weight: bold;">${currentUser?.name || "Cashier"}</span>
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
        
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${itemsHtml}
        </div>
        
        <div style="border-top: 1px dashed #000000; margin: 8px 0;"></div>
        
        <div style="display: flex; flex-direction: column; gap: 2px; font-size: 10px; font-weight: bold; text-align: right;">
          <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>${subtotal}</span></div>
          ${discountHtml}
          <div style="display: flex; justify-content: space-between;"><span>Tax:</span><span>${(order.tax || 0).toFixed(2)}</span></div>
          ${deliveryHtml}
        </div>
        
        <div style="border-top: 1px dashed #000000; margin: 8px 0;"></div>

        <div style="display: flex; justify-content: space-between; font-weight: 950; font-size: 14px;">
          <span>TOTAL:</span><span>PKR ${order.totalAmount.toFixed(2)}</span>
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
          <p style="font-weight: bold; margin: 0;">${hasPharmacy ? "GET WELL SOON!" : isGym ? "STAY FIT, STAY HEALTHY!" : isBakery ? "THANK YOU FOR SWEETENING YOUR DAY!" : "THANK YOU FOR YOUR VISIT"}</p>
          ${hasPharmacy ? `<p style="font-size: 8px; margin: 4px 0 0 0;">Medicines are non-refundable/refundable as per law.</p>` : ""}
          ${isGym ? `<p style="font-size: 8px; margin: 4px 0 0 0;">Memberships & items are non-refundable.</p>` : ""}
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
    const activeCashierIp = (typeof window !== "undefined" ? localStorage.getItem("cashierPrinterIp") : "") || tenantSettings?.cashierPrinterIp;
    const activeCashierPort = (typeof window !== "undefined" ? localStorage.getItem("cashierPrinterPort") : "") || tenantSettings?.cashierPrinterPort || 9100;

    if (activeCashierIp) {
      try {
        const res = await axios.post("/api/print/bill", {
          ip: activeCashierIp,
          port: activeCashierPort,
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
        handlePrint(order);
      }
    } else {
      handlePrint(order);
    }
  };

  const filteredOrdersLog = ordersLogList.filter((ord) => {
    // 1. Status Filter
    if (ordersFilterStatus === "ACTIVE") {
      if (ord.status === "COMPLETED" || ord.status === "CANCELLED") return false;
    } else if (ordersFilterStatus === "COMPLETED") {
      if (ord.status !== "COMPLETED") return false;
    } else if (ordersFilterStatus === "CANCELLED") {
      if (ord.status !== "CANCELLED") return false;
    }

    // 2. Date Filter
    const orderDate = new Date(ord.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    if (ordersFilterDate === "TODAY") {
      return orderDate >= today;
    } else if (ordersFilterDate === "YESTERDAY") {
      return orderDate >= yesterday && orderDate < today;
    } else if (ordersFilterDate === "WEEK") {
      return orderDate >= oneWeekAgo;
    }

    return true;
  });

  const [showMobileCart, setShowMobileCart] = useState(false);

  const tenantModuleList = tenantSettings?.modules || currentUser?.tenant?.modules || [];
  const activeModuleNames = tenantModuleList.map((tm: any) => {
    if (typeof tm === "string") return tm;
    return tm.module?.name || tm.name || tm.code || tm.moduleId || "";
  }).filter(Boolean);

  const hasPharmacy = activeModuleNames.includes("PHARMACY_SPECIAL");
  const isGym = activeModuleNames.includes("GYM_FITNESS_PRO");
  const isBakery = activeModuleNames.includes("BAKERY_PRO");
  const isExplicitRestaurant = activeModuleNames.includes("RESTAURANT_PRO");

  const isRestaurant = isExplicitRestaurant || isBakery;

  const filteredProducts = products.filter((p) => {
    if (isGym && (p.type === "SERVICE" || p.name.toLowerCase().includes("membership") || p.name.toLowerCase().includes("plan") || p.name.toLowerCase().includes("admission"))) {
      return false;
    }

    const pName = String(p.name || "");
    const pBarcode = String(p.barcode || "");
    const pFormula = String(p.formula || "");
    const matchesSearch =
      pName.toLowerCase().includes(String(search || "").toLowerCase()) ||
      pBarcode.includes(String(search || "")) ||
      (hasPharmacy && pFormula.toLowerCase().includes(String(search || "").toLowerCase()));

    if (selectedCategory === "DEALS") {
      return matchesSearch && p.type === "DEAL";
    }

    const matchesCategory = selectedCategory === "ALL" || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory && p.type !== "DEAL";
  });

  if (loading) {
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 animate-bounce">
            <ShoppingCart className="w-10 h-10" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-white animate-pulse" />
        </div>
        <h3 className="mt-8 text-2xl font-black text-slate-900 tracking-tight">Initializing PoS...</h3>
        <p className="mt-2 text-slate-500 font-bold">Synchronizing products and inventory data.</p>
        <div className="mt-8 flex gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-3 h-3 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-3 h-3 rounded-full bg-blue-600 animate-bounce"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] sm:h-[calc(100vh-96px)] flex flex-col lg:flex-row gap-4 overflow-hidden relative">
      {/* Left: Products */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all",
        showMobileCart ? "hidden lg:flex" : "flex"
      )}>
        <div className="p-3.5 sm:p-4 border-b border-slate-100 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-blue-600" /> Products
            </h2>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchOrdersLog();
                  setShowOrdersLog(true);
                }}
                className="h-9 px-4 rounded-xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all flex items-center"
              >
                <History className="w-4 h-4 mr-2 text-blue-600" /> Orders Log
              </Button>
              <Button
                size="sm"
                onClick={() => setEodModalOpen(true)}
                className="h-9 px-4 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100 flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                Daily Closing
              </Button>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm"
                  onClick={() => setViewMode("grid")}
                  className={cn("h-8 px-3 rounded-lg", viewMode === "grid" && "bg-white shadow-sm")}>
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm"
                  onClick={() => setViewMode("list")}
                  className={cn("h-8 px-3 rounded-lg", viewMode === "list" && "bg-white shadow-sm")}>
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-start w-full">
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => {
                if (categoriesRef.current) {
                  categoriesRef.current.scrollBy({ left: -200, behavior: "smooth" });
                }
              }}
              className="h-9 w-9 rounded-xl border-slate-200 bg-white shrink-0 mr-1.5 flex items-center justify-center shadow-sm mt-1"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </Button>

            <div ref={categoriesRef} className="flex-1 flex items-start gap-2 overflow-x-auto py-1 scrollbar-hide">
              <Button size="sm" variant={selectedCategory === "ALL" ? "default" : "outline"}
                onClick={() => setSelectedCategory("ALL")}
                className={cn("rounded-xl font-bold h-9 px-4 shrink-0", selectedCategory === "ALL" ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-white text-slate-600 border-slate-200")}>
                All
              </Button>
              {isRestaurant && (
                <Button size="sm" variant={selectedCategory === "DEALS" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("DEALS")}
                  className={cn("rounded-xl font-bold h-9 px-4 shrink-0 text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 border-amber-200", selectedCategory === "DEALS" ? "bg-amber-500 text-white shadow-lg shadow-amber-100" : "")}>
                  Deals
                </Button>
              )}
              {categories.map((cat) => (
                <Button key={cat.id} size="sm" variant={selectedCategory === cat.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn("rounded-xl font-bold h-9 px-4 shrink-0", selectedCategory === cat.id ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-white text-slate-600 border-slate-200")}>
                  {cat.name}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => {
                if (categoriesRef.current) {
                  categoriesRef.current.scrollBy({ left: 200, behavior: "smooth" });
                }
              }}
              className="h-9 w-9 rounded-xl border-slate-200 bg-white shrink-0 ml-1.5 flex items-center justify-center shadow-sm mt-1"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 sm:top-3 w-5 h-5 text-slate-400" />
            <Input placeholder={hasPharmacy ? "Search medicine, formula or scan barcode..." : isRestaurant ? (isBakery ? "Search cakes, bakery items or scan barcode..." : "Search food, deals or scan barcode...") : isGym ? "Search memberships, supplements, drinks or scan barcode..." : "Search products or scan barcode..."} className="pl-10 h-10 sm:h-11 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 scroll-left">
          <div style={{ direction: "ltr" }}>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => <div key={i} className="h-32 sm:h-36 rounded-2xl bg-slate-50 animate-pulse" />)}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 font-medium gap-3">
                <Package className="w-10 h-10 opacity-20" />
                <p>No products found.</p>
              </div>
            ) : (
              <div className={cn(
                viewMode === "grid"
                  ? (hasPharmacy
                    ? "grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-8 gap-2"
                    : "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4")
                  : "flex flex-col gap-2"
              )}>
                {(filteredProducts || []).map((product) => {
                  const sizesList = product.sizes ? (typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes) : [];
                  const hasVariants = sizesList && sizesList.length > 0;
                  const totalStock = hasVariants
                    ? sizesList.reduce((acc: number, s: any) => acc + (parseInt(s.stock) || 0), 0)
                    : parseInt(product.stock || 0);

                  return (
                    <motion.div key={product.id} whileTap={{ scale: 0.97 }}
                      onClick={() => addToCart(product)}
                      className={cn(
                        "cursor-pointer group transition-all relative flex flex-col justify-between",
                        product.type !== "DEAL" && totalStock <= 0 && "opacity-50 cursor-not-allowed",
                        viewMode === "grid"
                          ? (hasPharmacy
                            ? "p-2 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md h-32"
                            : "p-3 sm:p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50")
                          : "p-4 flex items-center justify-between rounded-xl border border-slate-100 hover:border-blue-200"
                      )}>
                      {product.type !== "DEAL" && totalStock <= 5 && totalStock > 0 && (
                        <span className="absolute top-1.5 right-1.5 text-[8px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">LOW</span>
                      )}
                      {product.type !== "DEAL" && totalStock <= 0 && (
                        <span className="absolute top-1.5 right-1.5 text-[8px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">OUT</span>
                      )}
                      <div className={cn(viewMode === "list" && "flex items-center gap-4")}>
                        {!hasPharmacy && (
                          <div className={cn("rounded-xl bg-white flex items-center justify-center text-slate-300 overflow-hidden border border-slate-50",
                            viewMode === "grid" ? "h-20 sm:h-24 w-full mb-2 sm:mb-3" : "h-11 w-11 shrink-0")}>
                            {product.image
                              ? <img src={product.image} className="h-full w-full object-contain p-1" alt="" />
                              : <ShoppingCart className="w-5 h-5 opacity-30" />}
                          </div>
                        )}
                        <div>
                          <h3 className={cn("font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-left leading-snug",
                            hasPharmacy ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm")}>{product.name}</h3>
                          {(viewMode === "list" || hasPharmacy) && (
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 text-left line-clamp-1">
                              {product.category?.name || "No Category"}
                            </p>
                          )}
                          {hasPharmacy && product.formula && (
                            <p className="text-[9px] text-blue-500/80 font-medium text-left truncate mt-0.5" title={product.formula}>
                              {product.formula}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={cn(viewMode === "grid" ? "mt-1.5 text-left" : "text-right shrink-0")}>
                        <p className={cn("font-black text-blue-600", hasPharmacy ? "text-xs" : "text-sm sm:text-base")}>
                          {hasVariants ? `From PKR ${Math.min(...sizesList.map((s: any) => parseFloat(s.price) || 0)).toFixed(2)}` : `PKR ${parseFloat(product.price || 0).toFixed(2)}`}
                        </p>
                        {viewMode === "grid" && !hasPharmacy && (
                          product.type === "DEAL" ? (
                            <span className="inline-block text-[9px] sm:text-[10px] font-black uppercase tracking-wider mt-0.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                              Deal
                            </span>
                          ) : hasVariants ? (
                            <span className="inline-block text-[9px] sm:text-[10px] font-black uppercase tracking-wider mt-0.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                              📐 {sizesList.length} Sizes
                            </span>
                          ) : (
                            <p className={cn("text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-0.5",
                              parseInt(product.stock || 0) > 10 ? "text-emerald-500" : parseInt(product.stock || 0) > 0 ? "text-amber-500" : "text-rose-500")}>
                              {parseInt(product.stock || 0)} left
                            </p>
                          )
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className={cn(
        "w-full lg:w-[360px] xl:w-[380px] h-full flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl overflow-hidden transition-all",
        !showMobileCart ? "hidden lg:flex" : "flex absolute inset-0 z-10 lg:relative lg:inset-auto"
      )}>
        {/* Cart Header */}
        <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden h-6 w-6 rounded-lg" onClick={() => setShowMobileCart(false)}>
              <X className="w-3.5 h-3.5 text-slate-400" />
            </Button>
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5 leading-none">
                <ShoppingCart className="w-4 h-4 text-blue-600" /> Cart
              </h2>
              <span className="text-[8px] text-slate-400 font-black tracking-wider uppercase truncate max-w-[160px]">
                {currentUser?.name || "Cashier"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge className="bg-blue-600 text-white rounded-full px-1.5 h-4 min-w-4 text-[10px] flex items-center justify-center font-bold">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </Badge>
            {cart.length > 0 && (
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-slate-400 hover:text-rose-500"
                onClick={() => setCart([])}>
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Order Type & Tables (Conditional for Restaurant Module) */}
        {isRestaurant && (
          <div className="px-3.5 py-2.5 border-b border-slate-50 space-y-2 shrink-0">
            <div className="space-y-2">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {["DINE_IN", "TAKEAWAY", "DELIVERY"].map((type) => (
                  <Button
                    key={type}
                    variant={orderType === type ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setOrderType(type);
                      if (type !== "DINE_IN") setSelectedTable("");
                      setDetailsSaved(false);
                    }}
                    className={cn(
                      "flex-1 h-8 rounded-lg font-bold text-[10px] tracking-tight transition-all",
                      orderType === type ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:bg-white/50"
                    )}
                  >
                    {type.replace("_", " ")}
                  </Button>
                ))}
              </div>

              {orderType === "DINE_IN" && (
                <div className="flex gap-2 items-center">
                  <Select value={selectedTable} onValueChange={handleTableSelect}>
                    <SelectTrigger className="flex-1 h-9 rounded-xl border-slate-200 text-xs">
                      <Utensils className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      <SelectValue placeholder="Select Seat/Table" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Table</SelectItem>
                      {tables.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} {t.status === "OCCUPIED" ? "🔴 (Occupied - Edit)" : "🟢 (Free)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTable && selectedTable !== "none" && selectedTable !== "" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const tbl = tables.find(t => t.id === selectedTable);
                        if (tbl) {
                          setNewTableName(tbl.name);
                          setIsRenamingTable(true);
                        }
                      }}
                      className="h-9 px-2.5 rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-all font-black text-xs shrink-0 flex items-center gap-1 text-slate-700"
                      title="Rename & Free Table"
                    >
                      ✏️ Rename
                    </Button>
                  )}
                </div>
              )}

              {orderType === "TAKEAWAY" && (
                detailsSaved ? (
                  <div
                    onClick={() => setDetailsSaved(false)}
                    className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl border border-blue-100 shadow-sm cursor-pointer transition-all flex items-center justify-between animate-in fade-in"
                  >
                    <div className="text-left flex-1 min-w-0 mr-2">
                      <p className="text-[9px] font-black text-blue-600/70 uppercase tracking-widest leading-none mb-1">Takeaway Customer</p>
                      <p className="text-xs font-black truncate leading-tight">
                        {deliveryCustomerName || "Guest"} {deliveryCustomerPhone && `• ${deliveryCustomerPhone}`}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="h-6 px-2 rounded-lg text-[10px] font-black text-blue-600 hover:bg-blue-200/50 flex items-center shrink-0">
                      ✏️ Edit
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-inner animate-in slide-in-from-top-2 duration-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Takeaway Customer Details</p>

                    <Input
                      placeholder="Customer Name"
                      className="h-9 rounded-xl border-slate-200 text-xs bg-white font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                      value={deliveryCustomerName}
                      onChange={(e) => setDeliveryCustomerName(e.target.value)}
                    />
                    <Input
                      placeholder="Phone Number"
                      className="h-9 rounded-xl border-slate-200 text-xs bg-white font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                      value={deliveryCustomerPhone}
                      onChange={(e) => setDeliveryCustomerPhone(e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={() => setDetailsSaved(true)}
                      className="w-full h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center mt-1 active:scale-95 transition-all"
                    >
                      ✓ Save Details
                    </Button>
                  </div>
                )
              )}

              {orderType === "DELIVERY" && (
                detailsSaved ? (
                  <div
                    onClick={() => setDetailsSaved(false)}
                    className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl border border-blue-100 shadow-sm cursor-pointer transition-all flex items-center justify-between animate-in fade-in"
                  >
                    <div className="text-left flex-1 min-w-0 mr-2">
                      <p className="text-[9px] font-black text-blue-600/70 uppercase tracking-widest leading-none mb-1">Delivery Customer</p>
                      <p className="text-xs font-black truncate leading-tight">
                        {deliveryCustomerName || "Guest"} {deliveryCustomerPhone && `• ${deliveryCustomerPhone}`}
                      </p>
                      <p className="text-[10px] font-medium text-slate-600 truncate leading-normal mt-0.5">
                        Address: {deliveryCustomerAddress || "Not specified"}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="h-6 px-2 rounded-lg text-[10px] font-black text-blue-600 hover:bg-blue-200/50 flex items-center shrink-0">
                      ✏️ Edit
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-inner animate-in slide-in-from-top-2 duration-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Delivery Customer Details</p>

                    <Input
                      placeholder="Customer Name"
                      className="h-9 rounded-xl border-slate-200 text-xs bg-white font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                      value={deliveryCustomerName}
                      onChange={(e) => setDeliveryCustomerName(e.target.value)}
                    />
                    <Input
                      placeholder="Phone Number"
                      className="h-9 rounded-xl border-slate-200 text-xs bg-white font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                      value={deliveryCustomerPhone}
                      onChange={(e) => setDeliveryCustomerPhone(e.target.value)}
                    />
                    <Input
                      placeholder="Complete Delivery Address"
                      className="h-9 rounded-xl border-slate-200 text-xs bg-white font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                      value={deliveryCustomerAddress}
                      onChange={(e) => setDeliveryCustomerAddress(e.target.value)}
                    />

                    <div className="pt-1.5 border-t border-slate-200/60 mt-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Rider Assignment</p>
                      <Input
                        placeholder="Rider Name / Courier Info"
                        className="h-9 rounded-xl border-slate-200 text-xs bg-white font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                        value={riderName}
                        onChange={(e) => setRiderName(e.target.value)}
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => setDetailsSaved(true)}
                      className="w-full h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center mt-1 active:scale-95 transition-all"
                    >
                      ✓ Save Details
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-2.5 space-y-2 scroll-left">
          <div style={{ direction: "ltr" }} className="space-y-2 h-full">
            <AnimatePresence>
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-1.5 py-4" style={{ direction: "ltr" }}>
                  <ShoppingCart className="w-10 h-10 opacity-20" />
                  <p className="font-bold text-xs">Cart is empty</p>
                  <p className="text-[10px]">Select products from the left</p>
                </div>
              ) : (
                cart.map((item) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100" style={{ direction: "ltr" }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-xs line-clamp-1">{item.name}</p>
                      <p className="text-[11px] font-bold text-blue-600">PKR {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 shadow-sm border border-slate-100">
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-5 text-center font-bold text-slate-900 text-xs">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-rose-400 hover:bg-rose-50"
                      onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Totals & Checkout */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 space-y-1.5 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-blue-300">
              <div className="flex bg-slate-100 p-0.5 rounded-md shrink-0">
                <Button
                  type="button"
                  variant={discountType === "AMOUNT" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setDiscountType("AMOUNT");
                    setDiscount("0");
                  }}
                  className={cn(
                    "h-5 px-2 rounded font-black text-[10px] transition-all duration-200",
                    discountType === "AMOUNT" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                  )}
                >
                  PKR
                </Button>
                <Button
                  type="button"
                  variant={discountType === "PERCENT" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setDiscountType("PERCENT");
                    setDiscount("0");
                  }}
                  className={cn(
                    "h-5 px-2 rounded font-black text-[10px] transition-all duration-200",
                    discountType === "PERCENT" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                  )}
                >
                  % Off
                </Button>
              </div>
              <div className="relative flex-1">
                <Tag className="absolute left-1.5 top-1.5 w-3 h-3 text-slate-400 transition-colors" />
                <Input
                  type="number"
                  min="0"
                  placeholder={discountType === "PERCENT" ? "Enter % (e.g. 10)" : "Enter PKR amount"}
                  className="pl-6 h-6 rounded border-none bg-transparent text-[11px] focus:ring-0 font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={discount === "0" ? "" : discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
                {parseFloat(discount) > 0 && (
                  <button
                    type="button"
                    onClick={() => setDiscount("0")}
                    className="absolute right-1.5 top-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Clear discount"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Preset Offers/Discounts */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider shrink-0 select-none">Offers:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setDiscountType("PERCENT"); setDiscount("5"); }}
                className={cn(
                  "h-4 px-1.5 rounded text-[8.5px] font-black transition-all border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95 shrink-0",
                  discountType === "PERCENT" && discount === "5" && "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                )}
              >
                5%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setDiscountType("PERCENT"); setDiscount("10"); }}
                className={cn(
                  "h-4 px-1.5 rounded text-[8.5px] font-black transition-all border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95 shrink-0",
                  discountType === "PERCENT" && discount === "10" && "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                )}
              >
                10%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setDiscountType("PERCENT"); setDiscount("15"); }}
                className={cn(
                  "h-4 px-1.5 rounded text-[8.5px] font-black transition-all border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95 shrink-0",
                  discountType === "PERCENT" && discount === "15" && "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                )}
              >
                15%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setDiscountType("PERCENT"); setDiscount("20"); }}
                className={cn(
                  "h-4 px-1.5 rounded text-[8.5px] font-black transition-all border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95 shrink-0",
                  discountType === "PERCENT" && discount === "20" && "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                )}
              >
                20%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setDiscountType("AMOUNT"); setDiscount("100"); }}
                className={cn(
                  "h-4 px-1.5 rounded text-[8.5px] font-black transition-all border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95 shrink-0",
                  discountType === "AMOUNT" && discount === "100" && "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                )}
              >
                Rs 100
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setDiscountType("AMOUNT"); setDiscount("500"); }}
                className={cn(
                  "h-4 px-1.5 rounded text-[8.5px] font-black transition-all border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95 shrink-0",
                  discountType === "AMOUNT" && discount === "500" && "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                )}
              >
                Rs 500
              </Button>
            </div>
            {/* Delivery Charges (Custom Input) */}
            {orderType === "DELIVERY" && (
              <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider shrink-0">Rider Charges:</span>
                <Input
                  type="number"
                  min="0"
                  placeholder="Delivery Charges (e.g. 150)"
                  className="h-6 border-none bg-transparent text-[11px] focus:ring-0 font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                  value={deliveryCharges}
                  onChange={(e) => setDeliveryCharges(e.target.value)}
                />
              </div>
            )}

            {/* Special Instructions (Optional for Restaurant) */}
            {isRestaurant && (
              <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider shrink-0">Instruction:</span>
                <Input
                  type="text"
                  placeholder="Special instructions (e.g. topping, extra spicy)"
                  className="h-6 border-none bg-transparent text-[11px] focus:ring-0 font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-0.5 text-[11px] font-medium leading-tight">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span><span>PKR {subtotal.toFixed(2)}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount</span><span>-PKR {discountAmt.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Tax ({paymentMethod === "CASH" ? `${cashTaxRate}%` : `${cardTaxRate}%`})</span><span>PKR {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
              <span>Total</span><span>PKR {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex bg-slate-200/50 p-0.5 rounded-lg">
              <Button variant={paymentMethod === "CASH" ? "default" : "ghost"} size="sm"
                onClick={() => setPaymentMethod("CASH")}
                className={cn("flex-1 h-7 rounded-md font-bold text-[11px] flex items-center justify-center", paymentMethod === "CASH" && "bg-white text-slate-900 shadow-sm")}>
                <Banknote className="w-3 h-3 mr-1 text-emerald-600" /> Cash ({cashTaxRate}%)
              </Button>
              <Button variant={paymentMethod === "CARD" ? "default" : "ghost"} size="sm"
                onClick={() => setPaymentMethod("CARD")}
                className={cn("flex-1 h-7 rounded-md font-bold text-[11px] flex items-center justify-center", paymentMethod === "CARD" && "bg-white text-slate-900 shadow-sm")}>
                <CreditCard className="w-3 h-3 mr-1 text-blue-600" /> Card ({cardTaxRate}%)
              </Button>
            </div>

            {editingOrderId ? (
              <div className="space-y-1">
                {isRestaurant ? (
                  <div className="flex gap-1.5">
                    <Button disabled={isProcessing || cart.length === 0} onClick={() => handleUpdateOrder(true)}
                      className="flex-grow h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1">
                      Update Running
                    </Button>
                    <Button disabled={isProcessing || cart.length === 0} onClick={() => handleUpdateOrder(false)}
                      className="flex-grow h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1">
                      Pay & Complete
                    </Button>
                  </div>
                ) : (
                  <Button disabled={isProcessing || cart.length === 0} onClick={() => handleUpdateOrder(false)}
                    className="w-full h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1">
                    Pay & Complete
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setEditingOrderId(null);
                    setCart([]);
                    setDiscount("0");
                    setDiscountType("AMOUNT");
                    setRiderName("");
                    setDeliveryCustomerName("");
                    setDeliveryCustomerPhone("");
                    setDeliveryCustomerAddress("");
                    setSelectedTable("");
                    setSelectedCustomer("");
                    toast.info("Cleared editing mode.");
                  }}
                  className="w-full h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px]"
                >
                  Cancel Edit Mode
                </Button>
              </div>
            ) : (
              isRestaurant ? (
                <div className="flex gap-1.5">
                  <Button disabled={isProcessing || cart.length === 0} onClick={() => handleCheckout(true)}
                    className="flex-1 h-8 sm:h-9 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1">
                    Send to Kitchen
                  </Button>
                  <Button disabled={isProcessing || cart.length === 0} onClick={() => handleCheckout(false)}
                    className="flex-1 h-8 sm:h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1">
                    Pay & Complete
                  </Button>
                </div>
              ) : (
                <Button disabled={isProcessing || cart.length === 0} onClick={() => handleCheckout(false)}
                  className="w-full h-8 sm:h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1">
                  Pay & Complete
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Button for Mobile */}
      {!showMobileCart && cart.length > 0 && (
        <motion.div
          initial={{ y: 100 }} animate={{ y: 0 }}
          className="fixed bottom-6 right-6 lg:hidden z-20"
        >
          <Button
            onClick={() => setShowMobileCart(true)}
            className="h-14 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-2xl shadow-blue-200 flex items-center gap-3"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </div>
            <div className="text-left">
              <p className="text-[10px] opacity-70 uppercase tracking-wider leading-none">View Cart</p>
              <p className="text-lg leading-none mt-1">PKR {total.toFixed(2)}</p>
            </div>
          </Button>
        </motion.div>
      )}

      {/* Sizing Modal Selection */}
      <Dialog open={!!selectedSizingProduct} onOpenChange={() => setSelectedSizingProduct(null)}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-6 bg-white border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Select Size / Variant</DialogTitle>
            <p className="text-sm font-semibold text-slate-400 mt-1">Please select the size for {selectedSizingProduct?.name}</p>
          </DialogHeader>
          {selectedSizingProduct && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-2.5">
                {(() => {
                  const sizesList = selectedSizingProduct.sizes ? (typeof selectedSizingProduct.sizes === "string" ? JSON.parse(selectedSizingProduct.sizes) : selectedSizingProduct.sizes) : [];
                  return sizesList.map((sz: any, idx: number) => (
                    <Button
                      key={idx}
                      variant="outline"
                      disabled={sz.stock !== undefined && parseInt(sz.stock) <= 0}
                      className={cn(
                        "h-16 rounded-2xl border-slate-100 bg-slate-50/50 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center justify-between px-6 group",
                        sz.stock !== undefined && parseInt(sz.stock) <= 0 && "opacity-50 cursor-not-allowed bg-slate-100/50"
                      )}
                      onClick={() => addSizeToCart(selectedSizingProduct, sz)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-black text-slate-900 group-hover:text-blue-600 text-base">{sz.sizeName}</span>
                        {sz.stock !== undefined && (
                          <span className={cn("text-[10px] font-bold uppercase mt-0.5",
                            parseInt(sz.stock) > 10 ? "text-emerald-500" : parseInt(sz.stock) > 0 ? "text-amber-500" : "text-rose-500"
                          )}>
                            {parseInt(sz.stock) > 0 ? `${sz.stock} left` : "Out of Stock"}
                          </span>
                        )}
                      </div>
                      <span className="font-black text-blue-600 text-base">PKR {parseFloat(sz.price).toFixed(2)}</span>
                    </Button>
                  ));
                })()}
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedSizingProduct(null)}
                className="w-full h-12 rounded-xl text-slate-500 font-bold hover:bg-slate-50"
              >
                Cancel
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rename Table Dialog */}
      <Dialog open={isRenamingTable} onOpenChange={setIsRenamingTable}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-6 bg-white border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Rename & Free Table</DialogTitle>
            <p className="text-xs text-slate-500 mt-1">Change name of table to free it up immediately (like pending/freeing table in iPOS).</p>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <Input
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="Enter new table name"
              className="h-12 rounded-xl"
            />
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (!newTableName.trim()) return toast.error("Table name cannot be empty");
                  try {
                    await axios.patch(`/api/tables/${selectedTable}`, {
                      name: newTableName,
                      status: "AVAILABLE",
                      isFree: true
                    });
                    toast.success("Table renamed & freed!");
                    setIsRenamingTable(false);
                    loadData();
                  } catch {
                    toast.error("Failed to rename table");
                  }
                }}
                className="flex-grow h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Save & Free Table
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsRenamingTable(false)}
                className="h-11 rounded-xl font-bold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customize Deal Dialog */}
      <Dialog open={customizingDealProduct !== null} onOpenChange={(open) => { if (!open) setCustomizingDealProduct(null); }}>
        <DialogContent className="sm:max-w-[420px] rounded-[2rem] p-6 bg-white border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
              ✨ Customize {customizingDealProduct?.name}
            </DialogTitle>
            <p className="text-slate-400 text-xs font-medium mt-1">
              Select flavors/sizes for items in this deal. Fixed Deal Price: PKR {parseFloat(customizingDealProduct?.price || 0).toFixed(2)}
            </p>
          </DialogHeader>

          <div className="space-y-4 my-2 max-h-[50vh] overflow-y-auto pr-1">
            {customizingDealProduct?.dealItems?.map((di: any) => {
              if (di.productId) {
                // Specific Product
                const sizes = di.product?.sizes ? (typeof di.product.sizes === "string" ? JSON.parse(di.product.sizes) : di.product.sizes) : [];
                if (!sizes || sizes.length === 0) {
                  return (
                    <div key={di.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{di.product?.name}</p>
                        <p className="text-[10px] text-slate-400">Fixed ingredient (Qty: {di.quantity})</p>
                      </div>
                      <Badge className="bg-slate-200 text-slate-600 font-bold text-[10px] hover:bg-slate-200">Standard</Badge>
                    </div>
                  );
                }

                return (
                  <div key={di.id} className="space-y-1.5 p-3.5 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                    <label className="text-xs font-black text-slate-700 block">
                      Choose Size for {di.product?.name} (Qty: {di.quantity})
                    </label>
                    <select
                      className="w-full h-10 rounded-xl bg-white border border-slate-200 px-3 focus:border-blue-500 transition-all outline-none font-bold text-xs cursor-pointer text-slate-800"
                      value={dealSelections[di.product.id] || ""}
                      onChange={(e) => setDealSelections({ ...dealSelections, [di.product.id]: e.target.value })}
                    >
                      <option value="">Select size...</option>
                      {sizes.map((sz: any) => (
                        <option key={sz.sizeName} value={sz.sizeName}>
                          {sz.sizeName} {sz.stock !== undefined && `(${sz.stock} left)`}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              } else if (di.categoryId) {
                // Category Option Selection
                const catProds = products.filter(p => p.categoryId === di.categoryId);
                const selectedProdId = dealSelections[di.id + "_prod"] || "";
                const selectedProd = products.find(p => p.id === selectedProdId);
                const sizes = selectedProd?.sizes ? (typeof selectedProd.sizes === "string" ? JSON.parse(selectedProd.sizes) : selectedProd.sizes) : [];

                const categoryObj = categories.find(c => c.id === di.categoryId);
                const displayCategoryName = categoryObj?.name || di.category?.name || "Flavor";

                return (
                  <div key={di.id} className="space-y-3 p-4 bg-amber-50/40 rounded-2xl border border-amber-100/40">
                    <label className="text-xs font-black text-slate-700 block">
                      Choose {displayCategoryName} (Qty: {di.quantity})
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Product Selector */}
                      <select
                        className="w-full h-10 rounded-xl bg-white border border-slate-200 px-3 focus:border-blue-500 transition-all outline-none font-bold text-xs cursor-pointer text-slate-800"
                        value={selectedProdId}
                        onChange={(e) => {
                          const val = e.target.value;
                          const nextSelections = { ...dealSelections, [di.id + "_prod"]: val };
                          const selProd = products.find(p => p.id === val);
                          const selSizes = selProd?.sizes ? (typeof selProd.sizes === "string" ? JSON.parse(selProd.sizes) : selProd.sizes) : [];
                          if (selSizes.length > 0) {
                            nextSelections[di.id + "_size"] = selSizes[0].sizeName;
                          } else {
                            nextSelections[di.id + "_size"] = "Standard";
                          }
                          setDealSelections(nextSelections);
                        }}
                      >
                        <option value="">Select {displayCategoryName.toLowerCase()}...</option>
                        {catProds.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>

                      {/* Size Selector */}
                      <select
                        className="w-full h-10 rounded-xl bg-white border border-slate-200 px-3 focus:border-blue-500 transition-all outline-none font-bold text-xs cursor-pointer text-slate-800 disabled:opacity-50"
                        value={dealSelections[di.id + "_size"] || ""}
                        onChange={(e) => setDealSelections({ ...dealSelections, [di.id + "_size"]: e.target.value })}
                        disabled={!selectedProdId}
                      >
                        {sizes.length > 0 ? (
                          sizes.map((sz: any) => (
                            <option key={sz.sizeName} value={sz.sizeName}>
                              {sz.sizeName} {sz.stock !== undefined && `(${sz.stock} left)`}
                            </option>
                          ))
                        ) : (
                          <option value="Standard">Standard</option>
                        )}
                      </select>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>

          <div className="flex gap-3 pt-3">
            <Button
              onClick={() => {
                const selectionNotes = customizingDealProduct.dealItems.map((di: any) => {
                  if (di.productId) {
                    const selectedVal = dealSelections[di.product.id];
                    if (selectedVal) {
                      return `${di.product.name} (${selectedVal})`;
                    }
                  } else if (di.categoryId) {
                    const selectedProdId = dealSelections[di.id + "_prod"];
                    const selectedSizeName = dealSelections[di.id + "_size"] || "Standard";
                    const selectedProd = products.find(p => p.id === selectedProdId);
                    if (selectedProd) {
                      return `${selectedProd.name} (${selectedSizeName})`;
                    }
                  }
                  return null;
                }).filter(Boolean).join(", ");

                const cartId = selectionNotes ? `${customizingDealProduct.id}-${selectionNotes}` : customizingDealProduct.id;
                const existing = cart.find((item) => item.id === cartId);

                if (existing) {
                  setCart(cart.map((item) =>
                    item.id === cartId ? { ...item, quantity: item.quantity + 1 } : item
                  ));
                } else {
                  setCart([...cart, {
                    ...customizingDealProduct,
                    id: cartId,
                    productId: customizingDealProduct.id,
                    name: customizingDealProduct.name,
                    price: parseFloat(customizingDealProduct.price) || 0,
                    notes: selectionNotes || null,
                    quantity: 1
                  }]);
                }

                toast.success(`${customizingDealProduct.name} customized and added to cart!`);
                setCustomizingDealProduct(null);
              }}
              className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center active:scale-95 transition-all"
            >
              ✓ Add Combo
            </Button>
            <Button
              variant="outline"
              onClick={() => setCustomizingDealProduct(null)}
              className="flex-1 h-11 rounded-xl font-bold border-slate-200 hover:bg-slate-50 text-xs"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Orders Log Dialog */}
      <Dialog open={showOrdersLog} onOpenChange={setShowOrdersLog}>
        <DialogContent className="sm:max-w-[850px] rounded-[2.5rem] p-8 max-h-[85vh] overflow-hidden flex flex-col bg-white border-none shadow-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-between pr-4">
              <span>Orders History & Active Seats</span>
              <Button size="sm" variant="ghost" onClick={fetchOrdersLog} className="rounded-xl font-bold h-9">
                Refresh
              </Button>
            </DialogTitle>
            <p className="text-slate-500 font-semibold mt-1">Manage running tables, delivery riders, and reprint receipt bills.</p>
          </DialogHeader>

          {/* Filtering Tabs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center py-2 shrink-0 border-b border-slate-100 pb-4 mb-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {[
                { label: "Active Orders", value: "ACTIVE" },
                { label: "Completed", value: "COMPLETED" },
                { label: "Cancelled", value: "CANCELLED" },
              ].map((t) => (
                <Button
                  key={t.value}
                  variant={ordersFilterStatus === t.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setOrdersFilterStatus(t.value)}
                  className={cn("h-9 px-4 rounded-lg font-black text-xs", ordersFilterStatus === t.value && "bg-white text-blue-600 shadow-sm")}
                >
                  {t.label}
                </Button>
              ))}
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              {[
                { label: "Today", value: "TODAY" },
                { label: "Yesterday", value: "YESTERDAY" },
                { label: "Last 7 Days", value: "WEEK" },
                { label: "All", value: "ALL" },
              ].map((d) => (
                <Button
                  key={d.value}
                  variant={ordersFilterDate === d.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setOrdersFilterDate(d.value)}
                  className={cn("h-9 px-4 rounded-lg font-black text-xs", ordersFilterDate === d.value && "bg-white text-blue-600 shadow-sm")}
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 font-bold text-slate-400 text-xs uppercase tracking-wider">Order No</th>
                  <th className="py-3 font-bold text-slate-400 text-xs uppercase tracking-wider">Type / Location</th>
                  <th className="py-3 font-bold text-slate-400 text-xs uppercase tracking-wider">Amount</th>
                  <th className="py-3 font-bold text-slate-400 text-xs uppercase tracking-wider">Status</th>
                  <th className="py-3 font-bold text-slate-400 text-xs uppercase tracking-wider text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrdersLog.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-bold text-sm">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrdersLog.map((ord) => (
                    <tr key={ord.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-bold text-slate-900">
                        {ord.orderNumber}
                        <p className="text-[10px] text-slate-400 font-medium">{new Date(ord.createdAt).toLocaleString()}</p>
                      </td>
                      <td className="py-4">
                        <Badge className="bg-slate-100 text-slate-600 border-none font-bold mr-2 text-[10px]">
                          {ord.orderType.replace("_", " ")}
                        </Badge>
                        <span className="text-sm font-semibold text-slate-700">
                          {ord.orderType === "DINE_IN" && ord.table?.name ? `Table: ${ord.table?.name}` : ""}
                          {ord.orderType === "DELIVERY" && ord.riderName ? `Rider: ${ord.riderName}` : ""}
                        </span>
                      </td>
                      <td className="py-4 font-black text-slate-900">
                        PKR {parseFloat(ord.totalAmount).toFixed(2)}
                      </td>
                      <td className="py-4">
                        <Badge className={cn(
                          "px-2.5 py-1 rounded-lg font-black border text-[10px]",
                          ord.status === "COMPLETED" && "bg-emerald-50 text-emerald-700 border-emerald-100",
                          ord.status === "CANCELLED" && "bg-rose-50 text-rose-700 border-rose-100",
                          ["PENDING", "PREPARING", "READY"].includes(ord.status) && "bg-blue-50 text-blue-700 border-blue-100"
                        )}>
                          {ord.status}
                        </Badge>
                      </td>
                      <td className="py-4 text-right pr-4 shrink-0">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" className="h-8 rounded-lg font-bold border-slate-200"
                            onClick={() => {
                              setLastOrder({
                                ...ord,
                                customer: ord.customer || null,
                                items: ord.items.map((it: any) => ({
                                  id: it.id,
                                  name: it.notes ? `${it.product?.name} (${it.notes})` : (it.product?.name || "Product"),
                                  price: it.price,
                                  quantity: it.quantity
                                }))
                              });
                              setShowReceipt(true);
                            }}>
                            Print Bill
                          </Button>
                          {["PENDING", "PREPARING", "READY"].includes(ord.status) && (
                            <>
                              <Button size="sm" className="h-8 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-sm text-xs px-3"
                                onClick={async () => {
                                  try {
                                    await axios.patch(`/api/orders/${ord.id}`, {
                                      status: "COMPLETED",
                                      paymentStatus: "PAID"
                                    });
                                    toast.success(`Order #${ord.orderNumber} completed & paid!`);
                                    fetchOrdersLog();
                                    loadData();
                                  } catch {
                                    toast.error("Failed to process payment checkout");
                                  }
                                }}>
                                Complete Payment
                              </Button>
                              <Button size="sm" className="h-8 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm text-xs px-3"
                                onClick={() => handleEditRunningOrder(ord)}>
                                Edit Order
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Button onClick={() => setShowOrdersLog(false)} className="w-full h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold shrink-0 mt-4">
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-[420px] max-h-[95vh] overflow-y-auto scroll-left rounded-[2.5rem] p-6 bg-white border-none shadow-2xl">
          <div style={{ direction: "ltr" }}>
            <DialogHeader className="pb-2">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" /> Order Complete
              </DialogTitle>
            </DialogHeader>
            {lastOrder && (
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
                        {(!hasPharmacy && !isGym) && tenantSettings?.logoUrl && (
                          <img
                            src={tenantSettings.logoUrl}
                            style={{ maxWidth: "80px", maxHeight: "80px", margin: "0 auto 8px auto", display: "block" }}
                            alt="Business Logo"
                          />
                        )}
                        {(!hasPharmacy && !isGym) && (
                          <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px", textTransform: "uppercase" }}>
                            {tenantSettings?.name || "Cheesy Bite"}
                          </div>
                        )}
                        <div style={{ fontWeight: "bold", fontSize: "11px", marginBottom: "6px", textTransform: "uppercase" }}>
                          {hasPharmacy
                            ? "PHARMACY CASH RECEIPT"
                            : isGym
                              ? "GYM & FITNESS RECEIPT"
                              : isBakery
                                ? "BAKERY & CAFE RECEIPT"
                                : "RECEIPT"}
                        </div>
                        Date: {new Date(lastOrder.createdAt || Date.now()).toLocaleString()}<br />
                        Order #: {lastOrder.orderNumber}<br />
                        Type: <span style={{ fontWeight: "bold" }}>{lastOrder.orderType.replace("_", " ")}</span><br />
                        Payment: <span style={{ fontWeight: "bold" }}>{(lastOrder.paymentStatus || lastOrder.status === "COMPLETED" ? "PAID" : "PENDING")}</span><br />
                        Cashier: <span style={{ fontWeight: "bold" }}>{currentUser?.name || "Cashier"}</span>
                      </div>
                    </div>

                    {lastOrder.orderType === "DINE_IN" && lastOrder.tableId && (
                      <div style={{ borderTop: "1px dashed #000000", paddingTop: "6px", fontSize: "11px", fontWeight: "bold", textAlign: "center", marginBottom: "8px" }}>
                        TABLE: {tables.find(t => t.id === lastOrder.tableId)?.name || ""}
                      </div>
                    )}

                    <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}></div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "11px" }}>
                      <span style={{ width: "50%", textAlign: "left" }}>Item</span>
                      <span style={{ width: "25%", textAlign: "center" }}>Qty</span>
                      <span style={{ width: "25%", textAlign: "right" }}>Total</span>
                    </div>

                    <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}></div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {lastOrder.items?.map((item: any) => {
                        const prodObj = products.find(p => p.id === (item.productId || item.id));
                        const formula = prodObj?.formula;
                        return (
                          <div key={item.id} style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "bold" }}>
                              <span style={{ width: "50%", textAlign: "left", wordBreak: "break-all" }}>{item.name}</span>
                              <span style={{ width: "25%", textAlign: "center" }}>{item.quantity}</span>
                              <span style={{ width: "25%", textAlign: "right" }}>{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            {hasPharmacy && formula && (
                              <div style={{ fontSize: "8.5px", fontWeight: "bold", color: "#555555", marginLeft: "4px", fontStyle: "italic" }}>
                                Formula: {formula}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}></div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "10px", fontWeight: "bold", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal:</span><span>{(lastOrder.totalAmount - lastOrder.tax - (lastOrder.deliveryCharges || 0) + lastOrder.discount).toFixed(2)}</span></div>
                      {lastOrder.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}><span>Discount:</span><span>-{lastOrder.discount.toFixed(2)}</span></div>}
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tax:</span><span>{lastOrder.tax.toFixed(2)}</span></div>
                      {lastOrder.deliveryCharges > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Delivery Charges:</span><span>{lastOrder.deliveryCharges.toFixed(2)}</span></div>}
                    </div>

                    <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}></div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "950", fontSize: "14px" }}>
                      <span>TOTAL:</span><span>PKR {lastOrder.totalAmount.toFixed(2)}</span>
                    </div>

                    {lastOrder.specialInstructions && (
                      <>
                        <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}></div>
                        <div style={{ fontSize: "10px", fontWeight: "bold", textAlign: "left" }}>
                          SPECIAL INSTRUCTION:<br />
                          <span style={{ fontSize: "11px" }}>{lastOrder.specialInstructions}</span>
                        </div>
                      </>
                    )}

                    {/* Delivery & Takeaway info */}
                    {lastOrder.orderType === "DELIVERY" && lastOrder.notes && (
                      <div style={{ borderTop: "1px dashed #000000", paddingTop: "6px", fontSize: "10px", textAlign: "left", marginBottom: "8px" }}>
                        <div style={{ fontWeight: "bold", fontSize: "8px", color: "#555555", textTransform: "uppercase", letterSpacing: "0.05em" }}>DELIVERY TO:</div>
                        {lastOrder.notes.split("\n").map((line: string, idx: number) => (
                          <div key={idx} style={{ fontWeight: "bold", lineHeight: "1.3" }}>{line}</div>
                        ))}
                        {lastOrder.riderName && (
                          <div style={{ marginTop: "4px", fontWeight: "bold", color: "#333333" }}>Rider: {lastOrder.riderName}</div>
                        )}
                      </div>
                    )}

                    {lastOrder.orderType === "TAKEAWAY" && lastOrder.notes && (
                      <div style={{ borderTop: "1px dashed #000000", paddingTop: "6px", fontSize: "10px", textAlign: "left", marginBottom: "8px" }}>
                        <div style={{ fontWeight: "bold", fontSize: "8px", color: "#555555", textTransform: "uppercase", letterSpacing: "0.05em" }}>TAKEAWAY CUSTOMER:</div>
                        {lastOrder.notes.split("\n").map((line: string, idx: number) => (
                          <div key={idx} style={{ fontWeight: "bold", lineHeight: "1.3" }}>{line}</div>
                        ))}
                      </div>
                    )}

                    {/* Business Logo, Name, Address & payment settings moved here (under total bill) */}
                    <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }}></div>
                    <div style={{ textAlign: "center", marginBottom: "8px" }}>
                      {/* Logo & Name displayed at the top */}
                      <div style={{ fontSize: "10px", fontWeight: "bold", textAlign: "center", lineHeight: "1.4" }}>
                        {tenantSettings?.receiptAddressString && (
                          <div style={{ marginBottom: "2px" }}>
                            Address: {tenantSettings.receiptAddressString}
                          </div>
                        )}
                        {tenantSettings?.receiptWhatsAppString && (
                          <div style={{ marginBottom: "4px" }}>
                            WhatsApp: {tenantSettings.receiptWhatsAppString}
                          </div>
                        )}
                        {tenantSettings?.ntn && (
                          <div style={{ fontSize: "9px" }}>
                            NTN: {tenantSettings.ntn}
                          </div>
                        )}
                        {tenantSettings?.strn && (
                          <div style={{ fontSize: "9px" }}>
                            STRN: {tenantSettings.strn}
                          </div>
                        )}
                        {(tenantSettings?.receiptEasyPaisaString || tenantSettings?.receiptJazzCashString || tenantSettings?.receiptRaastString || tenantSettings?.receiptBankString) && (
                          <div style={{ borderTop: "1px dashed #000000", marginTop: "6px", paddingTop: "4px" }}>
                            <div style={{ fontWeight: "bold", textTransform: "uppercase", marginBottom: "3px" }}>Payment Channels:</div>
                            {tenantSettings.receiptEasyPaisaString && <div>EasyPaisa: {tenantSettings.receiptEasyPaisaString}</div>}
                            {tenantSettings.receiptJazzCashString && <div>JazzCash: {tenantSettings.receiptJazzCashString}</div>}
                            {tenantSettings.receiptRaastString && <div>Raast ID: {tenantSettings.receiptRaastString}</div>}
                            {tenantSettings.receiptBankString && <div>Bank: {tenantSettings.receiptBankString}</div>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: "center", paddingTop: "12px", fontSize: "10px", fontWeight: "bold" }}>
                      <p style={{ fontWeight: "bold", margin: "0" }}>
                        {hasPharmacy
                          ? "GET WELL SOON!"
                          : isGym
                            ? "STAY FIT, STAY HEALTHY!"
                            : isBakery
                              ? "THANK YOU FOR SWEETENING YOUR DAY!"
                              : "THANK YOU FOR YOUR VISIT"}
                      </p>
                      {hasPharmacy && (
                        <p style={{ fontSize: "8px", margin: "4px 0 0 0" }}>
                          Medicines are non-refundable/refundable as per law.
                        </p>
                      )}
                      {isGym && (
                        <p style={{ fontSize: "8px", margin: "4px 0 0 0" }}>
                          Memberships & items are non-refundable.
                        </p>
                      )}
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

                <div className="flex gap-3 pt-2">
                  <Button onClick={() => triggerCashierPrint(lastOrder)} className="flex-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 font-bold shadow-md shadow-blue-100 text-white flex items-center justify-center">
                    <Printer className="mr-2 w-4 h-4" /> Print Bill
                  </Button>
                  <Button variant="outline" onClick={() => setShowReceipt(false)} className="flex-1 h-10 rounded-lg font-bold border-slate-200 hover:bg-slate-50">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Printer Setup Modal */}
      <Dialog open={printerSetupOpen} onOpenChange={setPrinterSetupOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-6 bg-white border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-600" /> Local Printer Setup
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Cashier Printer IP</Label>
              <Input
                className="h-11 rounded-xl bg-slate-50 border-slate-100"
                placeholder="e.g. 192.168.1.100"
                value={localCashierIp}
                onChange={(e) => setLocalCashierIp(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 font-medium">Leave empty to use browser print dialog.</p>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Kitchen Printer IP</Label>
              <Input
                className="h-11 rounded-xl bg-slate-50 border-slate-100"
                placeholder="e.g. 192.168.1.101"
                value={localKitchenIp}
                onChange={(e) => setLocalKitchenIp(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 font-medium">Leave empty to use browser print dialog.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSavePrinters}
                className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-lg shadow-blue-100 transition-all active:scale-95"
              >
                Save Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => setPrinterSetupOpen(false)}
                className="flex-1 h-11 rounded-xl border-slate-200 font-bold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Closing Report Modal */}
      <Dialog open={eodModalOpen} onOpenChange={setEodModalOpen}>
        <DialogContent className="w-full sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[1400px] max-h-[90vh] overflow-y-auto rounded-none sm:rounded-3xl p-4 sm:p-6 bg-white border-none shadow-2xl">
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

export default function POSPage() {
  return (
    <ErrorBoundary>
      <POSContent />
    </ErrorBoundary>
  );
}
