"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Shield,
  Bell,
  Globe,
  Database,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    platformName: "Lincoz POS",
    supportEmail: "support@lincozpos.com",
    maintenanceMode: false,
    allowNewRegistrations: true,
    trialDays: 14,
  });
  const [securitySettings, setSecuritySettings] = useState({
    requireEmailVerification: false,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    twoFactorAuth: false,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    newTenantAlert: true,
    subscriptionExpiry: true,
    systemErrors: true,
    weeklyReport: false,
  });

  const handleSave = async (section: string) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success(`${section} settings saved successfully`);
    setSaving(false);
  };

  const tabs = [
    { value: "general", label: "General", icon: Globe },
    { value: "security", label: "Security", icon: Shield },
    { value: "notifications", label: "Notifications", icon: Bell },
    { value: "system", label: "System", icon: Database },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
        <p className="text-slate-500 mt-1 font-medium">Configure global platform settings and preferences.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 rounded-2xl p-1 h-auto gap-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-xl px-5 py-2.5 font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-100 flex items-center gap-2"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-6">General Settings</h3>
            <div className="space-y-6 max-w-lg">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Platform Name</Label>
                <Input
                  className="h-12 rounded-xl"
                  value={systemSettings.platformName}
                  onChange={(e) => setSystemSettings({ ...systemSettings, platformName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Support Email</Label>
                <Input
                  type="email"
                  className="h-12 rounded-xl"
                  value={systemSettings.supportEmail}
                  onChange={(e) => setSystemSettings({ ...systemSettings, supportEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Trial Period (days)</Label>
                <Input
                  type="number"
                  className="h-12 rounded-xl"
                  value={systemSettings.trialDays}
                  onChange={(e) => setSystemSettings({ ...systemSettings, trialDays: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-4">
                {[
                  { key: "maintenanceMode", label: "Maintenance Mode", desc: "Temporarily disable access for all tenants" },
                  { key: "allowNewRegistrations", label: "Allow New Registrations", desc: "Enable or disable new tenant sign-ups" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900">{item.label}</p>
                      <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
                    </div>
                    <Switch
                      checked={systemSettings[item.key as keyof typeof systemSettings] as boolean}
                      onCheckedChange={(v) => setSystemSettings({ ...systemSettings, [item.key]: v })}
                    />
                  </div>
                ))}
              </div>
              <Button
                disabled={saving}
                onClick={() => handleSave("General")}
                className="h-12 rounded-xl bg-blue-600 font-bold px-8"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Settings
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-6">Security Settings</h3>
            <div className="space-y-6 max-w-lg">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-sm font-bold text-emerald-700">JWT authentication is active. All tokens expire in {securitySettings.sessionTimeout}h.</p>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Session Timeout (hours)</Label>
                <Input
                  type="number"
                  className="h-12 rounded-xl"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Max Login Attempts</Label>
                <Input
                  type="number"
                  className="h-12 rounded-xl"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-4">
                {[
                  { key: "requireEmailVerification", label: "Require Email Verification", desc: "New users must verify email before login" },
                  { key: "twoFactorAuth", label: "Two-Factor Authentication", desc: "Require 2FA for all admin accounts" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900">{item.label}</p>
                      <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
                    </div>
                    <Switch
                      checked={securitySettings[item.key as keyof typeof securitySettings] as boolean}
                      onCheckedChange={(v) => setSecuritySettings({ ...securitySettings, [item.key]: v })}
                    />
                  </div>
                ))}
              </div>
              <Button
                disabled={saving}
                onClick={() => handleSave("Security")}
                className="h-12 rounded-xl bg-blue-600 font-bold px-8"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Security Settings
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-6">Admin Notification Settings</h3>
            <div className="space-y-4 max-w-lg">
              {[
                { key: "newTenantAlert", label: "New Tenant Registered", desc: "Alert when a new business signs up" },
                { key: "subscriptionExpiry", label: "Subscription Expiry Alerts", desc: "Notify 7 days before subscription expires" },
                { key: "systemErrors", label: "System Error Alerts", desc: "Critical system errors and failures" },
                { key: "weeklyReport", label: "Weekly Summary Report", desc: "Receive weekly platform analytics" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors">
                  <div>
                    <p className="font-bold text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                    onCheckedChange={(v) => setNotificationSettings({ ...notificationSettings, [item.key]: v })}
                  />
                </div>
              ))}
              <Button
                disabled={saving}
                onClick={() => handleSave("Notification")}
                className="h-12 rounded-xl bg-blue-600 font-bold px-8 mt-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Preferences
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* System */}
        <TabsContent value="system">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-6">System Information</h3>
            <div className="space-y-4 max-w-lg">
              {[
                { label: "Platform Version", value: "1.0.0" },
                { label: "Database", value: "PostgreSQL (Supabase)" },
                { label: "ORM", value: "Prisma 7.x" },
                { label: "Framework", value: "Next.js 16 (App Router)" },
                { label: "Auth", value: "Custom JWT (httpOnly Cookie)" },
                { label: "Deployment", value: "Vercel" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="font-bold text-slate-700">{item.label}</p>
                  <p className="font-mono text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200">{item.value}</p>
                </div>
              ))}

              <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800">Setup Endpoint</p>
                  <p className="text-sm text-amber-700 font-medium mt-1">
                    The <code className="bg-amber-100 px-1 rounded">/api/admin/setup</code> endpoint seeds the database. 
                    Disable it in production after initial setup.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
