"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Banknote,
  CreditCard,
  Package,
  Receipt,
  PieChart as PieChartIcon,
  Filter,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function FinancePage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [txFilter, setTxFilter] = useState<"ALL" | "INCOME" | "EXPENSE" | "PURCHASE">("ALL");
  const [exporting, setExporting] = useState(false);

  const fetchFinance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/finance?month=${month}`);
      setData(res.data);
    } catch {
      toast.error("Failed to load store finance data");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchFinance();
  }, [fetchFinance]);

  const summary = data?.summary || {
    todayRevenue: 0,
    todayOrdersCount: 0,
    totalRevenue: 0,
    ordersCount: 0,
    totalTax: 0,
    totalDiscount: 0,
    totalCogs: 0,
    grossProfit: 0,
    totalExpenses: 0,
    expensesCount: 0,
    totalPurchases: 0,
    purchasesCount: 0,
    netProfit: 0,
    profitMargin: 0,
    cashRevenue: 0,
    cardRevenue: 0,
    cashOrdersCount: 0,
    cardOrdersCount: 0,
    inventoryCostValue: 0,
    inventoryRetailValue: 0,
  };

  const dailyTrend = data?.dailyTrend || [];
  const expensesByCategory = data?.expensesByCategory || [];
  const transactions = (data?.transactions || []).filter((tx: any) =>
    txFilter === "ALL" ? true : tx.type === txFilter
  );

  const handleExportCSV = () => {
    if (!data) return;
    setExporting(true);
    try {
      const headers = ["Date", "Type", "Description", "Category / Method", "Processed By", "Amount (PKR)"];
      const rows = transactions.map((tx: any) => [
        new Date(tx.date).toLocaleString(),
        tx.type,
        tx.title,
        tx.category,
        tx.actor,
        tx.amount.toFixed(2),
      ]);

      const summaryRows = [
        ["STORE FINANCIAL STATEMENT", `Month: ${month}`],
        ["Gross Sales Revenue", `PKR ${summary.totalRevenue.toFixed(2)}`],
        ["Cost of Goods Sold (COGS)", `PKR ${summary.totalCogs.toFixed(2)}`],
        ["Gross Profit", `PKR ${summary.grossProfit.toFixed(2)}`],
        ["Operating Expenses", `PKR ${summary.totalExpenses.toFixed(2)}`],
        ["Net Profit", `PKR ${summary.netProfit.toFixed(2)}`],
        ["Tax Collected", `PKR ${summary.totalTax.toFixed(2)}`],
        ["Discounts Given", `PKR ${summary.totalDiscount.toFixed(2)}`],
        [],
        headers,
        ...rows,
      ];

      const csvContent = summaryRows
        .map((row) => row.map((cell: any) => `"${cell ?? ""}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `store-finance-${month}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Financial statement exported");
    } catch {
      toast.error("Failed to export statement");
    } finally {
      setExporting(false);
    }
  };

  const kpiCards = [
    {
      label: "Gross Revenue",
      value: `PKR ${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `Today: PKR ${summary.todayRevenue.toFixed(2)} (${summary.ordersCount} monthly orders)`,
      icon: DollarSign,
      bg: "bg-blue-50 text-blue-600",
      border: "border-blue-100",
      trendUp: true,
    },
    {
      label: "Gross Profit",
      value: `PKR ${summary.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `COGS: PKR ${summary.totalCogs.toFixed(2)}`,
      icon: TrendingUp,
      bg: "bg-indigo-50 text-indigo-600",
      border: "border-indigo-100",
      trendUp: summary.grossProfit >= 0,
    },
    {
      label: "Operating Expenses",
      value: `PKR ${summary.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `${summary.expensesCount} expense entries recorded`,
      icon: TrendingDown,
      bg: "bg-rose-50 text-rose-600",
      border: "border-rose-100",
      trendUp: false,
    },
    {
      label: "Net Profit / Loss",
      value: `PKR ${summary.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `Net Margin: ${summary.profitMargin.toFixed(1)}%`,
      icon: Wallet,
      bg: summary.netProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600",
      border: summary.netProfit >= 0 ? "border-emerald-100" : "border-rose-100",
      trendUp: summary.netProfit >= 0,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-blue-600" /> Store Finance & P&L
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Complete financial overview: revenue, profit margins, expenses, tax, and cash flow ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-8 border-none bg-transparent text-xs font-bold text-slate-700 p-0 w-32 focus-visible:ring-0"
            />
          </div>

          <Link href="/dashboard/expenses">
            <Button variant="outline" className="h-10 rounded-xl font-bold text-xs bg-white border-slate-200">
              <Plus className="w-4 h-4 mr-1.5 text-rose-500" /> Record Expense
            </Button>
          </Link>

          <Button
            onClick={handleExportCSV}
            disabled={exporting || loading}
            className="h-10 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100"
          >
            {exporting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
            Export Statement
          </Button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", card.bg, card.border)}>
                <card.icon className="w-5 h-5" />
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 flex items-center gap-0.5",
                  card.trendUp
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-rose-50 text-rose-600 border-rose-100"
                )}
              >
                {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {month}
              </Badge>
            </div>
            <div>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">{card.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{loading ? "..." : card.value}</h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-1">{card.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Secondary Financial Breakdown Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cash Sales</p>
            <p className="text-base font-black text-slate-900">PKR {summary.cashRevenue.toFixed(2)}</p>
            <p className="text-[10px] font-semibold text-slate-400">{summary.cashOrdersCount} cash orders</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Card / Digital Sales</p>
            <p className="text-base font-black text-slate-900">PKR {summary.cardRevenue.toFixed(2)}</p>
            <p className="text-[10px] font-semibold text-slate-400">{summary.cardOrdersCount} card orders</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tax & Discounts</p>
            <p className="text-base font-black text-slate-900">Tax: PKR {summary.totalTax.toFixed(2)}</p>
            <p className="text-[10px] font-semibold text-slate-400">Discounts: PKR {summary.totalDiscount.toFixed(2)}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Asset Value</p>
            <p className="text-base font-black text-slate-900">PKR {summary.inventoryRetailValue.toFixed(2)}</p>
            <p className="text-[10px] font-semibold text-slate-400">Cost Basis: PKR {summary.inventoryCostValue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue vs Expenses */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revenue vs. Expenses</h3>
              <p className="text-slate-500 text-xs font-medium">Daily cash flow comparison for {month}</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Expenses
              </span>
            </div>
          </div>

          {loading ? (
            <div className="h-64 bg-slate-50 rounded-2xl animate-pulse" />
          ) : dailyTrend.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No financial activity recorded for {month}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} tickFormatter={(v) => `PKR ${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: "14px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", padding: "10px" }}
                  formatter={(v: any, name: any) => [`PKR ${Number(v).toFixed(2)}`, name === "revenue" ? "Revenue" : "Expenses"]}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expense Breakdown Pie */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-rose-500" /> Expense Breakdown
            </h3>
            <p className="text-slate-500 text-xs font-medium">Spending by category</p>
          </div>

          {loading ? (
            <div className="flex-1 min-h-[220px] bg-slate-50 rounded-2xl animate-pulse" />
          ) : expensesByCategory.length === 0 ? (
            <div className="flex-1 min-h-[220px] flex items-center justify-center text-slate-400 text-sm font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No expenses recorded in {month}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {expensesByCategory.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(v: any) => [`PKR ${Number(v).toFixed(2)}`, "Amount"]}
                />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs font-bold text-slate-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Unified Financial Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Financial Transactions Ledger</h3>
            <p className="text-xs text-slate-500 font-medium">All sales inflows, operating expenses, and supply purchases</p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={txFilter} onValueChange={(v: any) => setTxFilter(v)}>
              <SelectTrigger className="h-9 rounded-xl w-44 bg-slate-50 border-slate-200 text-xs font-bold">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Transactions</SelectItem>
                <SelectItem value="INCOME">Income (Sales)</SelectItem>
                <SelectItem value="EXPENSE">Operating Expenses</SelectItem>
                <SelectItem value="PURCHASE">Supply Purchases</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <Table>
            <TableHeader className="bg-slate-50/60">
              <TableRow>
                <TableHead className="py-4 px-6 font-bold text-slate-700 text-xs">Date & Time</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Type</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Description / Reference</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Method / Category</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Handled By</TableHead>
                <TableHead className="text-right font-bold text-slate-700 px-6 text-xs">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <div className="h-10 bg-slate-50 rounded-xl animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-slate-400 font-medium text-sm">
                    No financial transactions found for this filter.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx: any) => (
                  <TableRow key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-3.5 px-6 text-xs text-slate-500 font-medium">
                      {new Date(tx.date).toLocaleDateString()}{" "}
                      <span className="text-slate-400">
                        {new Date(tx.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-black px-2.5 py-0.5 border",
                          tx.type === "INCOME"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : tx.type === "EXPENSE"
                            ? "bg-rose-50 text-rose-600 border-rose-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        )}
                      >
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 text-xs">{tx.title}</TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {tx.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-500">{tx.actor}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right px-6 font-black text-xs",
                        tx.amount >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}
                    >
                      {tx.amount >= 0 ? `+PKR ${tx.amount.toFixed(2)}` : `-PKR ${Math.abs(tx.amount).toFixed(2)}`}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

