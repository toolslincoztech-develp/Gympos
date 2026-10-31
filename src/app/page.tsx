"use client";

import { motion } from "framer-motion";
import {
  ShoppingBag, Store, Utensils, Users, BarChart3, ChevronRight,
  ShieldCheck, Zap, Globe, Check, Star, ArrowRight, Menu, X,
  Mail, Phone, MapPin, Package, CreditCard, TrendingUp,
  Smartphone, Clock, Building2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const fadeUp = { hidden: { y: 30, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.6 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const features = [
    { icon: ShoppingBag, title: "Smart POS Terminal", desc: "Lightning-fast billing with barcode scanning, cash/card/UPI payments, and instant receipt printing." },
    { icon: Package, title: "Inventory Management", desc: "Real-time stock tracking, low-stock alerts, batch management, and multi-warehouse support." },
    { icon: Utensils, title: "Restaurant Module", desc: "Table management, kitchen display system, waiter apps, and menu optimization built-in." },
    { icon: Users, title: "CRM & Loyalty", desc: "Build lasting customer relationships with purchase history, loyalty points, and targeted offers." },
    { icon: BarChart3, title: "Advanced Analytics", desc: "Deep insights into sales, revenue trends, staff performance, and inventory forecasting." },
    { icon: ShieldCheck, title: "Role-Based Access", desc: "Granular permissions for admins, managers, cashiers, kitchen staff, and more." },
    { icon: Building2, title: "Multi-Branch", desc: "Manage unlimited branches from one dashboard with centralized inventory and reporting." },
    { icon: TrendingUp, title: "HR & Payroll", desc: "Employee attendance tracking, shift management, and automated salary calculations." },
  ];

  const plans = [
    {
      name: "7-Day Trial",
      price: "PKR 0",
      period: "/yr",
      desc: "Try out all features risk-free",
      features: ["All Premium Features", "Limited Support", "7 Days Duration"],
      highlight: false,
      badge: "",
    },
    {
      name: "Monthly Plan",
      price: "PKR 3,000",
      period: "/mo",
      desc: "Perfect for starting out",
      features: ["All Premium Features", "Limited Support", "Monthly plan"],
      highlight: false,
      badge: "",
    },
    {
      name: "6-Month Plan",
      price: "PKR 12,000",
      period: "/6mo",
      desc: "Save more with bi-annual billing",
      features: ["All Premium Features", "Priority Support", "6 Months Duration"],
      highlight: true,
      badge: "POPULAR",
    },
    {
      name: "1-Year Plan",
      price: "PKR 18,000",
      period: "/yr",
      desc: "Best value for growing businesses",
      features: ["All Premium Features", "24/7 Priority Support", "1 Year Duration"],
      highlight: false,
      badge: "BEST VALUE",
    },
    {
      name: "Lifetime Plan",
      price: "PKR 100,000",
      period: "/life",
      desc: "Pay once, use forever",
      features: ["All Premium Features", "Lifetime Support", "No Recurring Billing"],
      highlight: false,
      badge: "ONE TIME",
    },
  ];

  const stats = [
    { value: "500+", label: "Active Businesses" },
    { value: "1M+", label: "Transactions Processed" },
    { value: "99.9%", label: "Uptime Reliability" },
    { value: "24/7", label: "Support Response" },
  ];

  const testimonials = [
    { name: "Ahmed Raza", role: "Restaurant Owner, Lahore", text: "Lincoz POS transformed our restaurant. Table management and KDS are game changers. Sales up 40% in 3 months.", rating: 5 },
    { name: "Sara Khan", role: "Pharmacy Manager, Karachi", text: "The expiry tracking and batch management saved us from huge losses. Best investment for our pharmacy.", rating: 5 },
    { name: "Bilal Ahmed", role: "Retail Chain Owner, Islamabad", text: "Managing 5 branches from one dashboard is incredible. The analytics help us make smarter decisions daily.", rating: 5 },
  ];

  const faqs = [
    { q: "Can I use Lincoz POS for multiple branches?", a: "Yes! Our Professional and Enterprise plans support multiple branches with centralized inventory and reporting across all locations." },
    { q: "Is there a free trial?", a: "Yes, we offer a 7-day free trial on all plans. No credit card required to get started." },
    { q: "What payment methods does the POS support?", a: "Lincoz POS supports Cash, Card, UPI, and Split payments out of the box with full receipt printing." },
    { q: "Can I manage staff and their roles?", a: "Absolutely. Create staff accounts with specific roles — Cashier, Manager, Kitchen Staff, HR, Accountant, and more." },
    { q: "Is my data secure?", a: "Yes. We use JWT authentication, encrypted passwords, HTTPS, and role-based access control to keep your data safe." },
    { q: "Do I need technical knowledge to set up?", a: "No. Lincoz POS is designed to be set up in minutes. Our onboarding team will guide you through everything." },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpeg" alt="Lincoz POS" className="w-9 h-9 rounded-xl object-contain shadow-sm" />
            <span className="font-black text-xl text-slate-900 tracking-tight">Lincoz POS</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[["Features", "#features"], ["Pricing", "#pricing"], ["Testimonials", "#testimonials"], ["FAQ", "#faq"], ["Contact", "#contact"]].map(([label, href]) => (
              <a key={label} href={href} className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">{label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" className="h-9 rounded-xl font-bold border-slate-200 text-slate-700">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button className="h-9 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 px-5">
                Get Started Free <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-3">
            {[["Features", "#features"], ["Pricing", "#pricing"], ["Testimonials", "#testimonials"], ["FAQ", "#faq"]].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-slate-600 py-2">{label}</a>
            ))}
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full h-11 rounded-xl font-bold bg-blue-600 mt-2">Sign In / Get Started</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto text-center">
            <motion.div variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-bold mb-8">
              <Zap className="w-4 h-4 fill-current" /> Pakistan's #1 Enterprise POS Platform
            </motion.div>
            <motion.h1 variants={fadeUp}
              className="text-5xl lg:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-[1.08]">
              Manage Your Business<br />
              <span className="text-blue-600">Like a Pro</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
              The all-in-one SaaS POS platform for restaurants, retail shops, pharmacies, and more. Streamline sales, manage inventory, and scale your business.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all hover:scale-105">
                  Start Free Trial <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-2xl border-slate-200 hover:bg-slate-50 transition-all hover:scale-105">
                  View Features
                </Button>
              </a>
            </motion.div>
            <motion.p variants={fadeUp} className="text-sm text-slate-400 font-medium mt-5">
              7-day free trial · No credit card required · Cancel anytime
            </motion.p>
          </motion.div>
        </div>

        {/* BG blobs */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-100/50 rounded-full blur-[120px]" />
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 border-y border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((stat, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                <p className="text-4xl font-black text-blue-600">{stat.value}</p>
                <p className="text-slate-500 font-semibold text-sm mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3">Core Features</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-black text-slate-900 mb-4">Everything You Need to Run Your Business</motion.h2>
            <motion.p variants={fadeUp} className="text-slate-600 text-lg max-w-2xl mx-auto">
              Modular architecture — use only what you need, scale as you grow.
            </motion.p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: idx * 0.07 }}
                whileHover={{ y: -6 }}
                className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-5">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3">Pricing</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-black text-slate-900 mb-4">Simple, Transparent Pricing</motion.h2>
            <motion.p variants={fadeUp} className="text-slate-600 text-lg max-w-xl mx-auto">No hidden fees. Start free, scale as you grow.</motion.p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className={`p-7 rounded-3xl border-2 relative flex flex-col ${plan.highlight
                    ? "border-blue-500 bg-blue-600 text-white shadow-2xl shadow-blue-200"
                    : "border-slate-200 bg-white"
                  }`}>
                {plan.badge && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-black px-4 py-1.5 rounded-full ${plan.highlight ? "bg-amber-400 text-slate-900" : "bg-slate-900 text-white"
                    }`}>
                    {plan.badge}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`text-lg font-black mb-1 ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.name}</h3>
                  <p className={`text-sm font-medium mb-4 ${plan.highlight ? "text-blue-200" : "text-slate-500"}`}>{plan.desc}</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-3xl font-black ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.price}</span>
                    <span className={`text-sm font-bold mb-1 ${plan.highlight ? "text-blue-200" : "text-slate-400"}`}>{plan.period}</span>
                  </div>
                </div>
                <div className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? "bg-white/20" : "bg-blue-50"}`}>
                        <Check className={`w-3 h-3 ${plan.highlight ? "text-white" : "text-blue-600"}`} />
                      </div>
                      <span className={`text-sm font-semibold ${plan.highlight ? "text-blue-100" : "text-slate-600"}`}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/login">
                  <Button className={`w-full h-11 rounded-xl font-bold ${plan.highlight
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100"
                    }`}>
                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3">Testimonials</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-black text-slate-900 mb-4">Trusted by 500+ Businesses</motion.h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm">
                <div className="flex gap-1 mb-5">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-700 font-medium leading-relaxed mb-6">"{t.text}"</p>
                <div>
                  <p className="font-black text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500 font-medium">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3">FAQ</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-black text-slate-900 mb-4">Frequently Asked Questions</motion.h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: idx * 0.05 }}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <button className="w-full flex items-center justify-between p-6 text-left"
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}>
                  <span className="font-bold text-slate-900">{faq.q}</span>
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ml-4 ${faqOpen === idx ? "rotate-90" : ""}`} />
                </button>
                {faqOpen === idx && (
                  <div className="px-6 pb-6 text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">Ready to Grow Your Business?</h2>
              <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto font-medium">
                Join 500+ businesses across Pakistan who trust Lincoz POS. Start your 7-day free trial today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login">
                  <Button size="lg" className="h-14 px-10 text-lg font-black rounded-2xl bg-white text-blue-600 hover:bg-slate-50 shadow-xl transition-all hover:scale-105">
                    Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href="#pricing">
                  <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold rounded-2xl border-white/30 text-white hover:bg-white/10">
                    View Pricing
                  </Button>
                </a>
              </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <Globe className="absolute -right-20 -bottom-20 w-[60%] h-[60%]" />
              <Smartphone className="absolute -left-10 -top-10 w-[30%] h-[30%] -rotate-12" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
            {[
              { icon: Mail, label: "Email Us", value: "info@lincoztech.com" },
              { icon: Phone, label: "Call Us", value: "+92 320 1241230" },
              { icon: MapPin, label: "Location", value: "Opposite Gate No 3 GC University, Gurunanak Pura, Faisalabad" },
            ].map((item, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <item.icon className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-400 text-sm">{item.label}</p>
                <p className="font-black text-slate-900">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpeg" alt="Lincoz POS" className="w-7 h-7 rounded-lg object-contain shadow-sm" />
            <span className="font-black text-slate-900">Lincoz POS</span>
          </div>
          <p className="text-slate-500 font-medium text-sm">© 2026 Lincoz Tech. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm font-semibold text-slate-500">
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
            <Link href="/login" className="hover:text-blue-600 transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
