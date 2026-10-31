"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields");

    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      toast.success("Welcome back, " + res.data.user.name);
      
      // Redirect based on role
      if (res.data.user.role === "SUPER_ADMIN") {
        router.push("/admin-dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* Left Side: Illustration/Text */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 p-12 items-center justify-center relative overflow-hidden">
        <div className="relative z-10 max-w-lg text-center lg:text-left">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-8 overflow-hidden"
          >
            <img src="/logo.jpeg" alt="Lincoz POS" className="w-full h-full object-cover" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight"
          >
            Manage your business with <span className="text-blue-200">Confidence.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-blue-100 font-medium opacity-80"
          >
            Lincoz POS provides the tools you need to scale your operations globally.
          </motion.p>
        </div>
        
        {/* Abstract BG */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-[60%] h-[60%] border-4 border-white/30 rounded-full"></div>
          <div className="absolute bottom-1/4 -right-20 w-[40%] h-[40%] border-4 border-white/30 rounded-full"></div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500 font-semibold">Enter your credentials to access your dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@company.com" 
                  className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-blue-600"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700">Forgot Password?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-blue-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-black shadow-xl shadow-blue-100 text-white transition-all active:scale-95"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>Sign In to Dashboard <ChevronRight className="ml-2 w-6 h-6" /></>
              )}
            </Button>

            <div className="text-center">
              <p className="text-slate-500 font-medium text-sm">
                Don't have an account? <a href="#" className="text-blue-600 font-bold hover:text-blue-700">Contact Sales</a>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
