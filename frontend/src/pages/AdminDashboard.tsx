import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../api';

const AdminDashboard = () => {
  const [adminStats, setAdminStats] = useState<any>(null);

  const fetchAdminStats = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setAdminStats(res.data);
    } catch {
      toast.error('Failed to load admin analytics');
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  if (!adminStats) return <div className="p-8 text-center animate-pulse">Loading Admin Data...</div>;

  return (
    <div className="space-y-6">
      <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl shadow-lg text-white">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">👑 Malik Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/10 p-4 rounded-xl border border-white/20">
            <p className="text-blue-100 text-xs uppercase font-semibold tracking-widest">Total App Buffaloes</p>
            <p className="text-3xl font-bold mt-1">{adminStats.total_buffaloes}</p>
          </div>
          <div className="bg-white/10 p-4 rounded-xl border border-white/20">
            <p className="text-blue-100 text-xs uppercase font-semibold tracking-widest">Total App Milk Yield</p>
            <p className="text-3xl font-bold mt-1">{adminStats.total_milk_produced.toFixed(1)} L</p>
          </div>
        </div>
      </div>
      
      {/* Placeholder for future admin controls */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center">
        <p className="text-slate-500 dark:text-slate-400">User management and configuration tools coming soon...</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
