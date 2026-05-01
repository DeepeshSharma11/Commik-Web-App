import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './layouts/Layout';

// Pages
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';

// Sub-Routes
import UserRoutes from './routes/UserRoutes';
import AdminRoutes from './routes/AdminRoutes';
import DistributorRoutes from './routes/DistributorRoutes';

function App() {
  const { token, role } = useAppStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!token ? <Auth /> : <Navigate to="/" replace />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes with Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout children={<div />} />}>
            {/* The Layout wraps children, but since we use Nested Routes, 
                we use a Wrapper component that uses Outlet */}
          </Route>
        </Route>

        {/* Cleaner approach for Protected Layout */}
        <Route element={<ProtectedRoute />}>
           <Route path="/*" element={
             <Layout>
               <Routes>
                 {/* Role-based Redirection for base path */}
                 <Route path="" element={
                   role === 'malik' ? <Navigate to="/admin" replace /> :
                   role === 'distributor' ? <Navigate to="/distributor" replace /> :
                   <Navigate to="/user" replace />
                 } />

                 {/* Role Specific Route Modules */}
                 <Route path="user/*" element={<UserRoutes />} />
                 
                 <Route element={<ProtectedRoute allowedRoles={['malik']} />}>
                   <Route path="admin/*" element={<AdminRoutes />} />
                 </Route>

                 <Route element={<ProtectedRoute allowedRoles={['distributor', 'malik']} />}>
                   <Route path="distributor/*" element={<DistributorRoutes />} />
                 </Route>

                 <Route path="unauthorized" element={
                   <div className="text-center p-20">
                     <h1 className="text-4xl font-bold text-rose-600">403</h1>
                     <p className="text-slate-500">You don't have permission to access this area.</p>
                   </div>
                 } />
               </Routes>
             </Layout>
           } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
