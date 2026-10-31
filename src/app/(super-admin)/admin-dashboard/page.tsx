"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Clock,
  LayoutDashboard
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState<{
    totalTenants: number;
    monthlyRevenue: number;
    activeModules: number;
    systemHealth: string;
    recentTenants: any[];
    revenueHistory: any[];
  }>({
    totalTenants: 0,
    monthlyRevenue: 0,
    activeModules: 0,
    systemHealth: "99.9%",
    recentTenants: [],
    revenueHistory: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/api/admin/stats");
        setData(res.data);
      } catch (err) {
        toast.error("Failed to load system stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { label: "Total Businesses", value: data.totalTenants, change: "+12%", trend: "up", icon: Users, color: "blue" },
    { label: "Monthly Revenue", value: `PKR ${data.monthlyRevenue.toLocaleString()}`, change: "+8.4%", trend: "up", icon: DollarSign, color: "green" },
    { label: "Active Modules", value: data.activeModules, change: "All Live", trend: "up", icon: Activity, color: "purple" },
    { label: "System Health", value: data.systemHealth, change: "Stable", trend: "up", icon: TrendingUp, color: "indigo" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Overview</h1>
          <p className="text-slate-500 mt-1 font-medium">Monitoring the Lincoz POS global ecosystem performance.</p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 font-bold text-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          Server Live
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
             <div className={`absolute -right-4 -top-4 w-16 h-16 bg-${stat.color}-50 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50`}></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={cn(
                  "flex items-center text-sm font-bold",
                  stat.trend === "up" ? "text-emerald-600" : "text-rose-600"
                )}>
                  {stat.change}
                  {stat.trend === "up" ? <ArrowUpRight className="ml-1 w-4 h-4" /> : <ArrowDownRight className="ml-1 w-4 h-4" />}
                </div>
              </div>
              <div>
                <p className="text-slate-500 font-semibold text-sm uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{loading ? "..." : stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Placeholder */}
        <div className="lg:col-span-2 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm min-h-[450px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Revenue Analytics</h3>
              <p className="text-slate-500 text-sm font-medium">Growth across all business types</p>
            </div>
          </div>
          <div className="flex-1 min-h-[350px]">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-2xl animate-pulse">
                <Activity className="w-8 h-8 text-slate-300" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.revenueHistory}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    tickFormatter={(value) => `PKR ${Number(value).toLocaleString()}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '12px' 
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Onboarding */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-xl font-bold text-slate-900">Recent Onboarding</h3>
            <Clock className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 space-y-4">
            {loading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)
            ) : data.recentTenants.length === 0 ? (
              <div className="text-center py-10 text-slate-400">No recent businesses</div>
            ) : (
              data.recentTenants.map((tenant: any) => (
                <div key={tenant.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 border border-slate-100">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{tenant.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{tenant.subscription?.plan?.name || "No Plan"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-bold">
                    New
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
