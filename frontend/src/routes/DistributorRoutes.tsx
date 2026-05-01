import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import LogCollection from '../pages/distributor/LogCollection';
import Collections from '../pages/distributor/Collections';
import { PlusCircle, History } from 'lucide-react';

const DistributorLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-6">
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-2 overflow-x-auto">
      <div className="flex gap-2 min-w-max">
        {[
          { to: '/distributor/log', icon: PlusCircle, label: 'Log Collection' },
          { to: '/distributor/history', icon: History, label: 'History' },
        ].map(item => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`
            }>
            <item.icon size={16} /> {item.label}
          </NavLink>
        ))}
      </div>
    </div>
    <div>{children}</div>
  </div>
);

const DistributorRoutes = () => (
  <DistributorLayout>
    <Routes>
      <Route path="log" element={<LogCollection />} />
      <Route path="history" element={<Collections />} />
      <Route path="*" element={<Navigate to="log" replace />} />
    </Routes>
  </DistributorLayout>
);

export default DistributorRoutes;
