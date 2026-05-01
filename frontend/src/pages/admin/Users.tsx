import React, { useEffect, useState } from 'react';
import { Mail, Phone, Calendar, Users as UsersIcon } from 'lucide-react';
import { api } from '../../api';
import { toast } from 'react-hot-toast';
import { PageSkeleton } from '../../components/Skeleton';

const Users = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } catch {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in duration-300">
      <div className="px-6 py-4 border-b dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><UsersIcon className="text-blue-500" size={18} /> User Management</h3>
        <span className="text-xs text-slate-400 font-bold">{users.length} total</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/40 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm">
                      {(u.full_name || '?')[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition">{u.full_name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10} /> {u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-lg border ${
                    u.role === 'malik'       ? 'bg-rose-50 border-rose-200 text-rose-600' :
                    u.role === 'distributor' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                    u.role === 'farmer'      ? 'bg-green-50 border-green-200 text-green-600' :
                    'bg-blue-50 border-blue-200 text-blue-600'
                  }`}>{u.role}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{u.village || '—'}</td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(u.created_at).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {u.phone && <a href={`tel:${u.phone}`} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white rounded-lg transition text-slate-500"><Phone size={14} /></a>}
                    <a href={`mailto:${u.email}`} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white rounded-lg transition text-slate-500"><Mail size={14} /></a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
