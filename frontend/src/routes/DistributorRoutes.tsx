import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LogCollection from '../pages/distributor/LogCollection';
import Collections from '../pages/distributor/Collections';
import ProducedMilk from '../pages/distributor/ProducedMilk';
import MilkListings from '../pages/distributor/MilkListings';

const DistributorRoutes = () => (
  <Routes>
    <Route path="log" element={<LogCollection />} />
    <Route path="history" element={<Collections />} />
    <Route path="produced-milk" element={<ProducedMilk />} />
    <Route path="sell-milk" element={<MilkListings />} />
    <Route path="*" element={<Navigate to="log" replace />} />
  </Routes>
);

export default DistributorRoutes;

