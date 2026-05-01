import React from 'react';
import { Truck, Users, Percent, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BulkOrders = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-6">B2B & Events</span>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">Bulk Orders & Subscriptions</h1>
          <p className="text-amber-100 text-lg">Planning a big event or need daily commercial supply? Get special pricing for bulk orders of A2 milk and dairy products.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 text-center">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4"><Percent size={20}/></div>
          <h3 className="font-bold mb-2">Special Pricing</h3>
          <p className="text-sm text-slate-500">Get discounted rates for orders above 20 Litres.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 text-center">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Truck size={20}/></div>
          <h3 className="font-bold mb-2">Priority Delivery</h3>
          <p className="text-sm text-slate-500">Dedicated delivery vehicles for large orders.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 text-center">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><Users size={20}/></div>
          <h3 className="font-bold mb-2">Dedicated Account</h3>
          <p className="text-sm text-slate-500">Direct contact with farm manager for scheduling.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-2xl font-black mb-6">Request a Bulk Quote</h3>
        <form className="space-y-6" onSubmit={e => { e.preventDefault(); toast.success('Quote request submitted! We will contact you shortly.'); }}>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Organization / Event Name</label>
              <input type="text" required className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-amber-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Contact Number</label>
              <input type="tel" required className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-amber-500 transition" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Estimated Quantity (Liters/Kg)</label>
              <input type="number" required min="20" placeholder="Minimum 20" className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-amber-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Requirement Date</label>
              <input type="date" required className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-amber-500 transition" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Specific Requirements</label>
            <textarea rows={3} placeholder="Tell us more about your needs..." className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-amber-500 transition resize-none"></textarea>
          </div>
          <button type="submit" className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 w-full sm:w-auto">
            Submit Request <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default BulkOrders;
