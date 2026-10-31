"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Shield, 
  Package, 
  CreditCard,
  Bell,
  PanelLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin-dashboard" },
  { icon: Users, label: "Tenants", href: "/tenants" },
  { icon: Package, label: "Modules", href: "/modules" },
  { icon: CreditCard, label: "Subscriptions", href: "/subscriptions" },
  { icon: Settings, label: "Settings", href: "/admin-settings" },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out z-50 lg:static lg:translate-x-0",
          isSidebarOpen ? "w-64" : "w-20",
          isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b border-slate-100">
            <img src="/logo.jpeg" alt="Lincoz Admin" className="w-10 h-10 rounded-xl object-contain shadow-sm shrink-0 bg-white" />
            {(isSidebarOpen || isMobileOpen) && (
              <span className="ml-3 font-bold text-xl text-slate-900 truncate">Lincoz Admin</span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <div className={cn(
                    "flex items-center px-3 py-3 rounded-xl transition-all group",
                    isActive 
                      ? "bg-blue-50 text-blue-600 shadow-sm" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}>
                    <item.icon className={cn(
                      "w-6 h-6 shrink-0",
                      isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                    )} />
                    {(isSidebarOpen || isMobileOpen) && (
                      <span className="ml-3 font-semibold">{item.label}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl mb-4"
            >
              <LogOut className="w-6 h-6 shrink-0" />
              {(isSidebarOpen || isMobileOpen) && <span className="ml-3 font-semibold">Logout</span>}
            </Button>

            {(isSidebarOpen || isMobileOpen) && (
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Developed By</p>
                <p className="text-[12px] font-bold text-blue-600 text-center mt-0.5">LINCOZTECH</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3">
            {/* Single Sidebar Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  setMobileOpen(!isMobileOpen);
                } else {
                  setSidebarOpen(!isSidebarOpen);
                }
              }}
              className="h-9 w-9 text-slate-500 rounded-xl hover:bg-slate-50"
              title="Toggle Sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </Button>

            <h2 className="font-bold text-slate-800 text-lg sm:text-xl hidden sm:block">
              {sidebarItems.find(i => i.href === pathname)?.label || "Panel"}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="text-slate-500 relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </Button>
            <div className="h-10 w-10 rounded-full bg-blue-600 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold text-sm">
              SA
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
