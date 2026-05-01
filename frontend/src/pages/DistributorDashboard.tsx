import React from 'react';

const DistributorDashboard = () => {
  return (
    <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">🚛 Distributor Portal</h2>
      <p className="text-slate-500 dark:text-slate-400">
        This panel will manage milk collections, distributor logs, and route tracking.
      </p>
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl inline-block">
        Coming Soon in Phase 2
      </div>
    </div>
  );
};

export default DistributorDashboard;
