import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { api } from '../api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token');
    if (!t) {
      toast.error('Invalid or missing reset token.');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setToken(t);
    }
  }, [searchParams, navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match!');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: token,
        new_password: password
      });
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Toaster />
      <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm mx-auto">
          <KeyRound size={32} />
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">Create New Password</h2>
        <p className="text-center text-slate-500 mb-8 text-sm">Please enter your new password below.</p>

        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">New Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Confirm Password</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Resetting...' : <><ShieldCheck size={20} /> Reset Password</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
