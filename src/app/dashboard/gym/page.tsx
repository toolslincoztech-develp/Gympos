"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, Users, CheckCircle2, AlertTriangle, Calendar,
  Search, Plus, Activity, UserPlus, CreditCard, ShieldAlert,
  Trash2, PlusCircle, Check, Play, UserCheck, Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils";

export default function GymPage() {
  const [activeTab, setActiveTab] = useState("members");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Data States
  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);

  // Plan Edit State
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Renewal/Upgrade State
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewMember, setRenewMember] = useState<any | null>(null);
  const [renewPlanId, setRenewPlanId] = useState("");
  const [renewStartDate, setRenewStartDate] = useState("");
  const [renewMonths, setRenewMonths] = useState("1");

  // Modals States
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [checkinQuery, setCheckinQuery] = useState("");
  const [foundCheckinMember, setFoundCheckinMember] = useState<any | null>(null);

  // Forms States
  const [newMember, setNewMember] = useState({
    name: "",
    phone: "",
    email: "",
    planId: "",
    startDate: new Date().toISOString().split("T")[0],
    monthsPaid: "1",
  });

  const [newPlan, setNewPlan] = useState({
    name: "",
    price: "",
    durationMonths: "1",
    description: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch all gym data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [custRes, prodRes, checkinRes] = await Promise.all([
        axios.get("/api/customers"),
        axios.get("/api/products"),
        axios.get("/api/gym/checkins").catch(() => ({ data: [] })),
      ]);

      // Filter products of type 'SERVICE' or containing 'membership' or 'plan' as gym plans
      const gymPlans = prodRes.data.filter(
        (p: any) =>
          p.type === "SERVICE" ||
          p.name.toLowerCase().includes("membership") ||
          p.name.toLowerCase().includes("plan") ||
          p.name.toLowerCase().includes("admission")
      );
      setPlans(gymPlans);

      // Parse customers to check membership expiry
      const parsedMembers = custRes.data.map((c: any) => {
        let expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        let status = "ACTIVE";

        if (c.membershipExpiry) {
          expiryDate = new Date(c.membershipExpiry);
          status = expiryDate < new Date() ? "EXPIRED" : "ACTIVE";
        } else if (c.notes && c.notes.includes("Exp:")) {
          try {
            const match = c.notes.match(/Exp:\s*([\d-]+)/);
            if (match && match[1]) {
              expiryDate = new Date(match[1]);
              status = expiryDate < new Date() ? "EXPIRED" : "ACTIVE";
            }
          } catch {}
        }

        return {
          ...c,
          expiryDate: expiryDate.toISOString().split("T")[0],
          status,
          planName: c.planName || c.notes?.split("|")[0]?.trim() || "Standard Membership",
        };
      });

      // Sort members: Expired or expiring soon first
      parsedMembers.sort((a: any, b: any) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

      setMembers(parsedMembers);

      const dbCheckins = Array.isArray(checkinRes.data)
        ? checkinRes.data.map((chk: any) => ({
            id: chk.id,
            name: chk.memberName,
            time: new Date(chk.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: chk.status || "ACTIVE",
          }))
        : [];
      setCheckins(dbCheckins);
    } catch (err) {
      console.error("Gym Data fetch error:", err);
      toast.error("Failed to load Gym Club data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name) return toast.error("Member name is required");
    setSubmitting(true);

    try {
      const selectedPlan = plans.find((p) => p.id === newMember.planId);
      const planName = selectedPlan ? selectedPlan.name : "Standard Membership";
      
      const start = new Date(newMember.startDate);
      const months = parseInt(newMember.monthsPaid) || 1;
      const end = new Date(start);
      end.setMonth(end.getMonth() + months);
      const formattedEnd = end.toISOString().split("T")[0];

      const notesString = `${planName} | Exp: ${formattedEnd}`;

      // Save as customer in DB with dedicated Gym membership columns
      await axios.post("/api/customers", {
        name: newMember.name,
        phone: newMember.phone || null,
        email: newMember.email || null,
        notes: notesString,
        planName,
        planId: selectedPlan?.id || null,
        membershipStart: newMember.startDate,
        membershipExpiry: formattedEnd,
        membershipStatus: "ACTIVE",
      });

      toast.success("Member registered successfully!");
      setIsMemberModalOpen(false);
      setNewMember({
        name: "",
        phone: "",
        email: "",
        planId: "",
        startDate: new Date().toISOString().split("T")[0],
        monthsPaid: "1",
      });
      fetchData();
    } catch (err) {
      toast.error("Failed to add member.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.name || !newPlan.price) return toast.error("Plan details are incomplete");
    setSubmitting(true);

    try {
      if (editingPlanId) {
        // Edit existing plan
        await axios.patch(`/api/products/${editingPlanId}`, {
          name: newPlan.name,
          price: parseFloat(newPlan.price),
          description: newPlan.description || `${newPlan.durationMonths} Months Gym Membership Plan`,
        });
        toast.success("Membership Package updated!");
      } else {
        // Create as product with type: 'SERVICE'
        await axios.post("/api/products", {
          name: newPlan.name,
          price: parseFloat(newPlan.price),
          costPrice: 0,
          stock: 9999, // infinite
          type: "SERVICE",
          sku: "GYM-" + Math.floor(Math.random() * 10000),
          description: newPlan.description || `${newPlan.durationMonths} Months Gym Membership Plan`,
        });
        toast.success("Membership Package added!");
      }

      setIsPlanModalOpen(false);
      setNewPlan({ name: "", price: "", durationMonths: "1", description: "" });
      setEditingPlanId(null);
      fetchData();
    } catch {
      toast.error(editingPlanId ? "Failed to update package." : "Failed to create package.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Delete this membership package? This will not affect existing members, but the package won't be available for new registrations.")) return;
    try {
      await axios.delete(`/api/products/${id}`);
      toast.success("Membership Package deleted successfully!");
      fetchData();
    } catch {
      toast.error("Failed to delete package.");
    }
  };

  const handleRenewMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewMember || !renewPlanId) return toast.error("Plan selection is required");
    setSubmitting(true);

    try {
      const selectedPlan = plans.find((p) => p.id === renewPlanId);
      const planName = selectedPlan ? selectedPlan.name : "Standard Membership";
      
      const start = new Date(renewStartDate);
      const months = parseInt(renewMonths) || 1;
      const end = new Date(start);
      end.setMonth(end.getMonth() + months);
      const formattedEnd = end.toISOString().split("T")[0];

      const notesString = `${planName} | Exp: ${formattedEnd}`;

      await axios.patch(`/api/customers/${renewMember.id}`, {
        notes: notesString,
        planName,
        planId: selectedPlan?.id || null,
        membershipStart: renewStartDate,
        membershipExpiry: formattedEnd,
        membershipStatus: "ACTIVE",
      });

      toast.success("Membership renewed/upgraded successfully!");
      setIsRenewModalOpen(false);
      setRenewMember(null);
      setRenewPlanId("");
      setRenewMonths("1");
      fetchData();
    } catch (err) {
      toast.error("Failed to renew membership");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Remove this member permanently?")) return;
    try {
      await axios.delete(`/api/customers/${id}`);
      toast.success("Member removed");
      fetchData();
    } catch {
      toast.error("Failed to delete member");
    }
  };

  // Perform quick check-in check
  const handleCheckinSearch = () => {
    const term = checkinQuery.toLowerCase().trim();
    if (!term) return;

    const matched = members.find(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        (m.phone && m.phone.includes(term))
    );

    if (matched) {
      setFoundCheckinMember(matched);
    } else {
      setFoundCheckinMember({ error: true, name: checkinQuery });
    }
  };

  const handleConfirmCheckin = async (memberOverride?: any) => {
    const targetMember = memberOverride || foundCheckinMember;
    if (!targetMember || targetMember.error) return;

    if (targetMember.status === "EXPIRED") {
      toast.error("Cannot check in. Membership has expired!");
      return;
    }

    try {
      const res = await axios.post("/api/gym/checkins", {
        customerId: targetMember.id,
        memberName: targetMember.name,
        memberPhone: targetMember.phone || null,
        planName: targetMember.planName || "Standard Membership",
        status: targetMember.status,
      });

      const chk = res.data;
      const timeString = new Date(chk.checkedInAt || Date.now()).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      setCheckins((prev) => [
        {
          id: chk.id || String(prev.length + 1),
          name: targetMember.name,
          time: timeString,
          status: targetMember.status,
        },
        ...prev,
      ]);

      toast.success(`${targetMember.name} checked in successfully!`);
      setFoundCheckinMember(null);
      setCheckinQuery("");
    } catch {
      toast.error("Failed to record check-in");
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.phone && m.phone.includes(search))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-blue-600 animate-pulse" /> Gym & Fitness Club POS
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Manage members, active membership plans, check-ins, and club stats.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsPlanModalOpen(true)}
            variant="outline"
            className="rounded-xl h-12 px-5 font-bold border-slate-200 text-slate-600"
          >
            <PlusCircle className="mr-2 w-5 h-5 text-blue-600" /> New Package
          </Button>

          <Button
            onClick={() => {
              if (plans.length === 0) {
                toast.error("Please add a membership package plan first.");
                setIsPlanModalOpen(true);
                return;
              }
              setIsMemberModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 px-8 font-black text-lg shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center"
          >
            <UserPlus className="mr-2 w-6 h-6" /> Register Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Members</p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{members.length}</h4>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Checked In Today</p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{checkins.length}</h4>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Active Packages</p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{plans.length}</h4>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1.5 rounded-2xl mb-6 flex flex-row flex-wrap items-center w-fit h-auto">
          <TabsTrigger value="members" className="rounded-xl px-6 py-2.5 font-bold text-sm tracking-tight transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 flex-1 min-w-[150px]">
            <Users className="w-4 h-4 mr-2 inline-block" /> Active Members
          </TabsTrigger>
          <TabsTrigger value="checkins" className="rounded-xl px-6 py-2.5 font-bold text-sm tracking-tight transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 flex-1 min-w-[150px]">
            <UserCheck className="w-4 h-4 mr-2 inline-block" /> Check-in Desk
          </TabsTrigger>
          <TabsTrigger value="plans" className="rounded-xl px-6 py-2.5 font-bold text-sm tracking-tight transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 flex-1 min-w-[150px]">
            <Flame className="w-4 h-4 mr-2 inline-block" /> Packages / Plans
          </TabsTrigger>
        </TabsList>

        {/* Tab content: Members List */}
        <TabsContent value="members" className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 flex items-center justify-between gap-6">
              <div className="relative group w-full sm:max-w-xs">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  placeholder="Search members by name or phone..."
                  className="pl-11 h-14 rounded-2xl bg-white border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-base font-bold"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-hide">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700">Member Name</TableHead>
                    <TableHead className="font-bold text-slate-700">Contact</TableHead>
                    <TableHead className="font-bold text-slate-700">Package Type</TableHead>
                    <TableHead className="font-bold text-slate-700">Expiry Date</TableHead>
                    <TableHead className="font-bold text-slate-700">Membership Status</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center text-slate-400 font-medium">
                        Loading member records...
                      </TableCell>
                    </TableRow>
                  ) : filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center text-slate-400 font-medium">
                        No members found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((m) => (
                      <TableRow key={m.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-bold text-slate-900">{m.name}</TableCell>
                        <TableCell className="text-slate-500 font-semibold">{m.phone || "No Phone"}</TableCell>
                        <TableCell className="font-bold text-blue-600">{m.planName}</TableCell>
                        <TableCell className="text-slate-500 font-semibold">{m.expiryDate}</TableCell>
                        <TableCell>
                          {(() => {
                            if (m.status === "EXPIRED") {
                              return <Badge className="font-bold bg-rose-50 text-rose-600 border-rose-100">EXPIRED</Badge>;
                            }
                            const diffTime = new Date(m.expiryDate).getTime() - new Date().setHours(0,0,0,0);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            if (diffDays <= 5 && diffDays >= 0) {
                              return <Badge className="font-bold bg-amber-50 text-amber-600 border-amber-100 animate-pulse">EXPIRING SOON ({diffDays} Days)</Badge>;
                            }
                            return <Badge className="font-bold bg-emerald-50 text-emerald-600 border-emerald-100">ACTIVE</Badge>;
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRenewMember(m);
                                setRenewPlanId(plans.find((p) => p.name === m.planName)?.id || "");
                                const todayStr = new Date().toISOString().split("T")[0];
                                setRenewStartDate(m.status === "ACTIVE" ? m.expiryDate : todayStr);
                                setRenewMonths("1");
                                setIsRenewModalOpen(true);
                              }}
                              className="rounded-xl font-bold h-9 bg-blue-50 text-blue-600 hover:bg-blue-100"
                            >
                              Renew / Upgrade
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={m.status === "EXPIRED"}
                              onClick={() => handleConfirmCheckin(m)}
                              className="rounded-xl font-bold h-9 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            >
                              Check In
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMember(m.id)}
                              className="rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-9 w-9"
                            >
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
        </TabsContent>

        {/* Tab content: Check-in desk */}
        <TabsContent value="checkins" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 rounded-3xl border border-slate-200 shadow-sm bg-white lg:col-span-1 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-600" /> Scanner & Check-in
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Enter member name or phone to scan check-in credential.</p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Scan / type phone number..."
                className="h-12 rounded-xl"
                value={checkinQuery}
                onChange={(e) => setCheckinQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCheckinSearch()}
              />
              <Button onClick={handleCheckinSearch} className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                Check
              </Button>
            </div>

            {foundCheckinMember && (
              <div className={cn(
                "p-5 rounded-2xl border text-center space-y-4 animate-in fade-in zoom-in-95",
                foundCheckinMember.error
                  ? "bg-slate-50 border-slate-200"
                  : foundCheckinMember.status === "ACTIVE"
                    ? "bg-emerald-50/50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50/50 border-rose-200 text-rose-800"
              )}>
                {foundCheckinMember.error ? (
                  <>
                    <ShieldAlert className="w-10 h-10 mx-auto text-slate-400" />
                    <div>
                      <p className="font-bold text-slate-700">Member Not Found</p>
                      <p className="text-xs text-slate-400 mt-1">Could not find record: {foundCheckinMember.name}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={cn("w-14 h-14 rounded-full mx-auto flex items-center justify-center text-white font-bold", foundCheckinMember.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500")}>
                      {foundCheckinMember.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-lg leading-tight">{foundCheckinMember.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{foundCheckinMember.planName}</p>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">Exp: {foundCheckinMember.expiryDate}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setFoundCheckinMember(null)} className="flex-1 h-10 rounded-xl font-bold bg-white border-slate-200 text-slate-600">
                        Cancel
                      </Button>
                      <Button
                        disabled={foundCheckinMember.status === "EXPIRED"}
                        onClick={() => handleConfirmCheckin()}
                        className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      >
                        Check In
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>

          <Card className="p-6 rounded-3xl border border-slate-200 shadow-sm bg-white lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-600" /> Today's Check-ins Log
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-slate-700">Member Name</TableHead>
                    <TableHead className="font-bold text-slate-700">Check-in Time</TableHead>
                    <TableHead className="font-bold text-slate-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkins.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-bold text-slate-900">{c.name}</TableCell>
                      <TableCell className="text-slate-500 font-semibold">{c.time}</TableCell>
                      <TableCell>
                        <Badge className={c.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}>
                          {c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab content: Plans list */}
        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-6 rounded-3xl border border-slate-200 shadow-sm bg-white relative overflow-hidden flex flex-col justify-between h-48 group hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-blue-50 text-blue-600 font-bold border-blue-100 uppercase text-[9px] tracking-wider mb-2">Gym Package</Badge>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingPlanId(plan.id);
                          setNewPlan({
                            name: plan.name,
                            price: String(plan.price),
                            durationMonths: plan.description ? (plan.description.match(/(\d+)\s*Months/)?.[1] || "1") : "1",
                            description: plan.description || "",
                          });
                          setIsPlanModalOpen(true);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                        title="Edit Package"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-xs text-rose-500 hover:text-rose-700 font-bold"
                        title="Delete Package"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 truncate leading-tight">{plan.name}</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1 leading-snug line-clamp-2">{plan.description}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-3 shrink-0">
                  <p className="text-xl font-black text-blue-600">PKR {plan.price.toFixed(2)}</p>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                </div>
              </Card>
            ))}

            {plans.length === 0 && (
              <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-medium">
                No Gym packages found. Click "New Package" above to create one.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: Add Member */}
      <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-8 border-none bg-white shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-blue-600" /> Register Member
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Member Name *</label>
              <Input required className="h-12 rounded-xl" placeholder="e.g. Asad Jameel"
                value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Contact Number</label>
                <Input className="h-12 rounded-xl" placeholder="e.g. 03001234567"
                  value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <Input className="h-12 rounded-xl" placeholder="e.g. asad@gmail.com" type="email"
                  value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Start Date *</label>
                <Input required className="h-12 rounded-xl" type="date"
                  value={newMember.startDate} onChange={(e) => setNewMember({ ...newMember, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Duration (Months) *</label>
                <Input required className="h-12 rounded-xl" type="number" min="1" max="12"
                  value={newMember.monthsPaid} onChange={(e) => setNewMember({ ...newMember, monthsPaid: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Select Membership Plan *</label>
              <select
                className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 outline-none font-bold"
                value={newMember.planId}
                onChange={(e) => setNewMember({ ...newMember, planId: e.target.value })}
                required
              >
                <option value="">-- Choose Plan --</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — PKR {p.price}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsMemberModalOpen(false)}
                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50">
                Cancel
              </Button>
              <Button disabled={submitting} type="submit"
                className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-100">
                {submitting ? "Registering..." : "Confirm & Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Add/Edit Plan */}
      <Dialog open={isPlanModalOpen} onOpenChange={(open) => {
        setIsPlanModalOpen(open);
        if (!open) {
          setEditingPlanId(null);
          setNewPlan({ name: "", price: "", durationMonths: "1", description: "" });
        }
      }}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-8 border-none bg-white shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Plus className="w-6 h-6 text-blue-600" /> {editingPlanId ? "Edit Gym Package" : "Create Gym Package"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPlan} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Package Name *</label>
              <Input required className="h-12 rounded-xl" placeholder="e.g. Gold Monthly Plan"
                value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Price (PKR) *</label>
                <Input required className="h-12 rounded-xl" placeholder="e.g. 3500" type="number"
                  value={newPlan.price} onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Duration (Months) *</label>
                <Input required className="h-12 rounded-xl" type="number" min="1" max="36"
                  value={newPlan.durationMonths} onChange={(e) => setNewPlan({ ...newPlan, durationMonths: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Description (Optional)</label>
              <Input className="h-12 rounded-xl" placeholder="e.g. Access to Cardio & Gym weights with coach guidance"
                value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsPlanModalOpen(false)}
                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50">
                Cancel
              </Button>
              <Button disabled={submitting} type="submit"
                className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-100">
                {submitting ? "Saving..." : editingPlanId ? "Update Package" : "Save Package"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Renew / Upgrade Membership */}
      <Dialog open={isRenewModalOpen} onOpenChange={(open) => {
        setIsRenewModalOpen(open);
        if (!open) {
          setRenewMember(null);
          setRenewPlanId("");
          setRenewStartDate("");
          setRenewMonths("1");
        }
      }}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-8 border-none bg-white shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-blue-600" /> Renew / Upgrade Membership
            </DialogTitle>
          </DialogHeader>
          {renewMember && (
            <form onSubmit={handleRenewMembership} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Member Name</p>
                <p className="font-black text-slate-800 text-lg">{renewMember.name}</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Plan</p>
                    <p className="font-bold text-blue-600 text-sm">{renewMember.planName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Expiry</p>
                    <p className="font-bold text-slate-700 text-sm">{renewMember.expiryDate}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Select Membership Plan *</label>
                <select
                  className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 outline-none font-bold"
                  value={renewPlanId}
                  onChange={(e) => setRenewPlanId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Plan --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — PKR {p.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Renewal Start Date *</label>
                  <Input required className="h-12 rounded-xl" type="date"
                    value={renewStartDate} onChange={(e) => setRenewStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Duration (Months) *</label>
                  <Input required className="h-12 rounded-xl" type="number" min="1" max="12"
                    value={renewMonths} onChange={(e) => setRenewMonths(e.target.value)} />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsRenewModalOpen(false)}
                  className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button disabled={submitting} type="submit"
                  className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-100">
                  {submitting ? "Processing..." : "Confirm Renewal"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
