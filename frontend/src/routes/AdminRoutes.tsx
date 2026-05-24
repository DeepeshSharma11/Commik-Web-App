import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Overview from '../pages/admin/Overview';
import Users from '../pages/admin/Users';
import Orders from '../pages/admin/Orders';
import Payments from '../pages/admin/Payments';
import Settings from '../pages/admin/Settings';
import CreateSeller from '../pages/admin/CreateSeller';

const AdminRoutes = () => (
  <Routes>
    <Route path="overview" element={<Overview />} />
    <Route path="users" element={<Users />} />
    <Route path="orders" element={<Orders />} />
    <Route path="payments" element={<Payments />} />
    <Route path="create-seller" element={<CreateSeller />} />
    <Route path="settings"           element={<Settings />} />
    <Route path="*"                  element={<Navigate to="overview" replace />} />

  </Routes>
);

export default AdminRoutes;

