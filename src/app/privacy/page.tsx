import React from "react";
import Link from "next/link";
import { Store, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg text-slate-900">Lincoz POS</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="font-semibold text-slate-600 hover:text-blue-600">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
          <h1 className="text-4xl font-black mb-4">Privacy Policy</h1>
          <p className="text-slate-500 font-medium mb-10">Last updated: May 2026</p>

          <div className="space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Introduction</h2>
              <p>
                Welcome to Lincoz POS, operated by Lincoz Tech. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website or use our POS software.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. Data We Collect</h2>
              <p>We may collect, use, store and transfer different kinds of personal data about you, including:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Identity Data:</strong> First name, last name, username.</li>
                <li><strong>Contact Data:</strong> Billing address, email address, and telephone numbers.</li>
                <li><strong>Financial Data:</strong> Bank account and payment card details (processed securely via our payment providers).</li>
                <li><strong>Transaction Data:</strong> Details about payments and subscriptions.</li>
                <li><strong>Business Data:</strong> Inventory, sales, and employee information you enter into the POS system.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. How We Use Your Data</h2>
              <p>We will only use your personal data when the law allows us to. Most commonly, we use it to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Provide and maintain our POS services.</li>
                <li>Process your subscription payments.</li>
                <li>Manage your account and customer support requests.</li>
                <li>Improve our software, services, and user experience.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Data Security</h2>
              <p>
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. We use secure encryption and role-based access controls to ensure data integrity.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Contact Us</h2>
              <p>If you have any questions about this privacy policy or our privacy practices, please contact us at:</p>
              <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p><strong>Lincoz Tech</strong></p>
                <p>Email: info@lincoztech.com</p>
                <p>Phone: +92 320 1241230</p>
                <p>Address: Opposite Gate No 3 GC University, Gurunanak Pura, Faisalabad, Pakistan</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
