import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Sun, Moon, Sparkles, Tractor, ShieldCheck, Milk } from 'lucide-react';
import { useAuth, useTheme } from '../context';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

type AuthView = 'login' | 'signup' | 'forgot';

const Auth = () => {
  const { setToken } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [authView, setAuthView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      const res = await api.post('/auth/login', formData);
      setToken(res.data.access_token, res.data.role);
      toast.success('Welcome back!');
      navigate('/');
    } catch {
      toast.error('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', { email, password, full_name: fullName, phone });
      toast.success('Account created successfully! Please sign in.');
      setAuthView('login');
      setPassword('');
      setPhone('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: resetEmail });
      toast.success('We sent a reset link to your email.');
      setAuthView('login');
      setResetEmail('');
    } catch {
      toast.error('Something went wrong. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Toaster />
      
      {/* Left Pane: Beautiful Feature Showcase (Visible on Large Screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-900 items-center justify-center p-12 text-white overflow-hidden">
        {/* Abstract Glow Effects */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl translate-y-1/3 translate-x-1/3"></div>
        
        <div className="relative z-10 max-w-lg space-y-10">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🐃</span>
            <span className="text-3xl font-black tracking-wider bg-clip-text bg-gradient-to-r from-white to-emerald-200">CommilK</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-extrabold leading-tight">Your Digital Dairy Farm Assistant.</h2>
            <p className="text-emerald-100/90 text-lg">Pure milk tracking, smart animal management, and AI guidance — all in one simple tool.</p>
          </div>

          {/* Features Checklist */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-xl mt-1">
                <Tractor size={20} className="text-emerald-300" />
              </div>
              <div>
                <h4 className="font-bold text-white">Manage Your Herd</h4>
                <p className="text-sm text-emerald-100/80">Register buffaloes, assign ear tags, and monitor health easily.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-xl mt-1">
                <Milk size={20} className="text-emerald-300" />
              </div>
              <div>
                <h4 className="font-bold text-white">Log Milk Everyday</h4>
                <p className="text-sm text-emerald-100/80">Track morning and evening milk yield in real-time.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-xl mt-1">
                <Sparkles size={20} className="text-emerald-300" />
              </div>
              <div>
                <h4 className="font-bold text-white">Ask CommilK AI</h4>
                <p className="text-sm text-emerald-100/80">Talk to our AI helper to get tips on feed, illness, and milk yield.</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex items-center gap-2 text-xs text-emerald-200/70">
            <ShieldCheck size={14} /> Encrypted · Farm-Safe Data
          </div>
        </div>
      </div>

      {/* Right Pane: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Toggle Theme button */}
        <button 
          onClick={toggleTheme} 
          className="absolute top-6 right-6 p-3 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-md transition text-slate-600 dark:text-slate-300"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 transition duration-300">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2 lg:hidden">
              <span className="text-3xl">🐃</span>
              <h1 className="text-2xl font-black text-emerald-700 dark:text-emerald-400">CommilK</h1>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white">
              {authView === 'login' && 'Welcome Back!'}
              {authView === 'signup' && 'Create Account'}
              {authView === 'forgot' && 'Reset Password'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              {authView === 'login' && 'Sign in to access your dashboard.'}
              {authView === 'signup' && 'Register your farm to start logging milk.'}
              {authView === 'forgot' && 'Enter your email to receive a password reset link.'}
            </p>
          </div>

          {authView === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Your Email</label>
                <input 
                  required 
                  disabled={loading}
                  type="email" 
                  value={resetEmail} 
                  onChange={e => setResetEmail(e.target.value)} 
                  placeholder="name@example.com"
                  className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition disabled:opacity-50" 
                />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 active:scale-98 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
              <div className="text-center mt-4">
                <button type="button" disabled={loading} onClick={() => setAuthView('login')} className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold hover:underline disabled:opacity-50">
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={authView === 'login' ? handleLogin : handleRegister} className="space-y-5">
                {authView === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Full Name</label>
                      <input 
                        required 
                        disabled={loading}
                        type="text" 
                        value={fullName} 
                        onChange={e => setFullName(e.target.value)} 
                        placeholder="e.g. Deepesh Sharma"
                        className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition disabled:opacity-50" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Phone Number</label>
                      <input 
                        required 
                        disabled={loading}
                        type="tel" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        placeholder="e.g. +91 99999 99999"
                        className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition disabled:opacity-50" 
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Email Address</label>
                  <input 
                    required 
                    disabled={loading}
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="name@example.com"
                    className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition disabled:opacity-50" 
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Password</label>
                    {authView === 'login' && (
                      <button type="button" disabled={loading} onClick={() => setAuthView('forgot')} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50">
                        Forgot?
                      </button>
                    )}
                  </div>
                  <input 
                    required 
                    disabled={loading}
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition disabled:opacity-50" 
                  />
                </div>
                
                <button type="submit" disabled={loading} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 active:scale-98 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{authView === 'login' ? 'Signing In...' : 'Registering...'}</span>
                    </>
                  ) : (
                    authView === 'login' ? 'Sign In' : 'Get Started'
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50 text-center">
                <button 
                  disabled={loading}
                  onClick={() => setAuthView(authView === 'login' ? 'signup' : 'login')} 
                  className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold hover:underline disabled:opacity-50"
                >
                  {authView === 'login' ? "New to CommilK? Create an account" : 'Already have an account? Sign in'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
