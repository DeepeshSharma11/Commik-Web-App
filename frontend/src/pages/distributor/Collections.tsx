import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { History, RefreshCw } from 'lucide-react';
import { api } from '../../api';
import { PageSkeleton } from '../../components/Skeleton';

const Collections = () => {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await api.get('/distributor/collections');
      setCollections(res.data);
    } catch { toast.error('Failed to load collections'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCollections(); }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2"><History className="text-indigo-500" size={20} /> Collection History</h2>
        <button onClick={fetchCollections} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition"><RefreshCw size={16} /></button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b dark:border-slate-700 text-[10px] uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Farmer</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Qty (L)</th>
              <th className="py-3 px-4 text-right">Fat %</th>
              <th className="py-3 px-4 text-right">Rate (₹/L)</th>
              <th className="py-3 px-4 text-right">Amount Due</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-700">
            {collections.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                <td className="py-4 px-4">
                  <p className="font-semibold text-sm">{c.users?.full_name || '—'}</p>
                  <p className="text-xs text-slate-400">{c.users?.village || ''}</p>
                </td>
                <td className="py-4 px-4 text-sm text-slate-500">{c.collection_date}</td>
                <td className="py-4 px-4 text-right font-semibold">{c.quantity_liters} L</td>
                <td className="py-4 px-4 text-right text-slate-500">{c.fat_percent != null ? `${c.fat_percent}%` : '—'}</td>
                <td className="py-4 px-4 text-right text-slate-500">₹{c.rate_per_liter}</td>
                <td className="py-4 px-4 text-right">
                  <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-bold">
                    ₹{c.amount_due}
                  </span>
                </td>
              </tr>
            ))}
            {collections.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400 italic">No collections logged yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Collections;
