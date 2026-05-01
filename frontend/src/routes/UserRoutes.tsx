import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserDashboard from '../pages/UserDashboard';

const UserRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<UserDashboard />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default UserRoutes;
