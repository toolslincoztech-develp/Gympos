"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, Edit2, UserX, UserCheck,
  Shield, Users, ChevronDown, Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import axios from "axios";
import { toast } from "sonner";

const ROLES = ["TENANT_ADMIN", "BRANCH_MANAGER", "CASHIER", "KITCHEN_STAFF", "WAIT_STAFF", "HR_STAFF", "INVENTORY_MANAGER", "ACCOUNTANT"];

const roleColors: Record<string, string> = {
  TENANT_ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
  BRANCH_MANAGER: "bg-blue-50 text-blue-700 border-blue-200",
  CASHIER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  KITCHEN_STAFF: "bg-orange-50 text-orange-700 border-orange-200",
  WAIT_STAFF: "bg-cyan-50 text-cyan-700 border-cyan-200",
  HR_STAFF: "bg-pink-50 text-pink-700 border-pink-200",
  INVENTORY_MANAGER: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ACCOUNTANT: "bg-amber-50 text-amber-700 border-amber-200",
};

const emptyForm = { name: "", email: "", password: "", userRole: "CASHIER", phone: "", branchId: "" };

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    try {
      const [usersRes, branchesRes] = await Promise.all([
        axios.get("/api/users"),
        axios.get("/api/branches"),
      ]);
      setUsers(usersRes.data);
      setBranches(branchesRes.data);
    } catch {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => {
    setEditUser(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: "", userRole: u.role, phone: u.phone || "", branchId: u.branch?.id || "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return toast.error("Name and email are required");
    if (!editUser && !form.password) return toast.error("Password is required for new users");
    setSubmitting(true);
    try {
      const apiPayload = { ...form, branchId: form.branchId === "none" ? undefined : form.branchId };
      if (editUser) {
        await axios.patch(`/api/users/${editUser.id}`, apiPayload);
        toast.success("Staff updated");
      } else {
        await axios.post("/api/users", apiPayload);
        toast.success("Staff member added");
      }
      setIsModalOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (u: any) => {
    const newStatus = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await axios.patch(`/api/users/${u.id}`, { status: newStatus });
      toast.success(`User ${newStatus === "ACTIVE" ? "activated" : "deactivated"}`);
      fetchAll();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your team, roles, and access permissions.</p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-14 px-8 font-black text-lg shadow-xl shadow-blue-100 transition-all active:scale-95"
        >
          <Plus className="mr-2 w-6 h-6" /> Add Staff Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Total Staff", value: users.length, icon: Users, color: "blue" },
          { label: "Active", value: activeCount, icon: UserCheck, color: "emerald" },
          { label: "Inactive", value: users.length - activeCount, icon: UserX, color: "rose" },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-100 text-${stat.color}-600 flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{loading ? "..." : stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md group">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
        <Input
          placeholder="Search by name, email or role..."
          className="pl-10 h-12 rounded-xl border-slate-200 bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto scrollbar-hide">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-5 px-6 font-bold text-slate-700 min-w-[200px]">Staff Member</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[160px]">Role</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[150px]">Branch</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[120px]">Status</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[130px]">Joined</TableHead>
                <TableHead className="text-right font-bold text-slate-700 px-6 min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}><div className="h-12 bg-slate-50 rounded-xl animate-pulse" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-slate-400 font-medium">
                  No staff members found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user, idx) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-bold text-xs px-3 py-1 ${roleColors[user.role] || "bg-slate-50 text-slate-600"}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-semibold text-slate-600">{user.branch?.name || "—"}</p>
                  </TableCell>
                  <TableCell>
                    {user.status === "ACTIVE" ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 font-bold">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-slate-500 font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost" size="icon"
                        className="text-slate-400 hover:text-blue-600 rounded-xl"
                        onClick={() => openEdit(user)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className={`rounded-xl ${user.status === "ACTIVE" ? "text-slate-400 hover:text-rose-600" : "text-slate-400 hover:text-emerald-600"}`}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.status === "ACTIVE" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-[2rem] p-0 border-none shadow-2xl overflow-visible">
          <div className="bg-white p-8 rounded-[2rem]">
            <DialogHeader className="mb-8 text-left">
              <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">
                {editUser ? "Edit Staff Member" : "New Staff Member"}
              </DialogTitle>
              <p className="text-slate-500 font-bold mt-1">
                {editUser ? "Modify access permissions and details." : "Add a new member to your business team."}
              </p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name *</label>
                  <Input className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5 focus:bg-white transition-all" placeholder="John Doe"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Phone</label>
                  <Input className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5 focus:bg-white transition-all" placeholder="+92..."
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address *</label>
                  <Input type="email" className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5 focus:bg-white transition-all" placeholder="staff@business.com"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required disabled={!!editUser} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Password {editUser ? "" : "*"}</label>
                  <Input type="password" className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5 focus:bg-white transition-all" placeholder="••••••••"
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editUser} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Role *</label>
                  <Select value={form.userRole} onValueChange={(v) => setForm({ ...form, userRole: v })}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5 focus:bg-white transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="rounded-2xl border-slate-100 shadow-2xl z-[100] max-h-[300px]">
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="rounded-xl font-bold py-3 uppercase tracking-tighter cursor-pointer">{r.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Branch</label>
                  <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5 focus:bg-white transition-all">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="rounded-2xl border-slate-100 shadow-2xl z-[100]">
                      <SelectItem value="none" className="rounded-xl font-bold py-3 uppercase tracking-tighter text-slate-400 italic cursor-pointer">No specific branch</SelectItem>
                      {branches.map((b: any) => (
                        <SelectItem key={b.id} value={b.id} className="rounded-xl font-bold py-3 uppercase tracking-tighter cursor-pointer">{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-11 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all">
                  Cancel
                </Button>
                <Button disabled={submitting} className="flex-[2] h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-base shadow-md shadow-blue-100 text-white transition-all active:scale-95">
                  {submitting ? "Processing..." : editUser ? "Update Staff" : "Add Staff Member"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
