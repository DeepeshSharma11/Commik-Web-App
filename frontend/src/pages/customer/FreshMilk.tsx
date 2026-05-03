import React, { useEffect, useState, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Droplets, MapPin, ShoppingBag, X, Leaf, AlertCircle } from 'lucide-react';
import { api } from '../../api';
import { PageSkeleton } from '../../components/Skeleton';

interface Listing {
  id: string;
  listing_date: string;
  quantity_liters: number;
  available_liters: number;
  price_per_liter: number;
  fat_percent: number | null;
  description: string | null;
  users?: { full_name: string; village: string; phone: string };
}

const FreshMilk = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [qty, setQty] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/milk-listings/available');
      setListings(res.data);
    } catch {
      toast.error('Failed to load fresh milk listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const qtyNum = parseFloat(qty);
    if (!qtyNum || qtyNum <= 0) return toast.error('Enter a valid quantity');
    if (qtyNum > selected.available_liters) return toast.error(`Max available: ${selected.available_liters}L`);

    setSubmitting(true);
    try {
      await api.post('/milk-listings/order', {
        listing_id: selected.id,
        quantity_liters: qtyNum,
        delivery_address: address || null,
        notes: notes || null,
      });
      toast.success('Order placed! Farmer will be notified.');
      setSelected(null);
      setQty(''); setAddress(''); setNotes('');
      fetchListings();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Toaster />

      {/* Order Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="text-emerald-500" size={22} /> Order Fresh Milk
              </h2>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition">
                <X size={20} />
              </button>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4 mb-5">
              <p className="font-bold text-emerald-800 dark:text-emerald-300">{selected.users?.full_name || 'Farmer'}</p>
              <p className="text-sm text-slate-500">{selected.users?.village} • {selected.listing_date}</p>
              <div className="flex gap-4 mt-2 text-sm font-semibold">
                <span className="text-blue-600">Available: {selected.available_liters}L</span>
                <span className="text-emerald-600">₹{selected.price_per_liter}/L</span>
                {selected.fat_percent && <span className="text-amber-600">Fat: {selected.fat_percent}%</span>}
              </div>
            </div>

            <form onSubmit={handleOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Quantity (L) *</label>
                <input type="number" required step="0.1" min="0.1" max={selected.available_liters}
                  value={qty} onChange={e => setQty(e.target.value)}
                  placeholder={`Max ${selected.available_liters}L`}
                  className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Delivery Address <span className="text-slate-400">(optional)</span></label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="Your delivery address"
                  className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Notes <span className="text-slate-400">(optional)</span></label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Please deliver before 8am"
                  className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              {qty && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 flex justify-between items-center border border-slate-100 dark:border-slate-700">
                  <span className="text-sm text-slate-500">Total Amount</span>
                  <span className="text-2xl font-black text-emerald-600">
                    ₹{((parseFloat(qty) || 0) * selected.price_per_liter).toFixed(2)}
                  </span>
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-lg transition">
                {submitting ? 'Placing Order...' : 'Confirm Order'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 right-8 opacity-10"><Droplets size={120} /></div>
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <Leaf size={12} /> Farm Direct
          </span>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Fresh Milk Market</h1>
          <p className="text-emerald-100">Order directly from local buffalo farmers — same-day delivery.</p>
        </div>
      </div>

      {/* Listings */}
      {listings.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-16 text-center space-y-3">
          <AlertCircle size={48} className="mx-auto text-slate-300" />
          <p className="text-slate-400 font-medium">No fresh milk available right now.</p>
          <p className="text-slate-400 text-sm">Check back later when farmers list their milk.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map(l => {
            const soldPct = Math.min(100, ((l.quantity_liters - l.available_liters) / l.quantity_liters) * 100);
            return (
              <div key={l.id}
                className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition group">
                {/* Farmer */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-700 font-black text-lg mb-2">
                      {(l.users?.full_name || 'F')[0]}
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white">{l.users?.full_name || '—'}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {l.users?.village || 'Village not set'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-600">₹{l.price_per_liter}</p>
                    <p className="text-xs text-slate-400">per liter</p>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold px-2.5 py-1 rounded-full">
                    {l.available_liters}L available
                  </span>
                  {l.fat_percent && (
                    <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full">
                      Fat {l.fat_percent}%
                    </span>
                  )}
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 text-xs px-2.5 py-1 rounded-full">
                    {l.listing_date}
                  </span>
                </div>

                {/* Stock bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Stock remaining</span>
                    <span>{Math.round(100 - soldPct)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${100 - soldPct}%` }} />
                  </div>
                </div>

                {l.description && (
                  <p className="text-xs text-slate-400 mb-4 italic">"{l.description}"</p>
                )}

                <button onClick={() => setSelected(l)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition group-hover:shadow-emerald-600/20">
                  Order Now
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FreshMilk;
