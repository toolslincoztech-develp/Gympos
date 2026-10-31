"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, CheckCircle2, XCircle, Clock, TrendingUp,
  Users, Zap, Shield, Star, Plus, Edit2, Trash2, X,
  Save, Loader2, CheckSquare, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";

const planIcons = [Zap, Shield, Star, Package, CreditCard];
const planGradients = [
  "from-blue-500 to-indigo-600",
  "from-indigo-500 to-purple-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
];

const emptyForm = {
  name: "",
  price: "",
  billingType: "MONTHLY",
  features: ["", "", ""],
};

export default function SubscriptionsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New client‑side state for subscription calculations
  const [daysLeftMap, setDaysLeftMap] = useState<Record<string, number>>({});
  const [expiredMap, setExpiredMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const dlMap: Record<string, number> = {};
    const expMap: Record<string, boolean> = {};
    tenants.forEach((tenant) => {
      const sub = tenant.subscription;
      const id = sub?.id || tenant.id;
      if (sub?.endDate) {
        const end = new Date(sub.endDate);
        const now = new Date();
        expMap[id] = end < now;
        dlMap[id] = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        expMap[id] = false;
        dlMap[id] = 0;
      }
    });
    setDaysLeftMap(dlMap);
    setExpiredMap(expMap);
  }, [tenants]);

  const fetchAll = async () => {
    try {
      const [tenantsRes, plansRes] = await Promise.all([
        axios.get("/api/admin/tenants"),
        axios.get("/api/admin/plans"),
      ]);
      setTenants(tenantsRes.data);
      setPlans(plansRes.data);
    } catch {
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditPlan(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (plan: any) => {
    setEditPlan(plan);
    const feats = Array.isArray(plan.features) ? plan.features : [];
    // pad to at least 3 feature slots
    while (feats.length < 3) feats.push("");
    setForm({
      name: plan.name,
      price: String(plan.price),
      billingType: plan.billingType,
      features: feats,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return toast.error("Plan name and price are required");
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        price: parseFloat(form.price),
        billingType: form.billingType,
        features: form.features.filter((f) => f.trim()),
      };
      if (editPlan) {
        await axios.patch(`/api/admin/plans/${editPlan.id}`, payload);
        toast.success("Plan updated successfully");
      } else {
        await axios.post("/api/admin/plans", payload);
        toast.success("Plan created successfully");
      }
      setIsModalOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (plan: any) => {
    const subCount = plan._count?.subscriptions ?? 0;
    if (subCount > 0) {
      toast.error(`Cannot delete: ${subCount} tenant(s) subscribed to this plan`);
      return;
    }
    if (!confirm(`Delete plan "${plan.name}"? This action cannot be undone.`)) return;
    setDeletingId(plan.id);
    try {
      await axios.delete(`/api/admin/plans/${plan.id}`);
      toast.success("Plan deleted");
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete plan");
    } finally {
      setDeletingId(null);
    }
  };

  const updateFeature = (idx: number, val: string) => {
    const updated = [...form.features];
    updated[idx] = val;
    setForm({ ...form, features: updated });
  };

  const addFeature = () => setForm({ ...form, features: [...form.features, ""] });
  const removeFeature = (idx: number) =>
    setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });

  const activeSubscriptions = tenants.filter((t) => t.subscription?.status === "ACTIVE").length;
  const totalMRR = tenants.reduce((sum: number, t: any) => sum + (t.subscription?.plan?.price || 0), 0);
  const expiringSoon = tenants.filter((t) => {
    if (!t.subscription?.endDate) return false;
    const days = (new Date(t.subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days <= 30 && days > 0;
  }).length;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscriptions & Plans</h1>
          <p className="text-slate-500 mt-1 font-medium">Design plans and monitor all tenant subscriptions.</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-14 px-8 font-black text-lg shadow-xl shadow-blue-100 transition-all active:scale-95 text-white"
        >
          <Plus className="mr-2 w-5 h-5" /> New Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Subscriptions", value: activeSubscriptions, icon: CheckCircle2, bg: "bg-emerald-100", text: "text-emerald-600" },
          { label: "Monthly Revenue", value: `PKR ${totalMRR.toLocaleString()}`, icon: CreditCard, bg: "bg-blue-100", text: "text-blue-600" },
          { label: "Expiring Soon", value: expiringSoon, icon: Clock, bg: "bg-amber-100", text: "text-amber-600" },
          { label: "Total Tenants", value: tenants.length, icon: Users, bg: "bg-indigo-100", text: "text-indigo-600" },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.text} flex items-center justify-center shrink-0`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{loading ? "..." : stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Plans Grid */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-6">Subscription Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-3xl border border-slate-200 animate-pulse" />
            ))
          ) : (
            <AnimatePresence>
              {plans.map((plan, idx) => {
                const Icon = planIcons[idx % planIcons.length];
                const gradient = planGradients[idx % planGradients.length];
                const subscriberCount = plan._count?.subscriptions ?? tenants.filter((t) => t.subscription?.planId === plan.id).length;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.07 }}
                    className="relative rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {/* Gradient top bar */}
                    <div className={`h-2 w-full bg-gradient-to-r ${gradient}`} />

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-5">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-bold bg-slate-50 text-slate-600">
                            {subscriberCount} {subscriberCount === 1 ? "tenant" : "tenants"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => openEdit(plan)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            disabled={deletingId === plan.id}
                            onClick={() => handleDelete(plan)}
                          >
                            {deletingId === plan.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <h4 className="font-black text-slate-900 text-lg mb-1">{plan.name}</h4>
                      <p className="text-3xl font-black text-slate-900 mb-1">
                        PKR {Number(plan.price).toLocaleString()}
                        <span className="text-sm font-bold text-slate-400 ml-1">
                          /{plan.billingType === "MONTHLY" ? "mo" : plan.billingType === "6_MONTHS" ? "6mo" : plan.billingType === "LIFETIME" ? "life" : "yr"}
                        </span>
                      </p>
                      <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 mb-4">
                        <TrendingUp className="w-3 h-3" />
                        MRR: PKR {(Number(plan.price) * subscriberCount).toLocaleString()}
                      </p>

                      <div className="space-y-2 border-t border-slate-100 pt-4">
                        {(plan.features || []).map((f: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            {f}
                          </div>
                        ))}
                        {(!plan.features || plan.features.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No features listed.</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Add new plan card */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: plans.length * 0.07 }}
                onClick={openCreate}
                className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-300 p-6 flex flex-col items-center justify-center gap-3 min-h-[200px] group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <p className="font-bold text-slate-400 group-hover:text-blue-600 transition-colors">Create New Plan</p>
              </motion.button>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-6">All Tenant Subscriptions</h3>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="py-5 px-6 font-bold text-slate-700 min-w-[200px]">Business</TableHead>
                  <TableHead className="font-bold text-slate-700 min-w-[140px]">Plan</TableHead>
                  <TableHead className="font-bold text-slate-700 min-w-[130px]">Start Date</TableHead>
                  <TableHead className="font-bold text-slate-700 min-w-[130px]">Expiry Date</TableHead>
                  <TableHead className="font-bold text-slate-700 min-w-[100px]">Days Left</TableHead>
                  <TableHead className="font-bold text-slate-700 min-w-[120px]">Amount</TableHead>
                  <TableHead className="font-bold text-slate-700 min-w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><div className="h-12 bg-slate-50 rounded-xl animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-slate-400 font-medium">
                      No subscriptions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  tenants.map((tenant, idx) => {
                    const sub = tenant.subscription;
                    const subId = sub?.id || tenant.id;
                    const isExpired = expiredMap[subId] ?? false;
                    const daysLeft = daysLeftMap[subId] ?? null;

                    return (
                      <motion.tr
                        key={tenant.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="py-4 px-6">
                          <p className="font-bold text-slate-900">{tenant.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{tenant.email}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-slate-700">{sub?.plan?.name || "No Plan"}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-slate-600">
                            {sub?.startDate ? new Date(sub.startDate).toLocaleDateString() : "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-slate-600">
                            {sub?.endDate ? new Date(sub.endDate).toLocaleDateString() : "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          {daysLeft !== null && !isExpired && daysLeft <= 30 && (
                            <p className="text-xs font-bold text-amber-500">{daysLeft}d left</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="font-black text-slate-900">
                            {sub?.plan?.price != null ? `PKR ${Number(sub.plan.price).toLocaleString()}` : "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          {!sub ? (
                            <Badge variant="outline" className="bg-slate-50 text-slate-500 font-bold">No Plan</Badge>
                          ) : isExpired ? (
                            <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100 font-bold flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" /> Expired
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </Badge>
                          )}
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Create / Edit Plan Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[560px] rounded-[2rem] p-0 border-none shadow-2xl overflow-visible">
          <div className="bg-white p-8 rounded-[2rem]">
            <DialogHeader className="mb-7 text-left">
              <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">
                {editPlan ? "Edit Plan" : "New Plan"}
              </DialogTitle>
              <p className="text-slate-500 font-bold mt-1">
                {editPlan ? "Update the plan details, pricing, and features." : "Design a new subscription plan for your tenants."}
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name & Billing */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Plan Name *</label>
                  <Input
                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-base font-bold px-5 focus:bg-white transition-all"
                    placeholder="e.g. Starter, Pro"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Billing Cycle *</label>
                  <Select value={form.billingType} onValueChange={(v) => setForm({ ...form, billingType: v })}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-base font-bold px-5 focus:bg-white transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl z-[100]">
                      <SelectItem value="MONTHLY" className="rounded-xl font-bold py-3 cursor-pointer">Monthly</SelectItem>
                      <SelectItem value="6_MONTHS" className="rounded-xl font-bold py-3 cursor-pointer">6 Months</SelectItem>
                      <SelectItem value="YEARLY" className="rounded-xl font-bold py-3 cursor-pointer">Yearly</SelectItem>
                      <SelectItem value="LIFETIME" className="rounded-xl font-bold py-3 cursor-pointer">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Price (PKR) *</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm pointer-events-none">PKR</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-black pl-16 pr-5 focus:bg-white transition-all"
                    placeholder="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Features</label>
                  <button
                    type="button"
                    onClick={addFeature}
                    className="text-[11px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Feature
                  </button>
                </div>
                <div className="space-y-3">
                  {form.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                      <Input
                        className="h-12 rounded-xl bg-slate-50 border-slate-100 font-medium px-4 focus:bg-white transition-all flex-1"
                        placeholder={`Feature ${idx + 1}...`}
                        value={feat}
                        onChange={(e) => updateFeature(idx, e.target.value)}
                      />
                      {form.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(idx)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-14 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  disabled={submitting}
                  className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-xl shadow-blue-100 text-white transition-all active:scale-95"
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Saving...</>
                  ) : (
                    <><Save className="w-5 h-5 mr-2" /> {editPlan ? "Update Plan" : "Create Plan"}</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
