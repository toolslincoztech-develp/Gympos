"use client";

import React, { useState, useEffect } from "react";
import {
  Plus, Search, Building2, Mail, Phone, CheckCircle2, XCircle,
  Edit2, CreditCard, RefreshCw, ArrowUpCircle, ChevronRight,
  Package, Trash2, MoreVertical, LogIn, ExternalLink,
  MapPin, Lock, Eye, EyeOff, Sparkles, Loader2, Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import axios from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INDUSTRY_MAP: Record<string, string> = {
  GYM_FITNESS_PRO: "Gym & Fitness Club POS",
};

const ADDON_MAP: Record<string, string> = {
  HR_PAYROLL: "HR & Payroll Module",
  ACCOUNTING_PRO: "Accounting & Finance Module",
  MULTI_BRANCH: "Multi-Branch Support",
  INVENTORY_ADVANCED: "Advanced Inventory & Stock Management",
  CRM_LOYALTY: "CRM & Customer Loyalty",
  ANALYTICS_AI: "Analytics & AI Reports",
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [plans, setPlans] = useState<any[]>([]);
  const [allModules, setAllModules] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newBusiness, setNewBusiness] = useState({ name: "", email: "", phone: "", address: "", planId: "", adminPassword: "" });
  
  // Custom modules config state
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [deletingTenant, setDeletingTenant] = useState<any>(null);
  
  // Branches state
  const [tenantBranches, setTenantBranches] = useState<any[]>([]);
  const [newBranch, setNewBranch] = useState({ name: "", location: "", phone: "" });
  const [loadingBranches, setLoadingBranches] = useState(false);

  const fetchAll = async () => {
    try {
      const [tenantsRes, plansRes, modulesRes] = await Promise.all([
        axios.get("/api/admin/tenants"),
        axios.get("/api/admin/plans"),
        axios.get("/api/admin/modules"),
      ]);
      setTenants(tenantsRes.data);
      setPlans(plansRes.data);
      setAllModules(modulesRes.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusiness.name) return toast.error("Business name is required");
    setIsSubmitting(true);
    try {
      await axios.post("/api/admin/tenants", newBusiness);
      toast.success("Business created successfully");
      setIsAddModalOpen(false);
      setNewBusiness({ name: "", email: "", phone: "", address: "", planId: "", adminPassword: "" });
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create business");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.patch(`/api/admin/tenants/${selectedTenant.id}`, {
        name: selectedTenant.name,
        email: selectedTenant.email,
        phone: selectedTenant.phone,
        status: selectedTenant.status,
      });
      toast.success("Business updated");
      fetchAll();
    } catch {
      toast.error("Failed to update");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubscriptionAction = async (action: "renew" | "upgrade", planId?: string) => {
    setIsSubmitting(true);
    try {
      await axios.patch(`/api/admin/tenants/${selectedTenant.id}`, {
        renewSubscription: action === "renew",
        upgradePlanId: action === "upgrade" ? planId : undefined,
      });
      toast.success(`Subscription ${action === "renew" ? "renewed" : "upgraded"} successfully`);
      fetchAll();
      // Refresh selected tenant
      const res = await axios.get(`/api/admin/tenants/${selectedTenant.id}`);
      setSelectedTenant({ ...selectedTenant, ...res.data });
    } catch {
      toast.error("Failed to update subscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync selected industry and addons when selectedTenant changes
  useEffect(() => {
    if (selectedTenant && allModules.length > 0) {
      const tenantModuleNames = selectedTenant.modules?.map((tm: any) => {
        const m = allModules.find((mod) => mod.id === tm.moduleId);
        return m ? m.name : "";
      }) || [];

      const industryKeys = ["RESTAURANT_PRO", "PHARMACY_SPECIAL", "RETAIL_GROCERY", "WHOLESALE_DISTRIBUTION", "GYM_FITNESS_PRO", "BAKERY_PRO"];
      const foundIndustry = industryKeys.find((key) => tenantModuleNames.includes(key)) || "";
      setSelectedIndustry(foundIndustry);

      const addonKeys = ["HR_PAYROLL", "ACCOUNTING_PRO", "MULTI_BRANCH", "INVENTORY_ADVANCED", "CRM_LOYALTY", "ANALYTICS_AI"];
      const foundAddons = addonKeys.filter((key) => tenantModuleNames.includes(key));
      setSelectedAddons(foundAddons);
    }
  }, [selectedTenant, allModules]);

  const handleSaveModules = async (tenantId: string, selectedModuleIds: string[]) => {
    setIsSubmitting(true);
    try {
      await axios.put("/api/admin/tenant-modules", { tenantId, moduleIds: selectedModuleIds });
      toast.success("Modules configuration saved!");
      
      const updatedTenants = tenants.map(t => {
        if (t.id === tenantId) {
          const newModules = selectedModuleIds.map(mid => ({
            tenantId,
            moduleId: mid
          }));
          return { ...t, modules: newModules };
        }
        return t;
      });
      
      setTenants(updatedTenants);
      if (selectedTenant?.id === tenantId) {
        setSelectedTenant(updatedTenants.find(t => t.id === tenantId));
      }
    } catch {
      toast.error("Failed to update modules configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTenant = async (id: string) => {
    setIsSubmitting(true);
    try {
      await axios.delete(`/api/admin/tenants/${id}`);
      toast.success("Business deleted permanently");
      setDeletingTenant(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete business");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspend = async (tenant: any) => {
    const newStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await axios.patch(`/api/admin/tenants/${tenant.id}`, { status: newStatus });
      toast.success(`Business ${newStatus === "ACTIVE" ? "activated" : "suspended"}`);
      fetchAll();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const fetchTenantBranches = async (tenantId: string) => {
    setLoadingBranches(true);
    try {
      // Need an API to get branches by tenant ID for admin.
      // Wait, admin can just call /api/admin/branches?tenantId=...
      const res = await axios.get(`/api/admin/tenants/${tenantId}/branches`);
      setTenantBranches(res.data);
    } catch {
      toast.error("Failed to load branches");
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name) return toast.error("Branch name is required");
    setIsSubmitting(true);
    try {
      await axios.post(`/api/admin/tenants/${selectedTenant.id}/branches`, newBranch);
      toast.success("Branch added successfully");
      setNewBranch({ name: "", location: "", phone: "" });
      fetchTenantBranches(selectedTenant.id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add branch");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openManageModal = (tenant: any) => {
    setSelectedTenant(tenant);
    setIsManageModalOpen(true);
    fetchTenantBranches(tenant.id);
  };

  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredTenants = tenants.filter(
    (t) => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.email?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    }
  );

  const getTenantModuleIds = (tenant: any): string[] =>
    tenant.modules?.map((tm: any) => tm.moduleId) || [];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Tenant Management</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm sm:text-base">Manage businesses, subscriptions, and module access.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl h-11 sm:h-12 px-5 sm:px-6 font-bold shadow-lg shadow-blue-100 w-full sm:w-auto">
          <Plus className="mr-2 w-5 h-5" /> Add New Business
        </Button>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative group max-w-md w-full">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <Input placeholder="Search by name or email..." className="pl-10 h-11 sm:h-12 rounded-xl border-slate-200 bg-white"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="flex bg-slate-200/60 p-1 rounded-xl w-fit">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", statusFilter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
          >
            All ({tenants.length})
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", statusFilter === "ACTIVE" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-900")}
          >
            Active ({tenants.filter(t => t.status === "ACTIVE").length})
          </button>
          <button
            onClick={() => setStatusFilter("SUSPENDED")}
            className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", statusFilter === "SUSPENDED" ? "bg-white text-rose-600 shadow-sm" : "text-slate-600 hover:text-slate-900")}
          >
            Suspended ({tenants.filter(t => t.status === "SUSPENDED").length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-5 px-6 font-bold text-slate-700 min-w-[200px]">Business</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[120px]">Status</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[150px]">Subscription</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[140px]">Modules</TableHead>
                <TableHead className="font-bold text-slate-700">Users</TableHead>
                <TableHead className="text-right font-bold text-slate-700 px-6 min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-400">Loading...</TableCell></TableRow>
            ) : filteredTenants.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-400">No businesses found.</TableCell></TableRow>
            ) : (
              filteredTenants.map((tenant) => (
                <TableRow key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 font-black text-lg">
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{tenant.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-slate-500 text-xs font-medium">
                          {tenant.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{tenant.email}</span>}
                          {tenant.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{tenant.phone}</span>}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {tenant.status === "ACTIVE" ? (
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 px-3 py-1 rounded-lg flex items-center gap-1 w-fit font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-50 text-rose-600 border-rose-100 px-3 py-1 rounded-lg flex items-center gap-1 w-fit font-bold">
                        <XCircle className="w-3 h-3" /> {tenant.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {tenant.subscription ? (
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{tenant.subscription.plan?.name}</p>
                        <p className="text-xs text-slate-400">
                          Exp: {new Date(tenant.subscription.endDate).toLocaleDateString()}
                        </p>
                        <Badge variant="outline" className={`text-[10px] font-bold mt-1 ${
                          new Date(tenant.subscription.endDate) < new Date()
                            ? "bg-rose-50 text-rose-600 border-rose-100"
                            : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        }`}>
                          {new Date(tenant.subscription.endDate) < new Date() ? "Expired" : "Active"}
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50 text-slate-400 font-bold text-xs">No Plan</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 font-bold">
                      <Package className="w-3 h-3 mr-1" />
                      {getTenantModuleIds(tenant).length} modules
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-slate-700">{tenant._count?.users || 0}</span>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline"
                        className="rounded-xl border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold h-8 px-3 text-xs flex items-center gap-1.5 shadow-sm"
                        onClick={() => window.open(`/api/admin/impersonate?tenantId=${tenant.id}`, '_blank')}
                        title="Log into this business portal without password">
                        <LogIn className="w-3.5 h-3.5 text-indigo-600" /> Portal Login
                      </Button>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 rounded-xl"
                        onClick={() => openManageModal(tenant)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {tenant.status === "SUSPENDED" ? (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-8 px-3 text-xs flex items-center gap-1 shadow-sm"
                          onClick={() => handleSuspend(tenant)} title="Re-Activate Business & All User Logins">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Activate Account
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon"
                          className="rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => handleSuspend(tenant)} title="Suspend Business & Lock Logins">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-600 rounded-xl"
                        onClick={() => setDeletingTenant(tenant)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>

      {/* Add Business Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[620px] rounded-3xl p-0 border border-slate-200/80 shadow-2xl overflow-hidden bg-white">
          <div className="p-7 sm:p-9 space-y-7">
            {/* Modal Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <Store className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">New Business</h2>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                    Onboarding
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-500 mt-1">
                  Register a new client onto the Lincoz POS platform.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateBusiness} className="space-y-5">
              {/* Business Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  Business Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    placeholder="e.g. Iron Gym & Fitness Club"
                    className="h-12 rounded-xl bg-slate-50/70 border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 text-base font-semibold px-4 transition-all"
                    required
                    value={newBusiness.name}
                    onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    Admin Email
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@business.com"
                    className="h-12 rounded-xl bg-slate-50/70 border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 text-sm font-semibold px-4 transition-all"
                    value={newBusiness.email}
                    onChange={(e) => setNewBusiness({ ...newBusiness, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    Phone Number
                  </label>
                  <Input
                    placeholder="+92 300 1234567"
                    className="h-12 rounded-xl bg-slate-50/70 border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 text-sm font-semibold px-4 transition-all"
                    value={newBusiness.phone}
                    onChange={(e) => setNewBusiness({ ...newBusiness, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Address / Branch Location
                </label>
                <Input
                  placeholder="e.g. Gulberg III, Main Boulevard, Lahore"
                  className="h-12 rounded-xl bg-slate-50/70 border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 text-sm font-semibold px-4 transition-all"
                  value={newBusiness.address}
                  onChange={(e) => setNewBusiness({ ...newBusiness, address: e.target.value })}
                />
              </div>

              {/* Admin Password & Subscription Plan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    Admin Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Default: admin123"
                      className="h-12 rounded-xl bg-slate-50/70 border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 text-sm font-semibold pl-4 pr-11 transition-all"
                      value={newBusiness.adminPassword}
                      onChange={(e) => setNewBusiness({ ...newBusiness, adminPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    Subscription Plan
                  </label>
                  <Select value={newBusiness.planId} onValueChange={(v) => setNewBusiness({ ...newBusiness, planId: v })}>
                    <SelectTrigger className="h-12 w-full rounded-xl bg-slate-50/70 border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 text-sm font-semibold px-4 transition-all">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent position="popper" align="start" className="w-[var(--radix-select-trigger-width)] max-h-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-1.5 z-[9999]">
                      {plans.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="rounded-xl py-2.5 px-3 font-semibold text-slate-800 hover:bg-slate-100 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">
                          <div className="flex items-center justify-between w-full gap-3">
                            <span className="font-bold text-slate-900">{p.name}</span>
                            <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/50">
                              ${p.price}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-12 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[1.5] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-sm text-white shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Create Business</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Tenant Modal — Tabs: Info, Subscription, Modules */}
      <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-slate-50/50 flex flex-row items-center justify-between">
            <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                {selectedTenant?.name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate">{selectedTenant?.name}</p>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Manage Business</p>
              </div>
            </DialogTitle>
            {selectedTenant && (
              <Button
                type="button"
                onClick={() => window.open(`/api/admin/impersonate?tenantId=${selectedTenant.id}`, '_blank')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-xl text-xs px-4 flex items-center gap-2 shadow-md shadow-indigo-100 shrink-0"
              >
                <LogIn className="w-4 h-4" /> Open Portal
              </Button>
            )}
          </DialogHeader>

          {selectedTenant && (
            <Tabs defaultValue="info" className="flex flex-col h-full overflow-hidden">
              <div className="px-6 pt-4 bg-white border-b border-slate-50">
                <TabsList className="bg-slate-100 rounded-xl p-1 h-auto flex flex-col sm:flex-row gap-1 mb-4">
                  <TabsTrigger value="info" className="flex-1 rounded-lg px-3 py-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Business Info
                  </TabsTrigger>
                  <TabsTrigger value="branches" className="flex-1 rounded-lg px-3 py-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Branches
                  </TabsTrigger>
                  <TabsTrigger value="subscription" className="flex-1 rounded-lg px-3 py-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Subscription
                  </TabsTrigger>
                  <TabsTrigger value="modules" className="flex-1 rounded-lg px-3 py-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Modules
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide max-h-[70vh]">
                <TabsContent value="info" className="mt-0">
                  <form onSubmit={handleUpdateTenant} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Business Name</label>
                      <Input className="h-12 rounded-xl" value={selectedTenant.name}
                        onChange={(e) => setSelectedTenant({ ...selectedTenant, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Email</label>
                        <Input className="h-12 rounded-xl" value={selectedTenant.email || ""}
                          onChange={(e) => setSelectedTenant({ ...selectedTenant, email: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Phone</label>
                        <Input className="h-12 rounded-xl" value={selectedTenant.phone || ""}
                          onChange={(e) => setSelectedTenant({ ...selectedTenant, phone: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Status</label>
                      <Select value={selectedTenant.status} onValueChange={(v) => setSelectedTenant({ ...selectedTenant, status: v })}>
                        <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="SUSPENDED">Suspended</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedTenant.status === "SUSPENDED" && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                          <XCircle className="w-5 h-5 text-rose-500" />
                          <span>This business account is currently SUSPENDED. All user logins are blocked.</span>
                        </div>
                        <Button 
                          type="button"
                          disabled={isSubmitting}
                          onClick={async () => {
                            setSelectedTenant({ ...selectedTenant, status: "ACTIVE" });
                            setIsSubmitting(true);
                            try {
                              await axios.patch(`/api/admin/tenants/${selectedTenant.id}`, { status: "ACTIVE" });
                              toast.success("Business and all associated user logins reactivated successfully!");
                              fetchAll();
                            } catch {
                              toast.error("Failed to reactivate business");
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                          className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Re-Activate Business & All User Accounts
                        </Button>
                      </div>
                    )}
                    <Button disabled={isSubmitting} className="w-full h-12 rounded-xl bg-blue-600 font-bold shadow-lg shadow-blue-100">
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="branches" className="mt-0 space-y-6">
                  <form onSubmit={handleAddBranch} className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 className="font-bold text-slate-900 text-sm">Add New Branch</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Input placeholder="Branch Name *" className="h-11 rounded-xl bg-white" required
                          value={newBranch.name} onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Input placeholder="Phone" className="h-11 rounded-xl bg-white"
                          value={newBranch.phone} onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })} />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Input placeholder="Location / Address" className="h-11 rounded-xl bg-white"
                          value={newBranch.location} onChange={(e) => setNewBranch({ ...newBranch, location: e.target.value })} />
                      </div>
                    </div>
                    <Button disabled={isSubmitting} className="w-full sm:w-auto h-11 px-6 rounded-xl bg-blue-600 font-bold shadow-md shadow-blue-100">
                      {isSubmitting ? "Adding..." : "Add Branch"}
                    </Button>
                  </form>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 mb-2">Existing Branches</h4>
                    {loadingBranches ? (
                      <p className="text-sm text-slate-400">Loading branches...</p>
                    ) : tenantBranches.length === 0 ? (
                      <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center text-sm text-slate-400 font-medium">
                        No branches added yet.
                      </div>
                    ) : (
                      tenantBranches.map((branch) => (
                        <div key={branch.id} className="p-4 rounded-xl border border-slate-100 flex items-center justify-between hover:border-slate-200 transition-colors">
                          <div>
                            <p className="font-bold text-slate-900">{branch.name}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{branch.location || "No address"} • {branch.phone || "No phone"}</p>
                          </div>
                          <Badge variant="outline" className={branch.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50"}>
                            {branch.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="subscription" className="mt-0">
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Current Plan</p>
                        <p className="text-xl font-black text-slate-900">
                          {selectedTenant.subscription?.plan?.name || "No Active Plan"}
                        </p>
                      </div>
                      {selectedTenant.subscription && (
                        <Badge className={`font-bold py-1.5 px-3 rounded-lg ${
                          new Date(selectedTenant.subscription.endDate) < new Date()
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          Exp: {new Date(selectedTenant.subscription.endDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button variant="outline"
                        className="h-16 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-between px-4 transition-all"
                        onClick={() => handleSubscriptionAction("renew")} disabled={isSubmitting}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <RefreshCw className="w-5 h-5" />
                          </div>
                          <div className="text-left min-w-0">
                            <p className="font-bold text-slate-900 text-sm">Renew 1 Year</p>
                            <p className="text-[10px] text-slate-400 font-medium truncate">Extend validity by 1 Year</p>
                          </div>
                        </div>
                      </Button>

                      {plans.find(p => p.billingType === "TRIAL") && (
                        <Button variant="outline"
                          className="h-16 rounded-2xl border-2 border-amber-200 bg-amber-50/50 hover:bg-amber-100 hover:border-amber-400 flex items-center justify-between px-4 transition-all"
                          onClick={() => {
                            const trialPlan = plans.find(p => p.billingType === "TRIAL");
                            if (trialPlan) handleSubscriptionAction("upgrade", trialPlan.id);
                          }} disabled={isSubmitting}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                              <RefreshCw className="w-5 h-5" />
                            </div>
                            <div className="text-left min-w-0">
                              <p className="font-bold text-slate-900 text-sm">Re-Assign Trial</p>
                              <p className="text-[10px] text-amber-700 font-medium truncate">Reset + 7 Days Trial</p>
                            </div>
                          </div>
                        </Button>
                      )}
                    </div>

                    <p className="text-sm font-bold text-slate-900 mt-6">Assign / Change Subscription Plan</p>
                    <div className="space-y-2">
                      {plans.map((plan) => {
                        const isCurrent = plan.id === selectedTenant.subscription?.planId;
                        return (
                          <Button key={plan.id} variant="outline"
                            className={`w-full h-14 rounded-2xl flex items-center justify-between px-5 transition-all ${
                              isCurrent ? "border-blue-500 bg-blue-50/60" : "border-slate-100 hover:border-blue-400 hover:bg-blue-50"
                            }`}
                            onClick={() => handleSubscriptionAction("upgrade", plan.id)}
                            disabled={isSubmitting}>
                            <div className="flex items-center gap-3">
                              <ArrowUpCircle className={`w-5 h-5 ${isCurrent ? "text-blue-600" : "text-slate-400"}`} />
                              <div className="text-left">
                                <p className="font-bold text-slate-900">{plan.name}</p>
                                <p className="text-xs text-slate-400 font-medium">${plan.price}/{plan.billingType}</p>
                              </div>
                            </div>
                            {isCurrent
                              ? <Badge className="bg-blue-600 text-white border-none text-[10px] font-black uppercase">Re-Assign / Active</Badge>
                              : <Badge className="bg-slate-900 text-white text-[10px] font-black uppercase">Select Plan</Badge>}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="modules" className="mt-0">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Select Industry POS Module</label>
                      <Select value={selectedIndustry || "none"} onValueChange={(v) => setSelectedIndustry(v === "none" ? "" : v)}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold px-4">
                          <SelectValue placeholder="Select an Industry" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl z-[200]">
                          <SelectItem value="none" className="rounded-xl font-bold py-2 text-slate-400">None (General POS)</SelectItem>
                          {Object.entries(INDUSTRY_MAP).map(([key, label]) => (
                            <SelectItem key={key} value={key} className="rounded-xl font-bold py-2">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedIndustry && (
                      <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100/50">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {INDUSTRY_MAP[selectedIndustry]} Features
                          </h4>
                          <Badge className="bg-blue-600 text-white text-[10px] font-black uppercase">
                            {selectedAddons.length} Addons
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2.5">
                          {Object.entries(ADDON_MAP).map(([key, label]) => {
                            const isChecked = selectedAddons.includes(key);
                            return (
                              <div key={key}
                                onClick={() => {
                                  if (isChecked) {
                                    setSelectedAddons(selectedAddons.filter((a) => a !== key));
                                  } else {
                                    setSelectedAddons([...selectedAddons, key]);
                                  }
                                }}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group/addon bg-white",
                                  isChecked ? "border-blue-200 shadow-sm" : "border-slate-100 hover:border-blue-100"
                                )}
                              >
                                <span className={cn("text-xs font-bold transition-colors", isChecked ? "text-blue-900" : "text-slate-700 group-hover/addon:text-blue-600")}>
                                  {label}
                                </span>
                                <Switch
                                  checked={isChecked}
                                  onCheckedChange={(v) => {
                                    if (v) {
                                      setSelectedAddons([...selectedAddons, key]);
                                    } else {
                                      setSelectedAddons(selectedAddons.filter((a) => a !== key));
                                    }
                                  }}
                                  className="pointer-events-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={async () => {
                        const activeModuleNames = ["POS_BASIC"];
                        if (selectedIndustry) {
                          activeModuleNames.push(selectedIndustry);
                        }
                        activeModuleNames.push(...selectedAddons);

                        const activeModuleIds = activeModuleNames
                          .map((name) => allModules.find((m) => m.name === name)?.id)
                          .filter(Boolean) as string[];

                        await handleSaveModules(selectedTenant.id, activeModuleIds);
                      }}
                      className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100 text-white mt-4"
                    >
                      {isSubmitting ? "Saving Config..." : "Save Modules Configuration"}
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deletingTenant !== null} onOpenChange={(open) => !open && setDeletingTenant(null)}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-8 border-none bg-white shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-rose-600 tracking-tight flex items-center gap-2">
              <Trash2 className="w-6 h-6" /> Delete Business?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-500 font-bold text-sm leading-relaxed">
              Are you sure you want to permanently delete <span className="text-slate-900 font-black">{deletingTenant?.name}</span>?
            </p>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold leading-relaxed">
              ⚠️ This is a destructive and permanent action. It will delete all users, branches, orders, stock movements, products, and customer records associated with this tenant. It cannot be undone.
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setDeletingTenant(null)}
                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50">
                Cancel
              </Button>
              <Button disabled={isSubmitting} onClick={() => handleDeleteTenant(deletingTenant.id)}
                className="flex-[2] h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black shadow-lg shadow-rose-100">
                {isSubmitting ? "Deleting..." : "Permanently Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
