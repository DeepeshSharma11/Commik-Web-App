import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { api } from '../../api';
import { toast } from 'react-hot-toast';

const CreateDistributor = () => {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', village: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/distributors', form);
      toast.success(res.data.message);
      setForm({ full_name: '', email: '', password: '', phone: '', village: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create distributor');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center">
          <UserPlus size={24} />
        </div>
        <div>
          <h3 className="text-xl font-black">Create Distributor Account</h3>
          <p className="text-sm text-slate-500">Set up credentials for a new distributor agent.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name *</label>
            <input required type="text" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              placeholder="e.g. Rajan Kumar"
              className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email *</label>
            <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="distributor@email.com"
              className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Password *</label>
          <input required type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            placeholder="Min 6 characters"
            className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="+91 XXXXX XXXXX"
              className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Village / Area</label>
            <input type="text" value={form.village} onChange={e => setForm(p => ({ ...p, village: e.target.value }))}
              placeholder="e.g. Anand"
              className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2">
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus size={18} />}
          {loading ? 'Creating...' : 'Create Distributor Account'}
        </button>
      </form>
    </div>
  );
};

export default CreateDistributor;
