import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Users, BarChart3, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';
import { api } from '../api';

const AdminDashboard = () => {
  const [adminStats, setAdminStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users')
      ]);
      setAdminStats(statsRes.data);
      setUsers(usersRes.data);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-blue-600 animate-spin text-4xl font-bold">🐃</div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Toaster />

      {/* Global Stats Banner */}
      <div className="p-8 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 rounded-3xl shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BarChart3 size={160} />
        </div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <ShieldCheck className="text-blue-300" /> Malik Command Center
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
            <p className="text-blue-100 text-xs uppercase font-bold tracking-widest opacity-70">Total Platform Buffaloes</p>
            <p className="text-4xl font-black mt-2">{adminStats?.total_buffaloes}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
            <p className="text-blue-100 text-xs uppercase font-bold tracking-widest opacity-70">Global Milk Yield</p>
            <p className="text-4xl font-black mt-2 text-blue-300">{adminStats?.total_milk_produced.toFixed(1)} <span className="text-xl">L</span></p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
            <p className="text-blue-100 text-xs uppercase font-bold tracking-widest opacity-70">Registered Farmers</p>
            <p className="text-4xl font-black mt-2 text-emerald-400">{users.filter(u => u.role === 'user').length}</p>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Users className="text-indigo-500" /> Platform User Directory
          </h3>
          <span className="text-xs font-bold px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full">
            {users.length} Total Accounts
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                <th className="px-6 py-4">User Info</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                        {u.full_name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">{u.full_name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <Mail size={12} /> {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-lg border ${
                      u.role === 'malik' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                      u.role === 'distributor' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                      'bg-blue-50 border-blue-200 text-blue-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      Active
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-400 font-medium">
                     <div className="flex items-center gap-2"><Calendar size={14}/> {new Date(u.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white rounded-lg transition shadow-sm"><Phone size={16} /></button>
                       <button className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white rounded-lg transition shadow-sm"><Mail size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
