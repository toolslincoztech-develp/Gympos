"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Users,
  Phone,
  Mail,
  Star,
  ShoppingBag,
  DollarSign,
  Edit2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";
import { toast } from "sonner";

const emptyForm = { name: "", phone: "", email: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("/api/customers");
      setCustomers(res.data);
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const openAdd = () => {
    setEditCustomer(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (c: any) => {
    setEditCustomer(c);
    setForm({ name: c.name, phone: c.phone || "", email: c.email || "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error("Name is required");
    setSubmitting(true);
    try {
      if (editCustomer) {
        await axios.patch(`/api/customers/${editCustomer.id}`, form);
        toast.success("Customer updated");
      } else {
        await axios.post("/api/customers", form);
        toast.success("Customer added");
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    try {
      await axios.delete(`/api/customers/${id}`);
      toast.success("Customer deleted");
      fetchCustomers();
    } catch {
      toast.error("Failed to delete customer");
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = customers.reduce((s: number, c: any) => s + (c.totalSpent || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your customer base and loyalty.</p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-14 px-8 font-black text-lg shadow-xl shadow-blue-100 transition-all active:scale-95"
        >
          <Plus className="mr-2 w-6 h-6" /> Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Total Customers", value: customers.length, icon: Users, color: "blue" },
          { label: "Total Revenue", value: `PKR ${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "emerald" },
          { label: "Avg. Spend", value: customers.length ? `PKR ${(totalRevenue / customers.length).toFixed(2)}` : "$0", icon: ShoppingBag, color: "indigo" },
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
          placeholder="Search by name, phone or email..."
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
                <TableHead className="py-5 px-6 font-bold text-slate-700 min-w-[200px]">Customer</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[180px]">Contact</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[100px]">Orders</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[120px]">Total Spent</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[120px]">Loyalty Pts</TableHead>
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
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((customer, idx) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-bold text-slate-900">{customer.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {customer.phone && (
                        <p className="text-sm font-medium text-slate-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {customer.phone}
                        </p>
                      )}
                      {customer.email && (
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {customer.email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold bg-slate-50">
                      <ShoppingBag className="w-3 h-3 mr-1" />
                      {customer.orderCount || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-black text-slate-900">PKR {(customer.totalSpent || 0).toFixed(2)}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-4 h-4 fill-amber-400" />
                      {customer.loyaltyPts}
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-blue-600 rounded-xl"
                        onClick={() => openEdit(customer)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-rose-600 rounded-xl"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 className="w-4 h-4" />
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
        <DialogContent className="sm:max-w-[500px] rounded-[32px] p-0 border-none shadow-2xl overflow-hidden">
          <div className="bg-white p-8">
            <DialogHeader className="mb-8 text-left">
              <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">
                {editCustomer ? "Edit Customer" : "New Customer"}
              </DialogTitle>
              <p className="text-slate-500 font-bold mt-1">
                {editCustomer ? "Update relationship details." : "Add a new customer to your database."}
              </p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name *</label>
                <Input placeholder="John Doe" className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                <Input placeholder="+92..." className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                <Input type="email" placeholder="customer@email.com" className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="pt-4 flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-slate-500 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button disabled={submitting} className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-xl shadow-blue-100 text-white">
                  {submitting ? "Processing..." : editCustomer ? "Update Profile" : "Save Customer"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
