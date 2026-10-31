"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, DollarSign, ShoppingCart, Package,
  Download, Loader2, Printer, AlertTriangle, CheckSquare, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import axios from "axios";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchStats = () => {
    setLoading(true);
    axios.get("/api/stats")
      .then((res) => setStats(res.data))
      .catch(() => toast.error("Failed to load report data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Build chart data from recent orders grouped by date
  const revenueData = stats?.recentOrders
    ? (() => {
        const map: Record<string, number> = {};
        [...stats.recentOrders].reverse().forEach((o: any) => {
          const d = new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          map[d] = (map[d] || 0) + o.totalAmount;
        });
        return Object.entries(map).map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 }));
      })()
    : [];

  const paymentData = stats?.recentOrders
    ? (() => {
        const map: Record<string, number> = {};
        stats.recentOrders.forEach((o: any) => {
          map[o.paymentMethod] = (map[o.paymentMethod] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
      })()
    : [];

  const handleExport = async () => {
    if (!stats) return;
    setExporting(true);
    try {
      const headers = ["Order Number", "Amount", "Payment Method", "Status", "Date"];
      const rows = stats.recentOrders.map((o: any) => [
        o.orderNumber,
        `PKR ${o.totalAmount.toFixed(2)}`,
        o.paymentMethod,
        o.status,
        new Date(o.createdAt).toLocaleString(),
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell: any) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lincoz-pos-report-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Report exported successfully");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };


  const summaryCards = [
    { label: "Today's Revenue", value: `PKR ${(stats?.todayRevenue || 0).toFixed(2)}`, icon: DollarSign, color: "blue", sub: `${stats?.todayOrdersCount || 0} orders` },
    { label: "Monthly Revenue", value: `PKR ${(stats?.monthRevenue || 0).toFixed(2)}`, icon: TrendingUp, color: "emerald", sub: `${stats?.monthOrdersCount || 0} orders` },
    { label: "Total Products", value: stats?.totalProducts || 0, icon: Package, color: "indigo", sub: "In catalog" },
    {
      label: "Avg Order Value",
      value: stats?.todayOrdersCount ? `PKR ${(stats.todayRevenue / stats.todayOrdersCount).toFixed(2)}` : "PKR 0.00",
      icon: ShoppingCart, color: "amber", sub: "Today",
    },
  ];

  return (
    <div className="space-y-8">

      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1 font-medium">Business performance insights and trends.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-12 rounded-xl font-bold bg-white"
            onClick={handleExport}
            disabled={exporting || loading}
          >
            {exporting ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : <Download className="mr-2 w-4 h-4" />}
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm animate-fade-in">
            <div className={`w-12 h-12 rounded-2xl bg-${card.color}-100 text-${card.color}-600 flex items-center justify-center mb-4`}>
              <card.icon className="w-6 h-6" />
            </div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">{card.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{loading ? "..." : card.value}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Revenue Trend</h3>
              <p className="text-slate-500 text-sm font-medium">Based on recent orders</p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 font-bold">
              <BarChart3 className="w-3 h-3 mr-1" /> Live Data
            </Badge>
          </div>
          {loading ? (
            <div className="h-64 bg-slate-50 rounded-2xl animate-pulse" />
          ) : revenueData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 font-medium bg-slate-50 rounded-2xl">
              No orders yet — start making sales!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} tickFormatter={(v) => `PKR ${v}`} />
                <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", padding: "12px" }}
                  formatter={(v: any) => [`PKR ${Number(v).toFixed(2)}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment Methods Pie */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Payment Methods</h3>
          <p className="text-slate-500 text-sm font-medium mb-6">Distribution of payment types</p>
          {loading ? (
            <div className="h-64 bg-slate-50 rounded-2xl animate-pulse" />
          ) : paymentData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 font-medium bg-slate-50 rounded-2xl">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {paymentData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-sm font-semibold text-slate-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Revenue by Day</h3>
        <p className="text-slate-500 text-sm font-medium mb-8">Daily revenue from recent orders</p>
        {loading ? (
          <div className="h-48 bg-slate-50 rounded-2xl animate-pulse" />
        ) : revenueData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 font-medium bg-slate-50 rounded-2xl">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} tickFormatter={(v) => `PKR ${v}`} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                formatter={(v: any) => [`PKR ${Number(v).toFixed(2)}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}
