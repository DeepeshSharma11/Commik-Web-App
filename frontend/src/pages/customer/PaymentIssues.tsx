import React from 'react';
import { AlertCircle, FileQuestion, BadgeAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const PaymentIssues = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-3xl p-8 sm:p-12 text-rose-900 dark:text-rose-100 flex items-start gap-6">
        <BadgeAlert size={48} className="text-rose-500 shrink-0" />
        <div>
          <h2 className="text-2xl font-black mb-2 text-rose-700 dark:text-rose-400">Payment Related Issues</h2>
          <p className="text-rose-600 dark:text-rose-300">If your money was deducted but the order is not confirmed, or if you forgot to submit the UTR, you are in the right place.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl"><FileQuestion size={24} /></div>
            <h3 className="text-lg font-bold">Forgot to submit UTR?</h3>
          </div>
          <p className="text-slate-500 mb-6">If you made the payment but skipped the UTR submission step, you can still submit it from your order history.</p>
          <button onClick={() => navigate('/user/orders')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition">Go to My Orders</button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl"><AlertCircle size={24} /></div>
            <h3 className="text-lg font-bold">Money deducted but status is Rejected?</h3>
          </div>
          <p className="text-slate-500 mb-6">Sometimes there are bank delays. If you are certain the payment was successful, please raise a dispute ticket.</p>
          
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); toast.success('Ticket raised successfully. Admin will check the payment logs.'); }}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Order ID</label>
                <input type="text" required placeholder="e.g. ord-1234..." className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Correct UTR / Ref Number</label>
                <input type="text" required placeholder="12 digit transaction ID" className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Additional Details</label>
              <textarea placeholder="Any additional context..." rows={3} className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"></textarea>
            </div>
            <button type="submit" className="w-full py-4 bg-slate-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white font-bold rounded-xl shadow-lg transition">Raise Dispute Ticket</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentIssues;
