import React from "react";
import Link from "next/link";
import { Store, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
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
          <h1 className="text-4xl font-black mb-4">Terms of Service</h1>
          <p className="text-slate-500 font-medium mb-10">Last updated: May 2026</p>

          <div className="space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Agreement to Terms</h2>
              <p>
                By accessing or using the Lincoz POS platform, operated by Lincoz Tech, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. Description of Service</h2>
              <p>
                Lincoz POS provides a cloud-based point-of-sale software solution for businesses, including inventory management, staff management, analytics, and billing tools. We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. Subscriptions & Payments</h2>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Services are billed on a subscription basis (Monthly, Bi-Annually, Yearly, or Lifetime).</li>
                <li>You will be billed in advance on a recurring schedule.</li>
                <li>All payments are non-refundable unless otherwise explicitly stated or required by law.</li>
                <li>We reserve the right to change our subscription fees upon prior notice.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. User Accounts</h2>
              <p>
                When you create an account, you must provide accurate and complete information. You are solely responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data Ownership</h2>
              <p>
                You retain all rights to your business data entered into Lincoz POS. We claim no ownership over your sales, customer, or inventory data. However, we may aggregate anonymized data for system analytics and performance improvements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Limitation of Liability</h2>
              <p>
                In no event shall Lincoz Tech, nor its directors, employees, or agents, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">7. Contact Information</h2>
              <p>If you have any questions about these Terms, please contact us:</p>
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
