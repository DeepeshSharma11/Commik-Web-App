import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Search, PlusCircle, History, User, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../api';

const DistributorDashboard = () => {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [qty, setQty]   = useState('');
  const [fat, setFat]   = useState('');
  const [rate, setRate] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCollections = async () => {
    setLoadingCollections(true);
    try {
      const res = await api.get('/distributor/collections');
      setCollections(res.data);
    } catch {
      toast.error('Failed to load collections');
    } finally {
      setLoadingCollections(false);
    }
  };

  useEffect(() => { fetchCollections(); }, []);

  // Debounced farmer search — triggers after 400ms idle
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setSelectedFarmer(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setFarmers([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/distributor/farmers?search=${encodeURIComponent(value)}`);
        setFarmers(res.data);
      } catch {
        toast.error('Farmer search failed');
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleLogCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmer) return toast.error('Select a farmer first');

    const qtyNum  = parseFloat(qty);
    const rateNum = parseFloat(rate);
    const fatNum  = fat ? parseFloat(fat) : null;

    if (isNaN(qtyNum) || qtyNum <= 0)  return toast.error('Quantity must be greater than 0');
    if (isNaN(rateNum) || rateNum <= 0) return toast.error('Rate must be greater than 0');
    if (fatNum !== null && (fatNum <= 0 || fatNum > 15)) return toast.error('Fat % must be between 0.1 and 15');

    setSubmitting(true);
    try {
      await api.post('/distributor/collections', {
        farmer_id: selectedFarmer.id,
        collection_date: new Date().toISOString().split('T')[0],
        quantity_liters: qtyNum,
        fat_percent: fatNum,
        rate_per_liter: rateNum,
      });
      toast.success('Collection logged!');
      setQty(''); setFat(''); setRate('');
      setSelectedFarmer(null);
      setSearch('');
      setFarmers([]);
      fetchCollections();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to log collection');
    } finally {
      setSubmitting(false);
    }
  };

  const estimatedTotal = ((parseFloat(qty) || 0) * (parseFloat(rate) || 0));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Toaster />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Farmer Search */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Search className="text-blue-500" size={20} /> 1. Find Farmer
            </h2>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Type at least 2 characters..."
                className="w-full p-3 pl-10 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              {searching
                ? <div className="absolute left-3 top-3.5 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                : <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
              }
            </div>

            {search.length >= 2 && !searching && farmers.length === 0 && (
              <div className="mt-4 flex items-center gap-2 text-slate-400 text-sm p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <AlertCircle size={16} /> No farmers found for "{search}"
              </div>
            )}

            <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto">
              {farmers.map(f => (
                <button
                  key={f.id}
                  onClick={() => { setSelectedFarmer(f); }}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    selectedFarmer?.id === f.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{f.full_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{f.village || 'No Village'} • {f.phone || 'No Phone'}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Log Collection */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <PlusCircle className="text-emerald-500" size={20} /> 2. Log Collection
            </h2>

            {selectedFarmer ? (
              <form onSubmit={handleLogCollection} className="space-y-5">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center gap-4 border border-blue-100 dark:border-blue-800">
                  <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-full text-blue-600">
                    <User size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Selected Farmer</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedFarmer.full_name}</p>
                    <p className="text-xs text-slate-400">{selectedFarmer.village} • {selectedFarmer.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Milk Quantity (L) *</label>
                    <input
                      required type="number" step="0.1" min="0.1"
                      value={qty} onChange={e => setQty(e.target.value)}
                      placeholder="0.0"
                      className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Fat % <span className="text-slate-400">(optional, 0.1–15)</span></label>
                    <input
                      type="number" step="0.1" min="0.1" max="15"
                      value={fat} onChange={e => setFat(e.target.value)}
                      placeholder="e.g. 6.5"
                      className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Rate per Liter (₹) *</label>
                    <input
                      required type="number" step="0.5" min="1"
                      value={rate} onChange={e => setRate(e.target.value)}
                      placeholder="0.0"
                      className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Live total preview */}
                <div className="flex justify-between items-center p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  <p className="text-emerald-800 dark:text-emerald-300 font-medium text-sm">Estimated Payout</p>
                  <p className="text-2xl font-black text-emerald-600">₹ {estimatedTotal.toFixed(2)}</p>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-lg transition">
                  {submitting ? 'Logging...' : 'Confirm Collection'}
                </button>
              </form>
            ) : (
              <div className="py-20 text-center text-slate-400">
                <PlusCircle size={48} className="mx-auto mb-4 opacity-20" />
                <p>Select a farmer from the left panel to log milk collection.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <History className="text-indigo-500" size={20} /> Recent Collections
          </h2>
          <button onClick={fetchCollections} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition" title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          {loadingCollections ? (
            <div className="py-10 text-center text-blue-600 animate-pulse text-2xl">🐃</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b dark:border-slate-700 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="py-3">Farmer</th>
                  <th className="py-3">Date</th>
                  <th className="py-3 text-right">Qty (L)</th>
                  <th className="py-3 text-right">Fat %</th>
                  <th className="py-3 text-right">Rate (₹/L)</th>
                  <th className="py-3 text-right">Amount Due</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-700">
                {collections.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="py-4">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{c.users?.full_name || '—'}</p>
                      <p className="text-xs text-slate-400">{c.users?.village || ''}</p>
                    </td>
                    <td className="py-4 text-sm text-slate-500">{c.collection_date}</td>
                    <td className="py-4 text-right font-semibold">{c.quantity_liters} L</td>
                    <td className="py-4 text-right text-slate-500">{c.fat_percent != null ? `${c.fat_percent}%` : '—'}</td>
                    <td className="py-4 text-right text-slate-500">₹{c.rate_per_liter}</td>
                    <td className="py-4 text-right">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default DistributorDashboard;
