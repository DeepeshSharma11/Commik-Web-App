import React, { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { api } from '../../api';
import { toast } from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-50 border-amber-200 text-amber-700',
  confirmed: 'bg-blue-50 border-blue-200 text-blue-700',
  delivered: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  cancelled: 'bg-slate-100 border-slate-200 text-slate-500',
};

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/admin/orders');
        setOrders(res.data);
      } catch {
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

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

  if (loading) return <div className="py-20 text-center text-slate-400 font-bold animate-pulse">Loading orders...</div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in duration-300">
      <div className="px-6 py-4 border-b dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><ShoppingBag className="text-blue-500" size={18} /> Order Management</h3>
        <span className="text-xs text-slate-400 font-bold">{orders.length} total</span>
      </div>
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
  );
};

export default Orders;
