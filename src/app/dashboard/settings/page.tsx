"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Building2, 
  Bell, 
  Shield, 
  Save, 
  Loader2, 
  CheckCircle2, 
  CreditCard,
  Clock,
  Sparkles,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  // Notifications (local preference — stored in localStorage)
  const [notifications, setNotifications] = useState({
    lowStock: true,
    newOrder: true,
    dailyReport: false,
    systemAlerts: true,
  });

  const [businessForm, setBusinessForm] = useState({
    ntn: "",
    strn: "",
    cashTaxRate: 16,
    cardTaxRate: 5,
    logoUrl: "",
    receiptWhatsAppString: "",
    receiptAddressString: "",
    receiptRaastString: "",
    receiptBankString: "",
    receiptEasyPaisaString: "",
    receiptJazzCashString: "",
    kitchenPrinterIp: "",
    kitchenPrinterPort: 9100,
    cashierPrinterIp: "",
    cashierPrinterPort: 9100,
  });

  useEffect(() => {
    axios.get("/api/auth/me")
      .then((res) => {
        setUser(res.data);
        setProfileForm({ name: res.data.name || "", phone: res.data.phone || "" });
        if (res.data.tenant) {
          setBusinessForm({
            ntn: res.data.tenant.ntn || "",
            strn: res.data.tenant.strn || "",
            cashTaxRate: res.data.tenant.cashTaxRate ?? 16,
            cardTaxRate: res.data.tenant.cardTaxRate ?? 5,
            logoUrl: res.data.tenant.logoUrl || "",
            receiptWhatsAppString: res.data.tenant.receiptWhatsAppString || "",
            receiptAddressString: res.data.tenant.receiptAddressString || "",
            receiptRaastString: res.data.tenant.receiptRaastString || "",
            receiptBankString: res.data.tenant.receiptBankString || "",
            receiptEasyPaisaString: res.data.tenant.receiptEasyPaisaString || "",
            receiptJazzCashString: res.data.tenant.receiptJazzCashString || "",
            kitchenPrinterIp: res.data.tenant.kitchenPrinterIp || "",
            kitchenPrinterPort: res.data.tenant.kitchenPrinterPort ?? 9100,
            cashierPrinterIp: res.data.tenant.cashierPrinterIp || "",
            cashierPrinterPort: res.data.tenant.cashierPrinterPort ?? 9100,
          });
        }
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));

    // Load notification prefs from localStorage
    const saved = localStorage.getItem("notif_prefs");
    if (saved) setNotifications(JSON.parse(saved));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return toast.error("Name cannot be empty");
    setSaving(true);
    try {
      const res = await axios.patch("/api/users/me", {
        name: profileForm.name,
        phone: profileForm.phone,
      });
      setUser((prev: any) => ({ ...prev, name: res.data.name, phone: res.data.phone }));
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    setSaving(true);
    try {
      const res = await axios.patch("/api/tenants/me", businessForm);
      setUser((prev: any) => ({ ...prev, tenant: { ...prev.tenant, ...res.data } }));
      toast.success("Business settings saved successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update business settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error("All fields required");
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error("Passwords do not match");
    if (pwForm.newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    setSaving(true);
    try {
      await axios.patch("/api/users/me", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Password changed successfully");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    localStorage.setItem("notif_prefs", JSON.stringify(notifications));
    toast.success("Notification preferences saved");
  };

  const getDaysRemaining = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const diffTime = new Date(dateStr).getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} days remaining` : "Expired";
  };

  const tabs = [
    { value: "profile", label: "Profile", icon: User },
    { value: "business", label: "Business", icon: Building2 },
    { value: "subscription", label: "Subscription", icon: CreditCard },
    { value: "notifications", label: "Notifications", icon: Bell },
    { value: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1 font-medium">Manage your account and business preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-100 p-1.5 rounded-2xl flex flex-row flex-wrap items-center w-fit h-auto mb-2">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}
              className="rounded-xl px-6 py-2.5 font-bold text-sm tracking-tight transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 flex items-center gap-2">
              <tab.icon className="w-4 h-4" />{tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Profile Information</h3>
            {loading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}</div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-6 max-w-lg">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-blue-100">
                    {profileForm.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-lg">{profileForm.name}</p>
                    <p className="text-slate-500 font-medium">{user?.role?.replace(/_/g, " ")}</p>
                    <p className="text-slate-400 text-sm">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Full Name</Label>
                  <Input className="h-12 rounded-xl" value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Phone Number</Label>
                  <Input className="h-12 rounded-xl" placeholder="+92 300 0000000" value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Email Address</Label>
                  <Input className="h-12 rounded-xl bg-slate-50" value={user?.email || ""} disabled />
                  <p className="text-xs text-slate-400">Email cannot be changed. Contact admin.</p>
                </div>
                <div className="pt-4">
                  <Button disabled={saving} className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-base px-6 shadow-md shadow-blue-100 text-white transition-all active:scale-95">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Business & Financial Settings</h3>
            <div className="space-y-8 max-w-2xl">
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-amber-900">Important Note for Business Details</p>
                  <p className="text-sm font-medium text-amber-700 mt-1">
                    Core business details (Name, Email, Phone, Address) are managed by Super Admin. For compliance and FBR integration, you can configure your tax identifiers and receipt payment labels below.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                {[
                  { label: "Business Name", value: user?.tenant?.name },
                  { label: "Business Email", value: user?.tenant?.email },
                  { label: "Phone", value: user?.tenant?.phone },
                  { label: "Address", value: user?.tenant?.address },
                ].map((field) => (
                  <div key={field.label} className="space-y-2">
                    <Label className="font-bold text-slate-700">{field.label}</Label>
                    <Input className="h-14 rounded-2xl bg-slate-50 text-slate-500 font-medium px-5" value={field.value || "—"} disabled />
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-4">Tax & FBR Compliance</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 flex items-center justify-between">
                      NTN Number <span className="text-xs font-medium text-slate-400 font-mono">National Tax No.</span>
                    </Label>
                    <Input className="h-14 rounded-2xl bg-white border-slate-200 px-5 font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="e.g. 1234567-8" value={businessForm.ntn} onChange={e => setBusinessForm({...businessForm, ntn: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 flex items-center justify-between">
                      STRN <span className="text-xs font-medium text-slate-400 font-mono">Sales Tax Reg No.</span>
                    </Label>
                    <Input className="h-14 rounded-2xl bg-white border-slate-200 px-5 font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="e.g. 3277876112" value={businessForm.strn} onChange={e => setBusinessForm({...businessForm, strn: e.target.value})} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-4">POS Tax Configuration (%)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Cash Tax Percentage</Label>
                    <Input type="number" step="0.1" className="h-14 rounded-2xl bg-white border-slate-200 px-5 font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="e.g. 16" value={businessForm.cashTaxRate} onChange={e => setBusinessForm({...businessForm, cashTaxRate: parseFloat(e.target.value) || 0})} />
                    <p className="text-xs text-slate-400 font-medium">Standard FBR tax rate applied to cash payments.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Card Tax Percentage</Label>
                    <Input type="number" step="0.1" className="h-14 rounded-2xl bg-white border-slate-200 px-5 font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="e.g. 5" value={businessForm.cardTaxRate} onChange={e => setBusinessForm({...businessForm, cardTaxRate: parseFloat(e.target.value) || 0})} />
                    <p className="text-xs text-slate-400 font-medium">Discounted FBR tax rate applied to card payments.</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-4">Receipt Customization</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Business Logo (PNG/JPG)</Label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                      <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden relative shrink-0">
                        {businessForm.logoUrl ? (
                          <img src={businessForm.logoUrl} className="w-full h-full object-contain" alt="Logo Preview" />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold font-sans">No Logo</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="relative inline-block">
                          <label className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs inline-flex items-center justify-center cursor-pointer shadow-sm active:scale-95 transition-all">
                            Upload PNG/JPG
                            <input 
                              type="file" 
                              accept="image/png, image/jpeg, image/jpg" 
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setBusinessForm(prev => ({ ...prev, logoUrl: reader.result as string }));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold font-sans">Direct upload. Max size 2MB. Recommended dimensions: square.</p>
                      </div>
                      {businessForm.logoUrl && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          className="h-10 px-3 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs"
                          onClick={() => setBusinessForm(prev => ({ ...prev, logoUrl: "" }))}
                        >
                          Remove Logo
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">WhatsApp Number</Label>
                    <Input className="h-14 rounded-2xl bg-white border-slate-200 px-5 font-semibold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="e.g. +92 300 1234567" value={businessForm.receiptWhatsAppString} onChange={e => setBusinessForm({...businessForm, receiptWhatsAppString: e.target.value})} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="font-bold text-slate-700">Custom Address for Receipts</Label>
                    <Input className="h-14 rounded-2xl bg-white border-slate-200 px-5 font-semibold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="e.g. Shop 4, Phase 5 DHA, Lahore" value={businessForm.receiptAddressString} onChange={e => setBusinessForm({...businessForm, receiptAddressString: e.target.value})} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-4">Payment & Bank Accounts (Customer Receipt)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">EasyPaisa Account Details</Label>
                    <Input className="h-14 rounded-2xl bg-white border-slate-200 px-5 font-semibold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="e.g. 0300-1234567 (Ali Khan)" value={businessForm.receiptEasyPaisaString} onChange={e => setBusinessForm({...businessForm, receiptEasyPaisaString: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">JazzCash Account Details</Label>
                    <Input className="h-14 rounded-2xl bg-white border-slate-200 px-5 font-semibold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="e.g. 0300-7654321 (Ali Khan)" value={businessForm.receiptJazzCashString} onChange={e => setBusinessForm({...businessForm, receiptJazzCashString: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Raast ID Key</Label>
                    <Input className="h-14 rounded-2xl bg-white border-slate-200 px-5 font-semibold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="e.g. alikhan@raast" value={businessForm.receiptRaastString} onChange={e => setBusinessForm({...businessForm, receiptRaastString: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Bank Account Details</Label>
                    <Input className="h-14 rounded-2xl bg-white border-slate-200 px-5 font-semibold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="e.g. HBL A/C 1234567890" value={businessForm.receiptBankString} onChange={e => setBusinessForm({...businessForm, receiptBankString: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Printer Configuration */}
              <div className="border border-blue-100 rounded-2xl p-6 bg-blue-50/40 space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <span className="text-blue-600">🖨️</span> Printer Configuration
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">Configure your network printers. Kitchen printer sends KOT directly. Cashier printer sends receipt directly — no print dialog needed.</p>
                </div>

                {/* Kitchen Printer - BIXOLON */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-700 uppercase tracking-wide">Kitchen Printer</span>
                    <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">BIXOLON / Network</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-slate-600 text-sm">IP Address</Label>
                      <Input className="h-12 rounded-xl bg-white border-slate-200 px-4 font-semibold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="e.g. 192.168.1.100" value={businessForm.kitchenPrinterIp} onChange={e => setBusinessForm({...businessForm, kitchenPrinterIp: e.target.value})} />
                      <p className="text-[10px] text-slate-400 font-medium">Enter the IP shown on BIXOLON printer test page.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-slate-600 text-sm">Port</Label>
                      <Input type="number" className="h-12 rounded-xl bg-white border-slate-200 px-4 font-semibold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="9100" value={businessForm.kitchenPrinterPort} onChange={e => setBusinessForm({...businessForm, kitchenPrinterPort: parseInt(e.target.value) || 9100})} />
                      <p className="text-[10px] text-slate-400 font-medium">Default: 9100</p>
                    </div>
                  </div>
                </div>

                {/* Cashier Printer - EPSON */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-700 uppercase tracking-wide">Cashier Printer</span>
                    <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">EPSON / USB or Network</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-slate-600 text-sm">IP Address <span className="font-normal text-slate-400">(if network)</span></Label>
                      <Input className="h-12 rounded-xl bg-white border-slate-200 px-4 font-semibold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="e.g. 192.168.1.101" value={businessForm.cashierPrinterIp} onChange={e => setBusinessForm({...businessForm, cashierPrinterIp: e.target.value})} />
                      <p className="text-[10px] text-slate-400 font-medium">Leave empty if EPSON is USB. It will use browser print dialog.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-slate-600 text-sm">Port</Label>
                      <Input type="number" className="h-12 rounded-xl bg-white border-slate-200 px-4 font-semibold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all" placeholder="9100" value={businessForm.cashierPrinterPort} onChange={e => setBusinessForm({...businessForm, cashierPrinterPort: parseInt(e.target.value) || 9100})} />
                      <p className="text-[10px] text-slate-400 font-medium">Default: 9100</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 font-medium">
                    💡 <strong>EPSON USB Silent Print Tip:</strong> To skip the print dialog automatically, open Chrome shortcut properties and add <code className="bg-amber-100 px-1 rounded">--kiosk-printing</code> to the target. This makes EPSON print silently using Windows default printer.
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button disabled={saving} className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-base px-6 shadow-md shadow-blue-100 text-white transition-all active:scale-95" onClick={handleSaveBusiness}>
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                  Save Business Settings
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Subscription Plan & Expiry Details Tab */}
        <TabsContent value="subscription">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Subscription & Platform Plan</h3>
              <p className="text-slate-500 font-semibold text-sm mt-0.5">Manage your active billing terms and platform feature sets.</p>
            </div>

            {loading ? (
              <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)}</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Plan Overview */}
                <div className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 space-y-4 lg:col-span-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Badge className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold border-none text-[10px] uppercase tracking-wider px-2.5 py-1">
                        Active Account
                      </Badge>
                      <h4 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                        {user?.tenant?.subscription?.plan?.name?.replace(/_/g, " ") || "ACTIVE SUBSCRIPTION"}
                      </h4>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>

                  <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expiration Date</p>
                        <p className="font-bold text-slate-800 text-xs">
                          {user?.tenant?.subscription?.endDate 
                            ? new Date(user.tenant.subscription.endDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })
                            : "May 13, 2027"
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Time Left</p>
                        <p className="font-bold text-slate-800 text-xs">
                          {getDaysRemaining(user?.tenant?.subscription?.endDate || "2027-05-13T10:22:58.000Z")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform Features Card */}
                <div className="p-6 rounded-3xl border border-slate-200/80 bg-white shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Included POS Features</p>
                    <ul className="space-y-2.5">
                      {[
                        "Multi-Terminal POS Cashier Drawer",
                        "Multi-Tier Sizes/Variants Menu Creator",
                        "Dynamic Waste stock manager",
                        "Super Admin dynamic deals mapping",
                        "Real-time KDS preparing kitchen checklist",
                        "Tax compliance NTN & STRN invoices",
                        "Client backup/restores CSV utilities",
                      ].map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Notification Preferences</h3>
            <div className="space-y-4 max-w-lg">
              {[
                { key: "lowStock", label: "Low Stock Alerts", desc: "Get notified when products fall below minimum stock" },
                { key: "newOrder", label: "New Order Notifications", desc: "Receive alerts for every new order placed" },
                { key: "dailyReport", label: "Daily Summary Report", desc: "Receive a daily sales summary" },
                { key: "systemAlerts", label: "System Alerts", desc: "Important system and security notifications" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors">
                  <div>
                    <p className="font-bold text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })}
                  />
                </div>
              ))}
              <div className="pt-4">
                <Button className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-lg px-8 shadow-xl shadow-blue-100 text-white transition-all active:scale-95" onClick={handleSaveNotifications}>
                  <Save className="w-5 h-5 mr-2" /> Save Preferences
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-600" />
                <p className="text-sm font-bold text-emerald-700">Your account is secured with JWT authentication.</p>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Current Password</Label>
                <Input type="password" className="h-12 rounded-xl" placeholder="••••••••"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">New Password</Label>
                <Input type="password" className="h-12 rounded-xl" placeholder="Min. 6 characters"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Confirm New Password</Label>
                <Input type="password" className="h-12 rounded-xl" placeholder="••••••••"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
              </div>
              <div className="pt-4">
                <Button disabled={saving} className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-lg px-8 shadow-xl shadow-emerald-100 text-white transition-all active:scale-95">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Shield className="w-5 h-5 mr-2" />}
                  Secure & Update Password
                </Button>
              </div>
            </form>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
