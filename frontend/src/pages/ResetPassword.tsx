import React, { useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { api } from '../api';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error('Invalid link');
    try {
      await api.post('/auth/reset-password', { token, new_password: newPassword });
      toast.success('Password updated! Please login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      toast.error('Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Toaster />
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">New Password</h1>
        <p className="text-slate-500 text-sm mb-6">Enter a strong password for your account.</p>
        <form onSubmit={handleReset} className="space-y-4">
          <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••"
            className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
