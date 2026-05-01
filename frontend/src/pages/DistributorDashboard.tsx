import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Search, PlusCircle, History, User } from 'lucide-react';
import { api } from '../api';

const DistributorDashboard = () => {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  const [collections, setCollections] = useState<any[]>([]);

  // Collection Form state
  const [qty, setQty] = useState('');
  const [fat, setFat] = useState('');
  const [rate, setRate] = useState('');

  const fetchCollections = async () => {
    try {
      const res = await api.get('/distributor/collections');
      setCollections(res.data);
    } catch {
      toast.error('Failed to load collections');
    }
  };

  const searchFarmers = async (query: string) => {
    try {
      const res = await api.get(`/distributor/farmers?search=${query}`);
      setFarmers(res.data);
    } catch {
      toast.error('Failed to find farmers');
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleLogCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmer) return toast.error('Select a farmer first');
    try {
      await api.post('/distributor/collections', {
        farmer_id: selectedFarmer.id,
        collection_date: new Date().toISOString().split('T')[0],
        quantity_liters: parseFloat(qty),
        fat_percent: parseFloat(fat) || null,
        rate_per_liter: parseFloat(rate),
      });
      toast.success('Collection logged successfully!');
      setQty(''); setFat(''); setRate('');
      setSelectedFarmer(null);
      setSearch('');
      fetchCollections();
    } catch {
      toast.error('Failed to log collection');
    }
  };

  return (
    <div className="space-y-6">
      <Toaster />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Step 1: Farmer Search & Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Search className="text-blue-500" /> 1. Find Farmer
            </h2>
            <div className="relative">
              <input 
                type="text" 
                value={search} 
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value.length > 2) searchFarmers(e.target.value);
                }}
                placeholder="Type farmer name..."
                className="w-full p-3 pl-10 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
            </div>

            <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
              {farmers.map(f => (
                <button 
                  key={f.id}
                  onClick={() => setSelectedFarmer(f)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    selectedFarmer?.id === f.id 
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500' 
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <p className="font-medium">{f.full_name}</p>
                  <p className="text-xs text-slate-500">{f.village || 'No Village'} • {f.phone || 'No Phone'}</p>
                </button>
              ))}
              {search.length > 2 && farmers.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-4">No farmers found</p>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Log Collection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <PlusCircle className="text-emerald-500" /> 2. Log Collection
            </h2>
            
            {selectedFarmer ? (
              <form onSubmit={handleLogCollection} className="space-y-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex items-center gap-4 border border-slate-100 dark:border-slate-700">
                  <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-full text-blue-600">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Selected Farmer</p>
                    <p className="text-lg font-bold">{selectedFarmer.full_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Milk Quantity (L)</label>
                    <input required type="number" step="0.1" value={qty} onChange={e => setQty(e.target.value)} placeholder="0.0" 
                      className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Fat % (Optional)</label>
                    <input type="number" step="0.1" value={fat} onChange={e => setFat(e.target.value)} placeholder="0.0" 
                      className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Rate per Liter (₹)</label>
                    <input required type="number" step="0.5" value={rate} onChange={e => setRate(e.target.value)} placeholder="0.0" 
                      className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  <p className="text-emerald-800 dark:text-emerald-300 font-medium">Estimated Total</p>
                  <p className="text-2xl font-bold text-emerald-600">₹ {((parseFloat(qty) || 0) * (parseFloat(rate) || 0)).toFixed(2)}</p>
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition transform hover:-translate-y-0.5">
                  Confirm Collection
                </button>
              </form>
            ) : (
              <div className="py-20 text-center text-slate-400">
                <PlusCircle size={48} className="mx-auto mb-4 opacity-20" />
                <p>Please select a farmer from the left to log milk collection.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <History className="text-indigo-500" /> Recent Collections
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b dark:border-slate-700">
                <th className="py-4 text-slate-500 font-medium">Farmer</th>
                <th className="py-4 text-slate-500 font-medium">Date</th>
                <th className="py-4 text-slate-500 font-medium text-right">Qty (L)</th>
                <th className="py-4 text-slate-500 font-medium text-right">Fat %</th>
                <th className="py-4 text-slate-500 font-medium text-right">Rate</th>
                <th className="py-4 text-slate-500 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {collections.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  <td className="py-4">
                    <p className="font-medium text-slate-900 dark:text-white">{c.users?.full_name}</p>
                    <p className="text-xs text-slate-500">{c.users?.village}</p>
                  </td>
                  <td className="py-4 text-slate-500 text-sm">{c.collection_date}</td>
                  <td className="py-4 text-right font-semibold text-slate-900 dark:text-white">{c.quantity_liters} L</td>
                  <td className="py-4 text-right text-slate-500">{c.fat_percent || '-'}%</td>
                  <td className="py-4 text-right text-slate-500">₹{c.rate_per_liter}</td>
                  <td className="py-4 text-right">
                    <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-bold">
                      ₹{c.amount_due}
                    </span>
                  </td>
                </tr>
              ))}
              {collections.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 italic">No collections logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DistributorDashboard;
