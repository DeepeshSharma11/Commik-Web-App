import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Moon, Sun, Bell, LogOut, Send, Droplet } from 'lucide-react';
import { useAppStore } from './store';
import { api } from './api';

type AuthView = 'login' | 'signup' | 'forgot';

function App() {
  const { token, theme, toggleTheme, setToken } = useAppStore();

  // Detect reset token from URL on load
  const urlParams = new URLSearchParams(window.location.search);
  const [resetToken] = useState<string | null>(urlParams.get('token'));

  // Auth state
  const [authView, setAuthView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Dashboard state
  const [buffaloes, setBuffaloes] = useState<any[]>([]);
  const [totalYield, setTotalYield] = useState(0);

  // Milk Form
  const [selectedBuf, setSelectedBuf] = useState('');
  const [morning, setMorning] = useState('');
  const [evening, setEvening] = useState('');

  // AI Chat
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: string; text: string}[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);

  // Sync theme on mount
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Fetch dashboard data on login
  useEffect(() => {
    if (token) fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    try {
      const bufRes = await api.get('/buffaloes/');
      setBuffaloes(bufRes.data);
      const logsRes = await api.get('/milk-logs/');
      const sum = logsRes.data.reduce((acc: number, cur: any) => acc + (parseFloat(cur.total_qty_liters) || 0), 0);
      setTotalYield(sum);
    } catch {
      toast.error('Failed to fetch dashboard data');
    }
  };

  // --- Auth Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      const res = await api.post('/auth/login', formData);
      setToken(res.data.access_token, res.data.role);
      toast.success('Welcome back!');
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

  // --- Data Handlers ---
  const handleLogMilk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuf) return toast.error('Select a buffalo');
    try {
      await api.post('/milk-logs/', {
        buffalo_id: selectedBuf,
        log_date: new Date().toISOString().split('T')[0],
        morning_qty_liters: parseFloat(morning) || 0,
        evening_qty_liters: parseFloat(evening) || 0,
      });
      toast.success('Milk logged successfully!');
      setMorning('');
      setEvening('');
      fetchDashboard();
    } catch {
      toast.error('Failed to log milk');
    }
  };

  const askAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setLoadingAI(true);
    try {
      const res = await api.post('/ai/chat', { message: userMsg, session_id: chatSessionId });
      setChatMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }]);
      setChatSessionId(res.data.session_id);
    } catch {
      toast.error('AI service unavailable');
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I could not respond right now.' }]);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    try {
      await api.post('/auth/reset-password', { token: resetToken, new_password: newPassword });
      toast.success('Password reset! Please login.');
      // Clear token from URL and go to login
      window.history.replaceState({}, '', '/');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid or expired link');
    }
  };

  // ========== RESET PASSWORD SCREEN (from email link) ==========
  if (resetToken && !token) {
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
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Set your new password</p>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
              <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="mt-1 w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
              <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="mt-1 w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg">
              Set New Password
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ========== AUTH SCREEN ==========
  if (!token) {
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

          {/* FORGOT PASSWORD */}
          {authView === 'forgot' && (
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
          )}

          {/* LOGIN / SIGNUP */}
          {authView !== 'forgot' && (
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
                {authView === 'login' && (
                  <div className="text-right -mt-2">
                    <button type="button" onClick={() => setAuthView('forgot')} className="text-xs text-blue-500 hover:underline">
                      Forgot password?
                    </button>
                  </div>
                )}
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg">
                  {authView === 'login' ? 'Login to Farm' : 'Create Account'}
                </button>
              </form>
              <div className="mt-5 text-center border-t dark:border-slate-700 pt-5">
                <button onClick={() => { setAuthView(authView === 'login' ? 'signup' : 'login'); setPassword(''); }}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                  {authView === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ========== DASHBOARD SCREEN ==========
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors text-slate-900 dark:text-slate-100">
      <Toaster position="top-right" />

      {/* Navigation */}
      <nav className="bg-blue-700 dark:bg-slate-800 text-white p-4 shadow-md flex justify-between items-center border-b dark:border-slate-700">
        <h1 className="text-2xl font-bold tracking-wide flex items-center gap-2">
          🐃 <span className="hidden sm:inline">CommilK</span>
        </h1>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-white/10 transition relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-white/10 transition">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setToken(null, null)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition">
            <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">My Buffaloes</h3>
            <p className="text-4xl font-bold mt-2">{buffaloes.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Total Lifetime Yield</h3>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">{totalYield.toFixed(1)} L</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Health Alerts</h3>
            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">All Clear</p>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Milk Log Form */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Droplet className="text-blue-500" /> Log Daily Milk
            </h2>
            <form onSubmit={handleLogMilk} className="space-y-4">
              <select value={selectedBuf} onChange={e => setSelectedBuf(e.target.value)}
                className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition">
                <option value="">-- Select Buffalo --</option>
                {buffaloes.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.tag_number || 'No Tag'})</option>
                ))}
              </select>
              <div className="flex gap-4">
                <input type="number" step="0.1" value={morning} onChange={e => setMorning(e.target.value)} placeholder="Morning (L)" className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
                <input type="number" step="0.1" value={evening} onChange={e => setEvening(e.target.value)} placeholder="Evening (L)" className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition">
                Save Milk Log
              </button>
            </form>
          </div>

          {/* AI Chat with Memory */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 text-white flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">✨ CommilK AI</h2>
              <button onClick={() => { setChatMessages([]); setChatSessionId(null); }}
                className="text-xs text-white/50 hover:text-white/80 transition">
                New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
              {chatMessages.length === 0 && (
                <p className="text-white/40 text-sm italic text-center mt-8">Ask me anything about your farm...</p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-500 text-white rounded-br-none'
                      : 'bg-white/15 text-white/90 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loadingAI && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white/60 px-4 py-2 rounded-2xl text-sm animate-pulse">Thinking...</div>
                </div>
              )}
            </div>
            <form onSubmit={askAI} className="flex gap-2">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about farm health..."
                className="flex-1 p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-indigo-400 transition" />
              <button disabled={loadingAI} type="submit" className="bg-indigo-500 hover:bg-indigo-400 text-white p-3 rounded-xl shadow transition flex items-center justify-center min-w-[50px]">
                {loadingAI ? '...' : <Send size={20} />}
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
