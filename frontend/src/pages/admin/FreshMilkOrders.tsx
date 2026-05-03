import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Droplets, RefreshCw, CheckCircle, Truck, XCircle, Clock } from 'lucide-react';
import { api } from '../../api';
import { PageSkeleton } from '../../components/Skeleton';

interface MilkOrder {
  id: string;
  quantity_liters: number;
  price_per_liter: number;
  total_amount: number;
  delivery_address: string | null;
  status: string;
  payment_status: string;
  created_at: string;
  notes: string | null;
  milk_listings?: { listing_date: string; fat_percent: number | null };
  users_customer?: { full_name: string; phone: string };
  users_farmer?: { full_name: string; village: string };
}

const STATUS_MAP: Record<string, { label: string; icon: any; cls: string }> = {
  pending:   { label: 'Pending',   icon: Clock,        cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  confirmed: { label: 'Confirmed', icon: CheckCircle,  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  delivered: { label: 'Delivered', icon: Truck,        cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Cancelled', icon: XCircle,      cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

const FreshMilkOrders = () => {
  const [orders, setOrders] = useState<MilkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/milk-listings/orders/all');
      setOrders(res.data);
    } catch {
      toast.error('Failed to load fresh milk orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      await api.patch(`/milk-listings/orders/${orderId}/status`, { status });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  // Stats
  const totalLiters  = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.quantity_liters, 0);
  const totalRev     = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_amount, 0);
  const pending      = orders.filter(o => o.status === 'pending').length;
  const delivered    = orders.filter(o => o.status === 'delivered').length;

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <Droplets className="text-emerald-500" size={26} /> Fresh Milk Orders
        </h1>
        <button onClick={fetchOrders} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, cls: 'text-slate-800 dark:text-white' },
          { label: 'Pending',      value: pending,        cls: 'text-amber-600' },
          { label: 'Delivered',    value: delivered,      cls: 'text-emerald-600' },
          { label: 'Revenue',      value: `₹${totalRev.toFixed(0)}`, cls: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b dark:border-slate-700 text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Farmer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Qty (L)</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Delivery</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {orders.map(o => {
                const cfg  = STATUS_MAP[o.status] || STATUS_MAP.pending;
                const Icon = cfg.icon;
                return (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="py-4 px-4">
                      <p className="font-semibold text-sm">{o.users_customer?.full_name || '—'}</p>
                      <p className="text-xs text-slate-400">{o.users_customer?.phone}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium">{o.users_farmer?.full_name || '—'}</p>
                      <p className="text-xs text-slate-400">{o.users_farmer?.village}</p>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="py-4 px-4 text-right font-semibold text-sm">{o.quantity_liters}L</td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-emerald-600">₹{o.total_amount?.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400 max-w-[120px] truncate">
                      {o.delivery_address || '—'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={o.status}
                        disabled={updating === o.id}
                        onChange={e => updateStatus(o.id, e.target.value)}
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
                <tr><td colSpan={8} className="py-14 text-center text-slate-400 italic">No fresh milk orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FreshMilkOrders;
