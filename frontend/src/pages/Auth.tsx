import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Sun, Moon } from 'lucide-react';
import { useAppStore } from '../store';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

type AuthView = 'login' | 'signup' | 'forgot';

const Auth = () => {
  const { theme, toggleTheme, setToken } = useAppStore();
  const navigate = useNavigate();

  const [authView, setAuthView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      const res = await api.post('/auth/login', formData);
      setToken(res.data.access_token, res.data.role);
      toast.success('Welcome back!');
      navigate('/');
    } catch {
      toast.error('Invalid email or password');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { email, password, full_name: fullName });
      toast.success('Account created! Please login.');
      setAuthView('login');
      setPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/forgot-password', { email: resetEmail });
      toast.success('Reset link sent! Check your email.');
      setAuthView('login');
      setResetEmail('');
    } catch {
      toast.error('Something went wrong. Try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors">
      <Toaster />
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400">🐃 CommilK</h1>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          {authView === 'login' && 'Welcome back, Farmer!'}
          {authView === 'signup' && 'Create your farm account'}
          {authView === 'forgot' && 'Reset your password'}
        </p>

        {authView === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Your Email</label>
              <input required type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="your@email.com"
                className="mt-1 w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all shadow-md">
              Send Reset Link
            </button>
            <div className="text-center">
              <button type="button" onClick={() => setAuthView('login')} className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <>
            <form onSubmit={authView === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {authView === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                  <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Deepesh Kumar"
                    className="mt-1 w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                  className="mt-1 w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="mt-1 w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg">
                {authView === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <button onClick={() => setAuthView(authView === 'login' ? 'signup' : 'login')} className="text-blue-600 dark:text-blue-400 text-sm hover:underline block w-full">
                {authView === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>
              {authView === 'login' && (
                <button onClick={() => setAuthView('forgot')} className="text-slate-400 text-xs hover:underline">
                  Forgot Password?
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
