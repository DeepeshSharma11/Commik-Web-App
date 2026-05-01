import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DistributorDashboard from '../pages/DistributorDashboard';

const DistributorRoutes = () => {
  return (
    <Routes>
      <Route path="portal" element={<DistributorDashboard />} />
      <Route path="*" element={<Navigate to="portal" replace />} />
    </Routes>
  );
};

export default DistributorRoutes;
