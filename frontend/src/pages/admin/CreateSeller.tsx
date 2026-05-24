import React, { useState } from 'react';
import { Tractor, UserPlus } from 'lucide-react';
import { api } from '../../api';
import { toast } from 'react-hot-toast';

const CreateSeller = () => {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', village: '' });
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await api.post('/admin/sellers', form);
      toast.success(res.data.message);
      setForm({ full_name: '', email: '', password: '', phone: '', village: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create seller');
    } finally { setLoading(false); }
  };

  const field = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      <input
        required={['full_name', 'email', 'password'].includes(key)}
        type={type}
        value={(form as any)[key]}
        onChange={set(key)}
        placeholder={placeholder}
        className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition"
      />
    </div>
  );

  return (
    <div className="max-w-2xl bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center">
          <Tractor size={24} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Create Seller Account</h3>
          <p className="text-sm text-slate-500">New account banao ya existing user ko seller banao.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {field('Full Name *', 'full_name', 'text', 'e.g. Mohan Singh')}
          {field('Email *', 'email', 'email', 'seller@example.com')}
        </div>
        {field('Password *', 'password', 'password', 'Min 6 characters')}
        <div className="grid sm:grid-cols-2 gap-4">
          {field('Phone', 'phone', 'tel', '+91 XXXXX XXXXX')}
          {field('Village / Area', 'village', 'text', 'e.g. Mathura')}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
          💡 <strong>Tip:</strong> Agar email already registered hai, user ka role automatically seller ho jayega — password change nahi hoga.
        </div>

        {/* Seller capabilities */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4 text-sm text-emerald-700 dark:text-emerald-300">
          <strong>Seller access includes:</strong> Buffalo management, daily milk logs, listing milk for sale, logging collections, viewing produced milk, and AI chat.
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2">
          {loading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <UserPlus size={18} />}
          {loading ? 'Creating...' : 'Create Seller Account'}
        </button>
      </form>
    </div>
  );
};

export default CreateSeller;
