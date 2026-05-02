import React from 'react';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-10">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <Shield className="absolute -bottom-10 -right-10 text-white opacity-10" size={200} />
        <h2 className="text-3xl font-black mb-2 relative z-10">Privacy Policy</h2>
        <p className="text-emerald-100 relative z-10">Your data privacy and security is our top priority.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed">
        <section>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Information We Collect</h3>
          <p>We collect information you provide directly to us, such as your name, email address, phone number, and delivery address. When you use our platform, we also collect milk log data, buffalo health records, and transactional information to provide you with our services.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. How We Use Your Information</h3>
          <p>Your data is used to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Process and deliver your milk orders efficiently.</li>
            <li>Provide personalized AI assistance for farm management.</li>
            <li>Communicate with you regarding updates, support, and billing.</li>
            <li>Improve the quality and safety of our dairy management platform.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Data Sharing and Security</h3>
          <p>We do not sell your personal data to third parties. We may share necessary information with our delivery partners (distributors) solely for the purpose of fulfilling your orders. We use industry-standard encryption and security measures to protect your data.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Contact Us</h3>
          <p>If you have any questions about this Privacy Policy, please contact our support team through the Support page.</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
