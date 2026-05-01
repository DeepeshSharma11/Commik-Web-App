import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Overview from '../pages/admin/Overview';
import Users from '../pages/admin/Users';
import Orders from '../pages/admin/Orders';
import Payments from '../pages/admin/Payments';
import Settings from '../pages/admin/Settings';
import CreateDistributor from '../pages/admin/CreateDistributor';
import { BarChart3, Users as UsersIcon, ShoppingBag, Smartphone, Settings as SettingsIcon, UserPlus } from 'lucide-react';

const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-6">
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-2 overflow-x-auto">
      <div className="flex gap-2 min-w-max">
        {[
          { to: '/admin/overview', icon: BarChart3, label: 'Overview' },
          { to: '/admin/users', icon: UsersIcon, label: 'Users' },
          { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
          { to: '/admin/payments', icon: Smartphone, label: 'Payments' },
          { to: '/admin/create-distributor', icon: UserPlus, label: 'Add Distributor' },
          { to: '/admin/settings', icon: SettingsIcon, label: 'Pay Settings' },
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

const AdminRoutes = () => (
  <AdminLayout>
    <Routes>
      <Route path="overview" element={<Overview />} />
      <Route path="users" element={<Users />} />
      <Route path="orders" element={<Orders />} />
      <Route path="payments" element={<Payments />} />
      <Route path="create-distributor" element={<CreateDistributor />} />
      <Route path="settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="overview" replace />} />
    </Routes>
  </AdminLayout>
);

export default AdminRoutes;
