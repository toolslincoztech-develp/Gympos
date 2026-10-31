"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  ShoppingCart,
  Utensils,
  Pill,
  BarChart3,
  Users,
  DollarSign,
  Truck,
  Star,
  Building2,
  Activity,
  Layers,
  Scissors,
  Stethoscope,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import axios from "axios";
import { toast } from "sonner";

const targetModuleNames = [
  "GYM_FITNESS_PRO",
  "POS_BASIC",
  "CRM_LOYALTY",
  "INVENTORY_ADVANCED",
  "HR_PAYROLL",
  "ANALYTICS"
];

const industryIcons: Record<string, React.ElementType> = {
  GYM_FITNESS_PRO: Activity,
  POS_BASIC: ShoppingCart,
  CRM_LOYALTY: Users,
  INVENTORY_ADVANCED: Package,
  HR_PAYROLL: DollarSign,
  ANALYTICS: BarChart3,
};

const industryLabels: Record<string, string> = {
  GYM_FITNESS_PRO: "Gym & Fitness Club Core",
  POS_BASIC: "Supplement & Merch POS",
  CRM_LOYALTY: "Memberships & Check-in CRM",
  INVENTORY_ADVANCED: "Supplement Stock & Suppliers",
  HR_PAYROLL: "Trainers & Staff Payroll",
  ANALYTICS: "Club Financial & Growth Analytics",
};

const industryDescriptions: Record<string, string> = {
  GYM_FITNESS_PRO: "Gym membership packages, renewals, expiry tracking & member check-ins",
  POS_BASIC: "Counter billing for protein shakes, supplements, energy drinks & gym gear",
  CRM_LOYALTY: "Member profiles, check-in attendance logs & loyalty rewards",
  INVENTORY_ADVANCED: "Supplement stock alerts, purchase orders & vendor ledgers",
  HR_PAYROLL: "Personal trainers, staff attendance & monthly salary management",
  ANALYTICS: "Revenue, membership retention, P&L statements & expense analytics",
};

const addonLabels: Record<string, string> = {
  HR_PAYROLL: "HR & Payroll",
  ACCOUNTING_PRO: "Accounting & Finance",
  MULTI_BRANCH: "Multi-Branch Support",
  INVENTORY_ADVANCED: "Advanced Inventory",
  CRM_LOYALTY: "CRM & Customer Loyalty",
  ANALYTICS_AI: "Analytics & AI Reports",
};

export default function ModulesPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchModules = async () => {
    try {
      const res = await axios.get("/api/admin/modules");
      setModules(res.data);
    } catch {
      toast.error("Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModules(); }, []);

  const handleToggle = async (id: string, isActive: boolean) => {
    setToggling(id);
    try {
      await axios.patch("/api/admin/modules", { id, isActive: !isActive });
      setModules((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isActive: !isActive } : m))
      );
      toast.success(`Module ${!isActive ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update module");
    } finally {
      setToggling(null);
    }
  };

  const targetModules = modules.filter((m) => targetModuleNames.includes(m.name));
  const activeCount = targetModules.filter((m) => m.isActive).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Module Management</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Control which industry modules and addon features are enabled globally.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-sm">
            <Activity className="w-4 h-4" />
            {activeCount} / {targetModules.length} Active Industries
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Total Industries", value: targetModules.length, icon: Layers, color: "blue" },
          { label: "Active Industries", value: activeCount, icon: Activity, color: "emerald" },
          { label: "Disabled Industries", value: targetModules.length - activeCount, icon: Package, color: "rose" },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              stat.color === "blue" ? "bg-blue-100 text-blue-600" :
              stat.color === "emerald" ? "bg-emerald-100 text-emerald-600" :
              stat.color === "rose" ? "bg-rose-100 text-rose-600" :
              "bg-slate-100 text-slate-600"
            }`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{loading ? "..." : stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-96 bg-white rounded-3xl border border-slate-200 animate-pulse" />
          ))
        ) : (
          targetModules.map((module, idx) => {
            const Icon = industryIcons[module.name] || Package;

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-6 rounded-[2rem] border-2 bg-white transition-all flex flex-col justify-between min-h-[400px] ${
                  module.isActive ? "border-slate-200 shadow-sm" : "border-slate-100 opacity-70"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status</span>
                      <Switch
                        checked={module.isActive}
                        disabled={toggling === module.id}
                        onCheckedChange={() => handleToggle(module.id, module.isActive)}
                      />
                    </div>
                  </div>
                  
                  <h3 className="font-black text-slate-900 text-lg mb-1 leading-tight">
                    {industryLabels[module.name]}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mb-4">
                    {industryDescriptions[module.name]}
                  </p>
                  
                  {/* Included Addons Configuration */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50 space-y-3 mt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Addon Settings</p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {Object.entries(addonLabels).map(([addonName, label]) => {
                        const addonMod = modules.find((m) => m.name === addonName);
                        if (!addonMod) return null;
                        
                        return (
                          <div key={addonMod.id} className="flex items-center justify-between py-1 border-b border-slate-100/30 last:border-0">
                            <span className="text-xs font-bold text-slate-700">{label}</span>
                            <Switch
                              checked={addonMod.isActive}
                              disabled={toggling === addonMod.id}
                              onCheckedChange={() => handleToggle(addonMod.id, addonMod.isActive)}
                              className="scale-75 origin-right"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                  <Badge variant="outline" className="text-xs font-bold bg-slate-50">
                    {module._count?.tenants || 0} tenants
                  </Badge>
                  {module.isActive ? (
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-xs font-bold ml-auto">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-xs font-bold ml-auto">
                      Disabled
                    </Badge>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
