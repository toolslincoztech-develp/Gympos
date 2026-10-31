"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, Edit2, Trash2, Users, DollarSign,
  Calendar, CheckCircle2, XCircle, Clock, AlertCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { toast } from "sonner";

const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "HALF_DAY"];

const attColors: Record<string, string> = {
  PRESENT: "bg-emerald-50 text-emerald-600 border-emerald-200",
  ABSENT: "bg-rose-50 text-rose-600 border-rose-200",
  LATE: "bg-amber-50 text-amber-600 border-amber-200",
  HALF_DAY: "bg-blue-50 text-blue-600 border-blue-200",
};

const attIcons: Record<string, React.ReactNode> = {
  PRESENT: <CheckCircle2 className="w-3 h-3" />,
  ABSENT: <XCircle className="w-3 h-3" />,
  LATE: <Clock className="w-3 h-3" />,
  HALF_DAY: <AlertCircle className="w-3 h-3" />,
};

const emptyEmp = { name: "", position: "", salary: "", joinDate: "" };

export default function HRPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [attLoading, setAttLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<any>(null);
  const [form, setForm] = useState(emptyEmp);
  const [submitting, setSubmitting] = useState(false);
  const [attDate, setAttDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("/api/employees");
      setEmployees(res.data);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = useCallback(async () => {
    setAttLoading(true);
    try {
      const res = await axios.get(`/api/attendance?date=${attDate}`);
      setAttendance(res.data);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setAttLoading(false);
    }
  }, [attDate]);

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const openAdd = () => { setEditEmp(null); setForm(emptyEmp); setIsModalOpen(true); };
  const openEdit = (e: any) => {
    setEditEmp(e);
    setForm({ name: e.name, position: e.position, salary: String(e.salary), joinDate: e.joinDate?.split("T")[0] || "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitting(true);
    try {
      if (editEmp) {
        await axios.patch(`/api/employees/${editEmp.id}`, form);
        toast.success("Employee updated");
      } else {
        await axios.post("/api/employees", form);
        toast.success("Employee added");
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this employee?")) return;
    try {
      await axios.delete(`/api/employees/${id}`);
      toast.success("Employee removed");
      fetchEmployees();
    } catch { toast.error("Failed to delete"); }
  };

  const markAttendance = async (employeeId: string, status: string) => {
    try {
      await axios.post("/api/attendance", { employeeId, status, date: attDate });
      toast.success("Attendance marked");
      fetchAttendance();
    } catch { toast.error("Failed to mark attendance"); }
  };

  const filtered = employees.filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.position.toLowerCase().includes(search.toLowerCase())
  );

  const totalSalary = employees.reduce((s, e) => s + e.salary, 0);
  const presentToday = attendance.filter((e) => e.attendances?.[0]?.status === "PRESENT").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">HR & Payroll</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage employees, attendance, and payroll.</p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-14 px-8 font-black text-lg shadow-xl shadow-blue-100 transition-all active:scale-95 text-white">
          <Plus className="mr-2 w-6 h-6" /> Add Employee
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[
          { label: "Total Employees", value: employees.length, icon: Users, color: "blue" },
          { label: "Monthly Payroll", value: `PKR ${totalSalary.toLocaleString()}`, icon: DollarSign, color: "emerald" },
          { label: "Present Today", value: `${presentToday}/${employees.length}`, icon: CheckCircle2, color: "indigo" },
        ].map((stat, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
            className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-${stat.color}-100 text-${stat.color}-600 flex items-center justify-center shrink-0`}>
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900">{loading ? "..." : stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 rounded-2xl p-1 h-auto gap-1">
          <TabsTrigger value="employees" className="rounded-xl px-5 py-2.5 font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            <Users className="w-4 h-4 mr-2" /> Employees
          </TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-xl px-5 py-2.5 font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            <Calendar className="w-4 h-4 mr-2" /> Attendance
          </TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees">
          <div className="space-y-4">
            <div className="relative max-w-md group">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <Input placeholder="Search employees..." className="pl-10 h-12 rounded-xl border-slate-200 bg-white"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="py-5 px-6 font-bold text-slate-700 min-w-[180px]">Employee</TableHead>
                      <TableHead className="font-bold text-slate-700 min-w-[140px]">Position</TableHead>
                      <TableHead className="font-bold text-slate-700 min-w-[120px]">Salary</TableHead>
                      <TableHead className="font-bold text-slate-700 min-w-[120px]">Join Date</TableHead>
                      <TableHead className="text-right font-bold text-slate-700 px-6 min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={5}><div className="h-12 bg-slate-50 rounded-xl animate-pulse" /></TableCell></TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-40 text-center text-slate-400 font-medium">No employees found.</TableCell></TableRow>
                  ) : (
                    filtered.map((emp, idx) => (
                      <motion.tr key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                              {emp.name.charAt(0)}
                            </div>
                            <p className="font-bold text-slate-900">{emp.name}</p>
                          </div>
                        </TableCell>
                        <TableCell><p className="font-semibold text-slate-600">{emp.position}</p></TableCell>
                        <TableCell><p className="font-black text-slate-900">PKR {emp.salary.toLocaleString()}/mo</p></TableCell>
                        <TableCell><p className="text-sm text-slate-500">{new Date(emp.joinDate).toLocaleDateString()}</p></TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 rounded-xl" onClick={() => openEdit(emp)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-600 rounded-xl" onClick={() => handleDelete(emp.id)}>
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
        </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                <Input type="date" className="h-12 rounded-xl border-slate-200 bg-white w-48"
                  value={attDate} onChange={(e) => setAttDate(e.target.value)} />
              </div>
              <p className="text-sm font-bold text-slate-500">
                {presentToday} present · {attendance.filter(e => e.attendances?.[0]?.status === "ABSENT").length} absent
              </p>
            </div>
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="py-5 px-6 font-bold text-slate-700 min-w-[180px]">Employee</TableHead>
                      <TableHead className="font-bold text-slate-700 min-w-[140px]">Position</TableHead>
                      <TableHead className="font-bold text-slate-700 min-w-[120px]">Status</TableHead>
                      <TableHead className="font-bold text-slate-700 px-6 min-w-[300px]">Mark Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {attLoading ? (
                    [...Array(4)].map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={4}><div className="h-12 bg-slate-50 rounded-xl animate-pulse" /></TableCell></TableRow>
                    ))
                  ) : attendance.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="h-40 text-center text-slate-400">No employees found.</TableCell></TableRow>
                  ) : (
                    attendance.map((emp) => {
                      const todayAtt = emp.attendances?.[0];
                      return (
                        <TableRow key={emp.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                {emp.name.charAt(0)}
                              </div>
                              <p className="font-bold text-slate-900">{emp.name}</p>
                            </div>
                          </TableCell>
                          <TableCell><p className="text-sm font-semibold text-slate-500">{emp.position}</p></TableCell>
                          <TableCell>
                            {todayAtt ? (
                              <Badge variant="outline" className={`font-bold text-xs flex items-center gap-1 w-fit ${attColors[todayAtt.status]}`}>
                                {attIcons[todayAtt.status]} {todayAtt.status}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-50 text-slate-400 font-bold text-xs">Not Marked</Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-6">
                            <div className="flex items-center gap-2 flex-wrap">
                              {ATTENDANCE_STATUSES.map((s) => (
                                <Button key={s} size="sm" variant="outline"
                                  className={`rounded-lg text-xs font-bold h-8 px-3 ${todayAtt?.status === s ? attColors[s] + " border-2" : ""}`}
                                  onClick={() => markAttendance(emp.id, s)}>
                                  {s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
                                </Button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[32px] p-0 border-none shadow-2xl">
          <div className="bg-white p-8">
            <DialogHeader className="mb-8 text-left">
              <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">{editEmp ? "Edit Employee" : "New Employee"}</DialogTitle>
              <p className="text-slate-500 font-bold mt-1">Manage your workforce and payroll details.</p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name *</label>
                <Input className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5" placeholder="John Doe" required
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Position *</label>
                <Input className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5" placeholder="e.g. Cashier, Chef" required
                  value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Monthly Salary (PKR) *</label>
                  <Input type="number" className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5" placeholder="0" required
                    value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Join Date</label>
                  <Input type="date" className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5"
                    value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-slate-500 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button disabled={submitting} className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-xl shadow-blue-100 text-white">
                  {submitting ? "Processing..." : editEmp ? "Update Record" : "Add Employee"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
