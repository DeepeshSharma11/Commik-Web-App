import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from '../pages/AdminDashboard';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="overview" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="overview" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
