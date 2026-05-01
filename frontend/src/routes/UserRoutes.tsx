import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Home from '../pages/customer/Home';
import Cart from '../pages/customer/Cart';
import Checkout from '../pages/customer/Checkout';
import MyOrders from '../pages/customer/MyOrders';
import Profile from '../pages/customer/Profile';
import Support from '../pages/customer/Support';
import PaymentIssues from '../pages/customer/PaymentIssues';
import BulkOrders from '../pages/customer/BulkOrders';

import { ShoppingBag, ShoppingCart, CreditCard, History, User, Headphones, AlertTriangle, Truck } from 'lucide-react';

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="space-y-6">
      {/* Customer Sub-Navigation */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {[
            { to: '/user/shop', icon: ShoppingBag, label: 'Shop' },
            { to: '/user/cart', icon: ShoppingCart, label: 'Cart' },
            { to: '/user/checkout', icon: CreditCard, label: 'Checkout' },
            { to: '/user/orders', icon: History, label: 'My Orders' },
            { to: '/user/bulk', icon: Truck, label: 'Bulk Orders' },
            { to: '/user/support', icon: Headphones, label: 'Support' },
            { to: '/user/payment-issues', icon: AlertTriangle, label: 'Payment Issues' },
            { to: '/user/profile', icon: User, label: 'Profile' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`
              }
            >
              <item.icon size={16} /> {item.label}
            </NavLink>
          ))}
        </div>
      </div>
      
      {/* Render the specific page */}
      <div>{children}</div>
    </div>
  );
};

const UserRoutes = () => {
  return (
    <UserLayout>
      <Routes>
        <Route path="shop" element={<Home />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="profile" element={<Profile />} />
        <Route path="support" element={<Support />} />
        <Route path="payment-issues" element={<PaymentIssues />} />
        <Route path="bulk" element={<BulkOrders />} />
        <Route path="*" element={<Navigate to="shop" replace />} />
      </Routes>
    </UserLayout>
  );
};

export default UserRoutes;
