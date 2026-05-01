import React from 'react';
import { User, Mail, Shield, Smartphone } from 'lucide-react';
import { useAppStore } from '../../store';

const Profile = () => {
  const { role } = useAppStore();

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <h2 className="text-2xl font-black mb-6">My Profile</h2>
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b dark:border-slate-700">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600">
            <User size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-bold">CommilK User</h3>
            <span className="inline-block mt-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 text-xs font-black uppercase tracking-wider rounded-lg border border-blue-200 dark:border-blue-800">
              Role: {role}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border dark:border-slate-700">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><Mail className="text-slate-500" size={20} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
              <p className="font-bold">Registered email appears here</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border dark:border-slate-700">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><Smartphone className="text-slate-500" size={20} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
              <p className="font-bold">+91 XXXXX XXXXX</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border dark:border-slate-700">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><Shield className="text-slate-500" size={20} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Security</p>
              <button className="text-sm font-bold text-blue-600 hover:underline">Change Password</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
