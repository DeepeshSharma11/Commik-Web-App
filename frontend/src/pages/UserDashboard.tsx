import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Send, Droplet, Plus, Trash, Edit, X, HeartPulse, ClipboardList } from 'lucide-react';
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

  // Buffalo CRUD state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBufName, setNewBufName] = useState('');
  const [newBufTag, setNewBufTag] = useState('');
  const [newBufBreed, setNewBufBreed] = useState('');

  // Health State
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthBufId, setHealthBufId] = useState('');
  const [healthType, setHealthType] = useState('vaccination');
  const [healthDesc, setHealthDesc] = useState('');
  const [healthCost, setHealthCost] = useState('');

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

  const handleAddBuffalo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/buffaloes/', {
        name: newBufName,
        tag_number: newBufTag || null,
        breed: newBufBreed || null
      });
      toast.success('Buffalo added!');
      setNewBufName(''); setNewBufTag(''); setNewBufBreed('');
      setShowAddModal(false);
      fetchDashboard();
    } catch {
      toast.error('Failed to add buffalo');
    }
  };

  const handleDeleteBuffalo = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this buffalo? All milk logs will be lost.')) return;
    try {
      await api.delete(`/buffaloes/${id}`);
      toast.success('Buffalo deleted');
      fetchDashboard();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleLogHealth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/health/', {
        buffalo_id: healthBufId,
        record_date: new Date().toISOString().split('T')[0],
        record_type: healthType,
        description: healthDesc,
        cost: parseFloat(healthCost) || 0
      });
      toast.success('Health record saved!');
      setShowHealthModal(false);
      setHealthDesc(''); setHealthCost('');
    } catch {
      toast.error('Failed to save health record');
    }
  };

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

      {/* MODAL: ADD BUFFALO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add New Buffalo</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddBuffalo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Buffalo Name</label>
                <input required value={newBufName} onChange={e => setNewBufName(e.target.value)} placeholder="e.g. Ganga" className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Tag Number (Optional)</label>
                <input value={newBufTag} onChange={e => setNewBufTag(e.target.value)} placeholder="e.g. BUF-101" className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Breed (Optional)</label>
                <input value={newBufBreed} onChange={e => setNewBufBreed(e.target.value)} placeholder="e.g. Murrah" className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition">
                Register Buffalo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HEALTH LOG */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><HeartPulse className="text-rose-500"/> Log Health Event</h2>
              <button onClick={() => setShowHealthModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleLogHealth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Select Buffalo</label>
                <select required value={healthBufId} onChange={e => setHealthBufId(e.target.value)} className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Select --</option>
                  {buffaloes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Event Type</label>
                <select value={healthType} onChange={e => setHealthType(e.target.value)} className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="vaccination">Vaccination</option>
                  <option value="illness">Illness</option>
                  <option value="checkup">Regular Checkup</option>
                  <option value="deworming">Deworming</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Description</label>
                <textarea required value={healthDesc} onChange={e => setHealthDesc(e.target.value)} placeholder="Details of the event..." className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 h-24" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Cost (₹)</label>
                <input type="number" value={healthCost} onChange={e => setHealthCost(e.target.value)} placeholder="0.00" className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-xl shadow-lg transition">
                Save Health Record
              </button>
            </form>
          </div>
        </div>
      )}

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
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center relative overflow-hidden">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Health Status</h3>
          <button onClick={() => setShowHealthModal(true)} className="mt-2 text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1">
            <HeartPulse size={16}/> Log Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buffalo List */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">🐃 Buffalo Herd</h2>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition shadow-md">
              <Plus size={18} /> Add New
            </button>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {buffaloes.map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-400 transition">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                     {b.name[0]}
                   </div>
                   <div>
                     <p className="font-bold text-slate-900 dark:text-white">{b.name}</p>
                     <p className="text-xs text-slate-500">{b.breed || 'Unknown Breed'} • {b.tag_number || 'No Tag'}</p>
                   </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-blue-500 transition"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteBuffalo(b.id)} className="p-2 text-slate-400 hover:text-rose-500 transition"><Trash size={18} /></button>
                </div>
              </div>
            ))}
            {buffaloes.length === 0 && (
              <div className="text-center py-10 text-slate-400 italic">No buffaloes registered yet. Click "Add New" to start.</div>
            )}
          </div>
        </div>

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
              <div className="flex-1">
                <label className="text-xs text-slate-500 ml-1">Morning (L)</label>
                <input type="number" step="0.1" value={morning} onChange={e => setMorning(e.target.value)} placeholder="0.0" className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 ml-1">Evening (L)</label>
                <input type="number" step="0.1" value={evening} onChange={e => setEvening(e.target.value)} placeholder="0.0" className="w-full p-3 border dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition">
              Save Milk Log
            </button>
          </form>
        </div>
      </div>

      {/* AI Chat */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 text-white flex flex-col h-[450px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">✨ CommilK AI</h2>
          <button onClick={() => { setChatMessages([]); setChatSessionId(null); }}
            className="text-xs text-white/50 hover:text-white/80 transition underline decoration-white/20 underline-offset-4">
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
          {chatMessages.length === 0 && (
            <div className="text-center mt-12 space-y-2">
               <p className="text-white/40 text-sm italic">Ask me anything about your farm...</p>
               <p className="text-white/20 text-[10px]">Try: "How to increase milk yield?"</p>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-500 text-white rounded-br-none'
                  : 'bg-white/15 text-white/90 rounded-bl-none shadow-inner'
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
            className="flex-1 p-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-indigo-400 transition shadow-inner" />
          <button disabled={loadingAI} type="submit" className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 rounded-xl shadow-lg transition flex items-center justify-center">
            {loadingAI ? '...' : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserDashboard;
