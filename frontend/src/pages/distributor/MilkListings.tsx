import React, { useEffect, useState, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { PackagePlus, List, X, Droplets, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { api } from '../../api';

interface Listing {
  id: string;
  listing_date: string;
  quantity_liters: number;
  available_liters: number;
  price_per_liter: number;
  fat_percent: number | null;
  description: string | null;
  status: 'available' | 'sold_out' | 'withdrawn';
  created_at: string;
}

const STATUS_CONFIG = {
  available:  { label: 'Available',  icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  sold_out:   { label: 'Sold Out',   icon: XCircle,      cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  withdrawn:  { label: 'Withdrawn',  icon: Clock,        cls: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' },
};

const MyListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [date, setDate]   = useState(new Date().toISOString().split('T')[0]);
  const [qty, setQty]     = useState('');
  const [price, setPrice] = useState('');
  const [fat, setFat]     = useState('');
  const [desc, setDesc]   = useState('');

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/milk-listings/my');
      setListings(res.data);
    } catch {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum   = parseFloat(qty);
    const priceNum = parseFloat(price);
    const fatNum   = fat ? parseFloat(fat) : null;
    if (!qtyNum || qtyNum <= 0)   return toast.error('Enter valid quantity');
    if (!priceNum || priceNum <= 0) return toast.error('Enter valid price');
    setSubmitting(true);
    try {
      await api.post('/milk-listings/', {
        listing_date: date,
        quantity_liters: qtyNum,
        price_per_liter: priceNum,
        fat_percent: fatNum,
        description: desc || null,
      });
      toast.success('Listing created!');
      setShowForm(false);
      setQty(''); setPrice(''); setFat(''); setDesc('');
      fetchListings();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (id: string) => {
    if (!window.confirm('Withdraw this listing? Customers can no longer order from it.')) return;
    try {
      await api.patch(`/milk-listings/${id}/withdraw`);
      toast.success('Listing withdrawn');
      fetchListings();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to withdraw');
    }
  };

  const totalListed    = listings.reduce((s, l) => s + l.quantity_liters, 0);
  const totalAvailable = listings.reduce((s, l) => s + l.available_liters, 0);
  const totalSold      = totalListed - totalAvailable;
  const activeCount    = listings.filter(l => l.status === 'available').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Toaster />

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <PackagePlus className="text-emerald-500" size={22} /> List Milk for Sale
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Date *</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                  className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Quantity (L) *</label>
                  <input type="number" required step="0.1" min="0.1" value={qty} onChange={e => setQty(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Price / Liter (₹) *</label>
                  <input type="number" required step="0.5" min="1" value={price} onChange={e => setPrice(e.target.value)}
                    placeholder="e.g. 60"
                    className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Fat % <span className="text-slate-400">(optional)</span></label>
                <input type="number" step="0.1" min="0.1" max="15" value={fat} onChange={e => setFat(e.target.value)}
                  placeholder="e.g. 6.5"
                  className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Description <span className="text-slate-400">(optional)</span></label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
                  placeholder="e.g. Fresh morning milk, Murrah buffalo"
                  className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>

              {qty && price && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4 flex justify-between items-center">
                  <span className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">Max Earning</span>
                  <span className="text-2xl font-black text-emerald-600">
                    ₹{((parseFloat(qty)||0) * (parseFloat(price)||0)).toFixed(2)}
                  </span>
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-lg transition">
                {submitting ? 'Creating...' : 'Create Listing'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <Droplets className="text-emerald-500" size={26} /> My Milk Listings
        </h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition">
          <PackagePlus size={18} /> List Milk for Sale
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Listed', value: `${totalListed.toFixed(1)} L`, cls: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300' },
          { label: 'Available',    value: `${totalAvailable.toFixed(1)} L`, cls: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' },
          { label: 'Sold',         value: `${totalSold.toFixed(1)} L`, cls: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800 text-amber-700 dark:text-amber-300' },
          { label: 'Active',       value: activeCount, cls: 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800 text-violet-700 dark:text-violet-300' },
        ].map(s => (
          <div key={s.label} className={`border rounded-2xl p-4 text-center ${s.cls}`}>
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-70 mb-1">{s.label}</p>
            <p className="text-2xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Listings Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-blue-500 animate-pulse text-4xl">🐃</div>
        ) : listings.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <PackagePlus size={48} className="mx-auto text-slate-300" />
            <p className="text-slate-400">No listings yet. Click "List Milk for Sale" to start.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b dark:border-slate-700 text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Listed (L)</th>
                  <th className="py-3 px-4 text-right">Available (L)</th>
                  <th className="py-3 px-4 text-right">Price (₹/L)</th>
                  <th className="py-3 px-4 text-right">Fat %</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-700">
                {listings.map(l => {
                  const sold = l.quantity_liters - l.available_liters;
                  const cfg  = STATUS_CONFIG[l.status];
                  const Icon = cfg.icon;
                  return (
                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="py-4 px-4 text-sm font-medium">{l.listing_date}</td>
                      <td className="py-4 px-4 text-right text-sm">{l.quantity_liters} L</td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (l.available_liters / l.quantity_liters) * 100)}%` }} />
                          </div>
                          <span className="text-sm font-semibold">{l.available_liters} L</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-semibold text-emerald-600">₹{l.price_per_liter}</td>
                      <td className="py-4 px-4 text-right text-sm text-slate-500">{l.fat_percent != null ? `${l.fat_percent}%` : '—'}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>
                          <Icon size={12} /> {cfg.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {l.status === 'available' && (
                          <button onClick={() => handleWithdraw(l.id)}
                            className="text-xs text-rose-500 hover:text-rose-700 font-semibold transition">
                            Withdraw
                          </button>
                        )}
                        {l.status !== 'available' && (
                          <span className="text-xs text-slate-400 italic">
                            {sold > 0 ? `${sold.toFixed(1)}L sold` : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyListings;
