import React, { useState, useEffect } from 'react';
import { History, Package, X, CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { OrdersListSkeleton } from '../../components/Skeleton';

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

const MyOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  // For submitting UTR later
  const [submitUtrFor, setSubmitUtrFor] = useState<string | null>(null);
  const [utrInput, setUtrInput] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/');
        setOrders(res.data);
      } catch {
        toast.error('Failed to load order history');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleCancel = async (orderId: string) => {
    if (!window.confirm('Cancel this order?')) return;
    setCancellingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Cannot cancel this order');
    } finally {
      setCancellingId(null);
    }
  };

  const handleSubmitUtrLater = async (orderId: string) => {
    if (!utrInput.trim() || utrInput.length < 6) return toast.error('Enter valid UTR');
    try {
      await api.post('/payments/submit-utr', { order_id: orderId, utr: utrInput.trim() });
      toast.success('Payment reference submitted!');
      setSubmitUtrFor(null);
      setUtrInput('');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: 'submitted', payment_utr: utrInput.trim() } : o));
    } catch (err: any) {
      toast.error('Failed to submit UTR');
    }
  };

  if (loading) return <OrdersListSkeleton count={3} />;

  if (orders.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm animate-in fade-in">
      <History size={64} className="opacity-20 mb-6" />
      <p className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-6">No orders yet.</p>
      <button onClick={() => navigate('/user/shop')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
        Start Shopping
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h2 className="text-2xl font-black mb-6">My Orders</h2>
      <div className="grid gap-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Order ID</p>
                <p className="font-mono text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  {order.id.split('-')[0]}... <button onClick={() => { navigator.clipboard.writeText(order.id); toast.success('ID copied'); }} className="hover:text-blue-500"><Copy size={12}/></button>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Date & Time</p>
                <p className="text-sm font-bold">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
                  {order.status}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-8 justify-between">
                <div className="flex-1 min-w-[200px]">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Items</h4>
                  <ul className="space-y-3">
                    {order.order_items?.map((item: any) => (
                      <li key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <Package size={16} className="text-slate-400" />
                          <span className="font-bold">{item.product_name}</span>
                          <span className="text-slate-400 text-sm font-bold">x{item.quantity}</span>
                        </div>
                        <span className="font-black">₹{item.price * item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="w-full sm:w-64 space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-700">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Amount</p>
                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400">₹{order.total_amount}</p>
                    
                    <div className="mt-4 pt-4 border-t dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Status</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-lg border ${
                          order.payment_status === 'verified' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                          order.payment_status === 'submitted' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                          order.payment_status === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                          'bg-slate-100 border-slate-200 text-slate-500'
                        }`}>{order.payment_status || 'pending'}</span>
                        
                        {order.payment_status === 'pending' && order.status !== 'cancelled' && submitUtrFor !== order.id && (
                          <button onClick={() => setSubmitUtrFor(order.id)} className="text-[11px] text-blue-600 font-bold hover:underline">Submit UTR</button>
                        )}
                      </div>

                      {submitUtrFor === order.id && (
                        <div className="mt-3 flex gap-2">
                          <input type="text" placeholder="UTR..." value={utrInput} onChange={e=>setUtrInput(e.target.value)} className="w-full text-xs p-2 border dark:border-slate-600 rounded bg-white dark:bg-slate-800" />
                          <button onClick={() => handleSubmitUtrLater(order.id)} className="px-2 bg-blue-600 text-white rounded text-xs font-bold shrink-0">Send</button>
                        </div>
                      )}

                      {order.payment_status === 'rejected' && order.payment_rejected_reason && (
                        <p className="text-xs text-rose-500 mt-2 font-medium break-words">Reason: {order.payment_rejected_reason}</p>
                      )}
                    </div>
                  </div>

                  {order.status === 'pending' && (
                    <button
                      disabled={cancellingId === order.id}
                      onClick={() => handleCancel(order.id)}
                      className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-rose-100 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 font-bold rounded-xl transition flex justify-center items-center gap-2"
                    >
                      {cancellingId === order.id ? 'Cancelling...' : <><X size={16} /> Cancel Order</>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
