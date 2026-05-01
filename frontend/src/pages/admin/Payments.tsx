import React, { useEffect, useState } from 'react';
import { Smartphone, CheckCircle2, X } from 'lucide-react';
import { api } from '../../api';
import { toast } from 'react-hot-toast';

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get('/admin/payments');
        setPayments(res.data);
      } catch {
        toast.error('Failed to load payments');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) return <div className="py-20 text-center text-slate-400 font-bold animate-pulse">Loading payments...</div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in duration-300">
      <div className="px-6 py-4 border-b dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><Smartphone className="text-blue-500" size={18} /> Payment Verifications</h3>
        <span className="text-xs text-slate-400 font-bold">{payments.filter(p => p.payment_status === 'submitted').length} pending</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="bg-slate-50/80 dark:bg-slate-900/40 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            <th className="px-6 py-4">Customer</th><th className="px-6 py-4">UTR</th><th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Status</th><th className="px-6 py-4">Submitted</th><th className="px-6 py-4">Action</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {payments.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                <td className="px-6 py-4"><p className="font-bold text-sm">{p.users?.full_name || '—'}</p><p className="text-xs text-slate-400">{p.users?.phone || p.users?.email}</p></td>
                <td className="px-6 py-4 font-mono text-sm text-blue-600">{p.payment_utr || '—'}</td>
                <td className="px-6 py-4 font-bold">₹{p.total_amount}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-lg border ${
                    p.payment_status === 'verified'  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                    p.payment_status === 'submitted' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                    p.payment_status === 'rejected'  ? 'bg-rose-50 border-rose-200 text-rose-700' :
                    'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>{p.payment_status}</span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-400">{p.payment_submitted_at ? new Date(p.payment_submitted_at).toLocaleString() : '—'}</td>
                <td className="px-6 py-4">
                  {p.payment_status === 'submitted' && (
                    <div className="flex gap-2">
                      <button disabled={verifying === p.id} onClick={async () => {
                        setVerifying(p.id);
                        try { await api.patch(`/admin/payments/${p.id}/verify`, { verdict: 'verified' }); toast.success('Verified!'); setPayments(prev => prev.map(x => x.id === p.id ? { ...x, payment_status: 'verified' } : x)); } catch { toast.error('Failed'); } finally { setVerifying(null); }
                      }} className="flex items-center gap-1 text-xs px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition">
                        <CheckCircle2 size={13} /> Verify
                      </button>
                      <button disabled={verifying === p.id} onClick={async () => {
                        const reason = window.prompt('Rejection reason:') || 'Verification failed';
                        setVerifying(p.id);
                        try { await api.patch(`/admin/payments/${p.id}/verify`, { verdict: 'rejected', reason }); toast.success('Rejected'); setPayments(prev => prev.map(x => x.id === p.id ? { ...x, payment_status: 'rejected' } : x)); } catch { toast.error('Failed'); } finally { setVerifying(null); }
                      }} className="flex items-center gap-1 text-xs px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50 transition">
                        <X size={13} /> Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (<tr><td colSpan={6} className="py-12 text-center text-slate-400 italic">No payments yet.</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
