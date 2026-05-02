import React from 'react';
import { FileText } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-10">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <FileText className="absolute -bottom-10 -right-10 text-white opacity-10" size={200} />
        <h2 className="text-3xl font-black mb-2 relative z-10">Terms of Service</h2>
        <p className="text-emerald-100 relative z-10">Please read these terms carefully before using CommilK.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed">
        <section>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Acceptance of Terms</h3>
          <p>By accessing and using the CommilK platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. User Accounts</h3>
          <p>To use certain features of the platform, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Platform Usage & AI Assistant</h3>
          <p>Our platform provides tools for dairy management, milk tracking, and an AI assistant for farming advice. The AI advice is generated based on available data and general farming knowledge, but it should not replace professional veterinary consultation. We are not liable for any losses or damages resulting from reliance on the AI advice.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Order & Delivery Policy</h3>
          <p>For customers ordering dairy products, delivery times are estimates. While we strive to ensure farm-fresh delivery within hours, external factors may occasionally cause delays. Quality concerns must be reported within 24 hours of delivery through our Support page.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Modifications</h3>
          <p>CommilK reserves the right to modify these terms at any time. We will do our best to notify users of significant changes. Your continued use of the platform after any such changes constitutes your acceptance of the new Terms of Service.</p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
