"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  ArrowUpRight,
  Clock,
  CreditCard,
  Banknote
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState<{
    todayRevenue: number;
    todayOrdersCount: number;
    monthRevenue: number;
    monthOrdersCount: number;
    totalProducts: number;
    recentOrders: any[];
  }>({
    todayRevenue: 0,
    todayOrdersCount: 0,
    monthRevenue: 0,
    monthOrdersCount: 0,
    totalProducts: 0,
    recentOrders: []
  });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, userRes] = await Promise.all([
          axios.get("/api/stats"),
          axios.get("/api/auth/me")
        ]);
        setStats(statsRes.data);
        setUser(userRes.data);
      } catch (err) {
        toast.error("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const tenantModules = user?.tenant?.modules?.map((m: any) => m.module.name) || [];

  const isGym = true;
  const hasPharmacy = false;
  const isRestaurant = false;
  const isBakery = false;

  const welcomeTitle = isGym 
    ? "Fitness Club Panel" 
    : hasPharmacy 
    ? "Pharmacy Control Center" 
    : isRestaurant 
    ? (isBakery ? "Bakery & Cafe Panel" : "Food Service Panel") 
    : "Retail POS Dashboard";

  const welcomeDesc = isGym
    ? "Welcome back! Track memberships, check-ins, and gym sales."
    : hasPharmacy
    ? "Welcome back! Manage medications, formulas, and prescription checkouts."
    : isRestaurant
    ? "Track table occupancy, kitchen KOTs, and food sales."
    : "Welcome back! Track daily sales, cash/card revenue, and stock levels.";

  const statCards = [
    { 
      title: isGym ? "Today's Registrations" : hasPharmacy ? "Today's Prescriptions" : "Today's Revenue", 
      value: isGym || hasPharmacy ? stats.todayOrdersCount : `PKR ${stats.todayRevenue.toFixed(2)}`, 
      icon: DollarSign, 
      color: "blue", 
      trend: "+14% vs yesterday", 
      moduleId: "POS_BASIC" 
    },
    { 
      title: isGym ? "Today's Sales Revenue" : "Today's Orders", 
      value: isGym ? `PKR ${stats.todayRevenue.toFixed(2)}` : stats.todayOrdersCount, 
      icon: ShoppingCart, 
      color: "emerald", 
      trend: "+5% vs yesterday", 
      moduleId: "POS_BASIC" 
    },
    { 
      title: "Monthly Revenue", 
      value: `PKR ${stats.monthRevenue.toFixed(2)}`, 
      icon: TrendingUp, 
      color: "indigo", 
      trend: "+22% vs last month", 
      moduleId: "POS_BASIC" 
    },
    { 
      title: isGym ? "Gym Items" : hasPharmacy ? "Total Medicines" : isRestaurant ? "Total Menu Items" : "Total Products", 
      value: stats.totalProducts, 
      icon: Package, 
      color: "amber", 
      trend: "Active catalog", 
      moduleId: "POS_BASIC" 
    },
  ].filter(card => !card.moduleId || tenantModules.includes(card.moduleId));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{welcomeTitle}</h1>
          <p className="text-slate-500 mt-1 font-medium">{welcomeDesc}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory">
            <Button variant="outline" className="h-12 rounded-xl font-bold bg-white text-slate-700">
              {isGym ? "Manage Supplements" : hasPharmacy ? "Manage Medicines" : isRestaurant ? "Manage Menu" : "Manage Stock"}
            </Button>
          </Link>
          {isGym && (
            <Link href="/dashboard/gym">
              <Button className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold px-6 shadow-lg shadow-blue-100">
                Open Gym Desk
              </Button>
            </Link>
          )}
          {tenantModules.includes("POS_BASIC") && (
            <Link href="/dashboard/pos">
              <Button className={cn("h-12 rounded-xl font-bold px-6 shadow-lg shadow-blue-100", isGym ? "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200" : "bg-blue-600 hover:bg-blue-700 text-white")}>
                {hasPharmacy ? "Open Pharmacy POS" : 
                 isRestaurant ? (isBakery ? "Open Bakery POS" : "Open Restaurant POS") : 
                 isGym ? "Open Shop POS" : 
                 "Open POS"}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
          >
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${stat.color}-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-in-out`}></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-100 text-${stat.color}-600 flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <Badge variant="outline" className={`bg-white border-${stat.color}-200 text-${stat.color}-700 font-bold px-2 py-0.5`}>
                  Today
                </Badge>
              </div>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1 mb-2">{loading ? "..." : stat.value}</h3>
              <div className="flex items-center text-xs font-bold text-slate-400">
                <ArrowUpRight className="w-3 h-3 mr-1 text-emerald-500" />
                {stat.trend}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 p-8 rounded-[2rem] bg-white border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Revenue Overview</h3>
              <p className="text-slate-500 text-sm font-medium">Based on recent orders</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
            {loading ? (
              <div className="w-full h-full bg-slate-50 rounded-2xl animate-pulse" />
            ) : stats.recentOrders.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                <p className="text-slate-400 font-bold">No orders yet — start selling!</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.recentOrders.map((o: any) => ({
                    time: new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    revenue: o.totalAmount,
                  })).reverse()}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} tickFormatter={(v) => `PKR ${v}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", padding: "12px" }}
                    formatter={(v: any) => [`PKR ${Number(v).toFixed(2)}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Recent Orders</h3>
            <Link href="/dashboard/orders" className="text-sm font-bold text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
            {loading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)
            ) : stats.recentOrders.length === 0 ? (
              <div className="text-center py-10 text-slate-400">No recent orders</div>
            ) : (
              stats.recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-100 bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      order.paymentMethod === 'CASH' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {order.paymentMethod === 'CASH' ? <Banknote className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{order.orderNumber}</p>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">PKR {order.totalAmount.toFixed(2)}</p>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] uppercase px-2 py-0 mt-1">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
