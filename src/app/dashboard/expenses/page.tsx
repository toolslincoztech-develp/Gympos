"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus, Trash2, DollarSign, TrendingDown,
  Calendar, Filter, Receipt,
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

const CATEGORIES = ["UTILITIES", "SALARY", "SUPPLIES", "RENT", "MARKETING", "MAINTENANCE", "OTHER"];

const catColors: Record<string, string> = {
  UTILITIES: "bg-blue-50 text-blue-600 border-blue-200",
  SALARY: "bg-purple-50 text-purple-600 border-purple-200",
  SUPPLIES: "bg-emerald-50 text-emerald-600 border-emerald-200",
  RENT: "bg-orange-50 text-orange-600 border-orange-200",
  MARKETING: "bg-pink-50 text-pink-600 border-pink-200",
  MAINTENANCE: "bg-amber-50 text-amber-600 border-amber-200",
  OTHER: "bg-slate-50 text-slate-600 border-slate-200",
};

const emptyForm = { category: "OTHER", amount: "", description: "", date: new Date().toISOString().split("T")[0] };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [filterCat, setFilterCat] = useState("ALL");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/expenses?month=${month}`);
      setExpenses(res.data);
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error("Valid amount required");
    setSubmitting(true);
    try {
      await axios.post("/api/expenses", form);
      toast.success("Expense recorded");
      setIsModalOpen(false);
      setForm(emptyForm);
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await axios.delete(`/api/expenses/${id}`);
      toast.success("Expense deleted");
      fetchExpenses();
    } catch { toast.error("Failed to delete"); }
  };

  const filtered = filterCat === "ALL" ? expenses : expenses.filter((e) => e.category === filterCat);
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  // Group by category for summary
  const byCategory = CATEGORIES.map((cat) => ({
    cat,
    total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Expense Tracking</h1>
          <p className="text-slate-500 mt-1 font-medium">Monitor and manage all business expenses.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-14 px-8 font-black text-lg shadow-xl shadow-blue-100 transition-all active:scale-95">
          <Plus className="mr-2 w-6 h-6" /> Add Expense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Total This Month", value: `PKR ${expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}`, icon: TrendingDown, color: "rose" },
          { label: "Filtered Total", value: `PKR ${total.toFixed(2)}`, icon: DollarSign, color: "blue" },
          { label: "Transactions", value: filtered.length, icon: Receipt, color: "indigo" },
        ].map((stat, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
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

      {/* Category Breakdown */}
      {byCategory.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {byCategory.map((c) => (
            <div key={c.cat} className={`p-4 rounded-2xl border ${catColors[c.cat]} flex items-center justify-between`}>
              <p className="font-bold text-sm">{c.cat}</p>
              <p className="font-black">PKR {c.total.toFixed(0)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          <Input type="month" className="h-12 rounded-xl border-slate-200 bg-white w-44"
            value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="h-12 rounded-xl w-48 bg-white border-slate-200">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto scrollbar-hide">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-5 px-6 font-bold text-slate-700 min-w-[200px]">Description</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[140px]">Category</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[100px]">Amount</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[120px]">Date</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[140px]">Added By</TableHead>
                <TableHead className="text-right font-bold text-slate-700 px-6 min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}><TableCell colSpan={6}><div className="h-12 bg-slate-50 rounded-xl animate-pulse" /></TableCell></TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-slate-400 font-medium">
                  No expenses recorded for this period.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((exp, idx) => (
                <motion.tr key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-4 px-6">
                    <p className="font-bold text-slate-900">{exp.description || "—"}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-bold text-xs px-3 py-1 ${catColors[exp.category] || ""}`}>
                      {exp.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-black text-rose-600">PKR {exp.amount.toFixed(2)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-slate-500 font-medium">{new Date(exp.date).toLocaleDateString()}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-semibold text-slate-600">{exp.user?.name || "—"}</p>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-600 rounded-xl"
                      onClick={() => handleDelete(exp.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 border-none shadow-2xl overflow-visible">
          <div className="bg-white p-8 rounded-[2rem]">
            <DialogHeader className="mb-8 text-left">
              <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">Record Expense</DialogTitle>
              <p className="text-slate-500 font-bold mt-1">Track business spending for better financial health.</p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Category *</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5 focus:bg-white transition-all"><SelectValue /></SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} className="rounded-2xl border-slate-100 shadow-2xl z-[100]">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="rounded-xl font-bold py-3 uppercase tracking-tighter cursor-pointer">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Amount (PKR) *</label>
                  <Input type="number" step="0.01" className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5 focus:bg-white transition-all" placeholder="0.00" required
                    value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Date</label>
                  <Input type="date" className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5 focus:bg-white transition-all"
                    value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Description</label>
                <Input className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5 focus:bg-white transition-all" placeholder="What was this expense for?"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="pt-4 flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all">
                  Cancel
                </Button>
                <Button disabled={submitting} className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-xl shadow-blue-100 text-white transition-all active:scale-95">
                  {submitting ? "Processing..." : "Record Expense"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
