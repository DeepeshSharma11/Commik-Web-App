import React, { useEffect, useState } from 'react';
import { ShieldCheck, BarChart3, RefreshCw } from 'lucide-react';
import { api } from '../../api';
import { toast } from 'react-hot-toast';

const Overview = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics');
      setStats(res.data);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-blue-600 text-4xl animate-bounce">🐃</div>
    </div>
  );

  const roleBreakdown = stats?.user_role_breakdown || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="p-8 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 rounded-3xl shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><BarChart3 size={160} /></div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <ShieldCheck className="text-blue-300" /> Malik Command Center
          </h2>
          <button onClick={fetchData} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition" title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          {[
            { label: 'Total Buffaloes', value: stats?.total_buffaloes, unit: '' },
            { label: 'Milk Produced', value: stats?.total_milk_produced?.toFixed(1), unit: 'L', color: 'text-blue-300' },
            { label: 'Total Orders', value: stats?.total_orders, unit: '', color: 'text-amber-300' },
            { label: 'Pending Verifications', value: stats?.pending_payment_verifications, unit: '', color: stats?.pending_payment_verifications > 0 ? 'text-rose-400' : 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
              <p className="text-blue-100 text-[10px] uppercase font-bold tracking-widest opacity-70">{s.label}</p>
              <p className={`text-3xl font-black mt-2 ${s.color || ''}`}>{s.value}<span className="text-base ml-1 font-normal opacity-70">{s.unit}</span></p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 relative z-10">
          {[
            { label: 'Customers', value: roleBreakdown['user'] || 0 },
            { label: 'Farmers', value: roleBreakdown['farmer'] || 0 },
            { label: 'Distributors', value: roleBreakdown['distributor'] || 0 },
            { label: 'Revenue (₹)', value: `₹${stats?.total_orders_revenue?.toLocaleString()}` },
          ].map(s => (
            <div key={s.label} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
              <p className="text-blue-100 text-xs opacity-70">{s.label}</p>
              <p className="font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Overview;
