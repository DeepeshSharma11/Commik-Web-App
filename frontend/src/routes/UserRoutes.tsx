import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/customer/Home';
import Cart from '../pages/customer/Cart';
import Checkout from '../pages/customer/Checkout';
import MyOrders from '../pages/customer/MyOrders';
import Profile from '../pages/customer/Profile';
import Support from '../pages/customer/Support';
import PaymentIssues from '../pages/customer/PaymentIssues';
import BulkOrders from '../pages/customer/BulkOrders';
import AIChat from '../pages/customer/AIChat';

const UserRoutes = () => (
  <Routes>
    <Route path="shop" element={<Home />} />
    <Route path="cart" element={<Cart />} />
    <Route path="checkout" element={<Checkout />} />
    <Route path="orders" element={<MyOrders />} />
    <Route path="profile" element={<Profile />} />
    <Route path="support" element={<Support />} />
    <Route path="payment-issues" element={<PaymentIssues />} />
    <Route path="bulk" element={<BulkOrders />} />
    <Route path="ai-chat" element={<AIChat />} />
    <Route path="*" element={<Navigate to="shop" replace />} />
  </Routes>
);

export default UserRoutes;
