import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Users, BarChart3, ShieldCheck, Mail, Phone, Calendar, ShoppingBag, TrendingUp, RefreshCw } from 'lucide-react';
import { api } from '../api';

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-50 border-amber-200 text-amber-700',
  confirmed: 'bg-blue-50 border-blue-200 text-blue-700',
  delivered: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  cancelled: 'bg-slate-100 border-slate-200 text-slate-500',
};

const AdminDashboard = () => {
  const [stats, setStats]   = useState<any>(null);
  const [users, setUsers]   = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [tab, setTab]       = useState<'users' | 'orders'>('users');
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, ordersRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users'),
        api.get('/admin/orders'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setOrders(ordersRes.data);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch {
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrder(null);
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
      <Toaster />

      {/* Stats Banner */}
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
            { label: 'Pending Orders', value: stats?.pending_orders, unit: '', color: stats?.pending_orders > 0 ? 'text-rose-400' : 'text-emerald-400' },
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

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {(['users', 'orders'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 font-bold text-sm capitalize transition border-b-2 -mb-px ${
              tab === t
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t === 'users' ? <><Users size={14} className="inline mr-2" />Users ({users.length})</> : <><ShoppingBag size={14} className="inline mr-2" />Orders ({orders.length})</>}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/40 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {(u.full_name || '?')[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition">{u.full_name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10} /> {u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-lg border ${
                        u.role === 'malik'       ? 'bg-rose-50 border-rose-200 text-rose-600' :
                        u.role === 'distributor' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                        u.role === 'farmer'      ? 'bg-green-50 border-green-200 text-green-600' :
                        'bg-blue-50 border-blue-200 text-blue-600'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.village || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(u.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {u.phone && <a href={`tel:${u.phone}`} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white rounded-lg transition text-slate-500"><Phone size={14} /></a>}
                        <a href={`mailto:${u.email}`} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white rounded-lg transition text-slate-500"><Mail size={14} /></a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/40 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Slot</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{o.users?.full_name || '—'}</p>
                      <p className="text-xs text-slate-400">{o.users?.phone || o.users?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{o.order_items?.length || 0} item(s)</td>
                    <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">₹{o.total_amount}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{o.time_slot}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-lg border ${STATUS_COLORS[o.status] || ''}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {o.status !== 'delivered' && o.status !== 'cancelled' && (
                        <select
                          disabled={updatingOrder === o.id}
                          value={o.status}
                          onChange={e => handleStatusChange(o.id, e.target.value)}
                          className="text-xs p-2 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400 italic">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
