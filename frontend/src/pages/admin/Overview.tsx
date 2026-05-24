import React, { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, BarChart3, RefreshCw, Droplets, CheckCircle, Truck, XCircle, Clock } from 'lucide-react';
import { api } from '../../api';
import { toast } from 'react-hot-toast';

const STATUS_MAP: Record<string, { label: string; icon: any; cls: string }> = {
  pending:   { label: 'Pending',   icon: Clock,       cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  delivered: { label: 'Delivered', icon: Truck,       cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Cancelled', icon: XCircle,     cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

const Overview = () => {
  const [stats, setStats]         = useState<any>(null);
  const [orders, setOrders]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/milk-listings/orders/all'),
      ]);
      setStats(statsRes.data);
      setOrders(ordersRes.data);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/milk-listings/orders/${orderId}/status`, { status });
      toast.success(`Order marked as ${status}`);
      // optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-blue-600 text-4xl animate-bounce">🐃</div>
    </div>
  );

  const roleBreakdown = stats?.user_role_breakdown || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── Main Command Center ─────────────────────────────────── */}
      <div className="p-8 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 rounded-3xl shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><BarChart3 size={160} /></div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <ShieldCheck className="text-blue-300" /> Admin Command Center
          </h2>
          <button onClick={fetchAll} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition" title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          {[
            { label: 'Total Buffaloes',      value: stats?.total_buffaloes, unit: '' },
            { label: 'Milk Produced',        value: stats?.total_milk_produced?.toFixed(1), unit: 'L', color: 'text-blue-300' },
            { label: 'Total Orders',         value: stats?.total_orders, unit: '', color: 'text-amber-300' },
            { label: 'Pending Verifications',value: stats?.pending_payment_verifications, unit: '',
              color: stats?.pending_payment_verifications > 0 ? 'text-rose-400' : 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
              <p className="text-blue-100 text-[10px] uppercase font-bold tracking-widest opacity-70">{s.label}</p>
              <p className={`text-3xl font-black mt-2 ${s.color || ''}`}>
                {s.value}<span className="text-base ml-1 font-normal opacity-70">{s.unit}</span>
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 relative z-10">
          {[
            { label: 'Customers',    value: roleBreakdown['customer'] || 0 },
            { label: 'Sellers',      value: roleBreakdown['seller'] || 0 },
            { label: 'Admins',       value: roleBreakdown['admin'] || 0 },
            { label: 'Revenue (₹)',  value: `₹${stats?.total_orders_revenue?.toLocaleString()}` },
          ].map(s => (
            <div key={s.label} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
              <p className="text-blue-100 text-xs opacity-70">{s.label}</p>
              <p className="font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fresh Milk Inventory Stats ──────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-5 text-slate-800 dark:text-white">
          <Droplets className="text-emerald-500" size={20} /> Fresh Milk Inventory
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Listed',    value: `${stats?.total_milk_listed?.toFixed(1) || 0}L`,      cls: 'text-blue-600' },
            { label: 'Available Now',   value: `${stats?.total_milk_available?.toFixed(1) || 0}L`,   cls: 'text-emerald-600' },
            { label: 'Sold (Listings)', value: `${stats?.total_milk_listing_sold?.toFixed(1) || 0}L`,cls: 'text-amber-600' },
            { label: 'Active Listings', value: stats?.active_listings || 0,                           cls: 'text-violet-600' },
          ].map(s => (
            <div key={s.label} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 text-center border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[
            { label: 'Fresh Milk Orders', value: stats?.fresh_milk_orders || 0,                             cls: 'text-slate-700 dark:text-white' },
            { label: 'Liters Sold',       value: `${stats?.fresh_milk_liters_sold?.toFixed(1) || 0}L`,      cls: 'text-blue-600' },
            { label: 'Fresh Milk Rev.',   value: `₹${stats?.fresh_milk_revenue?.toLocaleString() || 0}`,    cls: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 text-center border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">{s.label}</p>
              <p className={`text-xl font-black ${s.cls}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fresh Milk Orders Table ─────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Droplets className="text-blue-500" size={20} /> Fresh Milk Orders
          </h3>
          <span className="text-xs text-slate-400 font-medium">{orders.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Farmer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Qty (L)</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {orders.map(o => {
                const cfg  = STATUS_MAP[o.status] || STATUS_MAP.pending;
                const Icon = cfg.icon;
                return (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-sm">{o.users_customer?.full_name || o.users?.full_name || '—'}</p>
                      <p className="text-xs text-slate-400">{o.users_customer?.phone || ''}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium">{o.users_farmer?.full_name || '—'}</p>
                      <p className="text-xs text-slate-400">{o.users_farmer?.village || ''}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right font-semibold text-sm">{o.quantity_liters}L</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 text-sm">₹{o.total_amount?.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={o.status}
                        disabled={updatingId === o.id}
                        onChange={e => updateOrderStatus(o.id, e.target.value)}
                        className="text-xs border dark:border-slate-600 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirm</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancel</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400 italic">No fresh milk orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Overview;
