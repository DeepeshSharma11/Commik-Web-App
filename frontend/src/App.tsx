import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ThemeProvider, CartProvider, useAuth } from './context';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './layouts/Layout';

// Pages
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

// Sub-Routes
import UserRoutes from './routes/UserRoutes';
import AdminRoutes from './routes/AdminRoutes';
import DistributorRoutes from './routes/DistributorRoutes';

const AppRoutes = () => {
  const { token, role } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!token ? <Auth /> : <Navigate to="/" replace />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Routes with Layout */}
      <Route element={<ProtectedRoute />}>
         <Route path="/*" element={
           <Layout>
             <Routes>
                {/* Role-based Redirection for base path */}
                <Route path="" element={
                  role === 'admin'  ? <Navigate to="/admin" replace /> :
                  role === 'seller' ? <Navigate to="/user/farm" replace /> :
                  <Navigate to="/user" replace />
                } />

                {/* Role Specific Route Modules */}
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="privacy" element={<PrivacyPolicy />} />
                <Route path="terms" element={<TermsOfService />} />
                <Route path="user/*" element={<UserRoutes />} />
                
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="admin/*" element={<AdminRoutes />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['seller', 'admin']} />}>
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
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
