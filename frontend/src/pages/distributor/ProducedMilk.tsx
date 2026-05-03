import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Droplets, RefreshCw, Filter, X } from 'lucide-react';
import { api } from '../../api';
import { PageSkeleton } from '../../components/Skeleton';

interface MilkRecord {
  id: string;
  log_date: string;
  total_qty_liters: number;
  fat_percent: number | null;
  snf_percent: number | null;
  notes: string | null;
  logged_by: string;
  users?: { full_name: string; village: string; phone: string };
}

const ProducedMilk = () => {
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [farmerSearch, setFarmerSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate)   params.append('to_date', toDate);
      const res = await api.get(`/distributor/produced-milk?${params.toString()}`);
      setRecords(res.data);
    } catch {
      toast.error('Failed to load production data');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const clearFilters = () => { setFromDate(''); setToDate(''); setFarmerSearch(''); };

  const filtered = farmerSearch.trim()
    ? records.filter(r =>
        r.users?.full_name?.toLowerCase().includes(farmerSearch.toLowerCase()) ||
        r.users?.village?.toLowerCase().includes(farmerSearch.toLowerCase())
      )
    : records;

  const totalLiters = filtered.reduce((s, r) => s + (r.total_qty_liters || 0), 0);
  const avgFat = (() => {
    const valid = filtered.filter(r => r.fat_percent != null);
    if (!valid.length) return null;
    return valid.reduce((s, r) => s + r.fat_percent!, 0) / valid.length;
  })();

  const uniqueFarmers = new Set(filtered.map(r => r.logged_by)).size;

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <Droplets className="text-blue-500" size={26} />
          Produced Milk
        </h1>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 text-center">
          <p className="text-[10px] uppercase tracking-widest text-blue-500 font-bold mb-1">Total Milk</p>
          <p className="text-3xl font-black text-blue-700 dark:text-blue-300">{totalLiters.toFixed(1)}<span className="text-base font-medium ml-1">L</span></p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-4 text-center">
          <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-1">Avg Fat %</p>
          <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{avgFat != null ? avgFat.toFixed(1) : '—'}<span className="text-base font-medium ml-1">%</span></p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 rounded-2xl p-4 text-center col-span-2 md:col-span-1">
          <p className="text-[10px] uppercase tracking-widest text-violet-500 font-bold mb-1">Farmers</p>
          <p className="text-3xl font-black text-violet-700 dark:text-violet-300">{uniqueFarmers}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <Filter size={14} /> Filters
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="border dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">To</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="border dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Search Farmer</label>
            <input
              type="text"
              value={farmerSearch}
              onChange={e => setFarmerSearch(e.target.value)}
              placeholder="Name or Village..."
              className="border dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(fromDate || toDate || farmerSearch) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-rose-500 hover:text-rose-700 transition"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b dark:border-slate-700 text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                <th className="py-3 px-4">Farmer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Total Qty (L)</th>
                <th className="py-3 px-4 text-right">Fat %</th>
                <th className="py-3 px-4 text-right">SNF %</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  <td className="py-4 px-4">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{r.users?.full_name || '—'}</p>
                    <p className="text-xs text-slate-400">{r.users?.village || ''}</p>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-500">{r.log_date}</td>
                  <td className="py-4 px-4 text-right">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-bold">
                      {r.total_qty_liters ?? '—'} L
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right text-slate-500 text-sm">
                    {r.fat_percent != null ? `${r.fat_percent}%` : '—'}
                  </td>
                  <td className="py-4 px-4 text-right text-slate-500 text-sm">
                    {r.snf_percent != null ? `${r.snf_percent}%` : '—'}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-400 max-w-[180px] truncate">
                    {r.notes || '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400 italic">
                    No milk production records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProducedMilk;
