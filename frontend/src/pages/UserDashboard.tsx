import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Send, Droplet } from 'lucide-react';
import { api } from '../api';

const UserDashboard = () => {
  const [buffaloes, setBuffaloes] = useState<any[]>([]);
  const [totalYield, setTotalYield] = useState(0);
  const [selectedBuf, setSelectedBuf] = useState('');
  const [morning, setMorning] = useState('');
  const [evening, setEvening] = useState('');

  // AI Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchDashboard();
  }, []);

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
      toast.error('AI is offline');
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toaster />
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

        {/* AI Chat */}
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
    </div>
  );
};

export default UserDashboard;
