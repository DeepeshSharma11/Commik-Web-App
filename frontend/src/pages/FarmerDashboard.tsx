import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Send, Droplet, Plus, Trash, Edit, X, HeartPulse, Sparkles, Tractor, Award, TrendingUp, Calendar } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context';
import MarkdownMessage from '../components/MarkdownMessage';

const FarmerDashboard = () => {
  const { token } = useAuth();
  
  // Dashboard state
  const [buffaloes, setBuffaloes] = useState<any[]>([]);
  const [milkLogs, setMilkLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedBuf, setSelectedBuf] = useState('');
  const [morning, setMorning] = useState('');
  const [evening, setEvening] = useState('');

  // AI Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Buffalo CRUD Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBufName, setNewBufName] = useState('');
  const [newBufTag, setNewBufTag] = useState('');
  const [newBufBreed, setNewBufBreed] = useState('');
  const [newBufStatus, setNewBufStatus] = useState('milking');
  const [newBufNotes, setNewBufNotes] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editBufId, setEditBufId] = useState('');
  const [editBufName, setEditBufName] = useState('');
  const [editBufTag, setEditBufTag] = useState('');
  const [editBufBreed, setEditBufBreed] = useState('');
  const [editBufStatus, setEditBufStatus] = useState('milking');
  const [editBufNotes, setEditBufNotes] = useState('');

  // Health Modal state
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthBufId, setHealthBufId] = useState('');
  const [healthType, setHealthType] = useState('vaccination');
  const [healthDesc, setHealthDesc] = useState('');
  const [healthCost, setHealthCost] = useState('');

  // Form submission loading states
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [submittingMilk, setSubmittingMilk] = useState(false);
  const [submittingHealth, setSubmittingHealth] = useState(false);

  // Fetch all dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [bufRes, logsRes] = await Promise.all([
        api.get('/buffaloes/'),
        api.get('/milk-logs/')
      ]);
      setBuffaloes(bufRes.data);
      setMilkLogs(logsRes.data);
    } catch {
      toast.error('Failed to load farm details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  // Compute stats
  const stats = useMemo(() => {
    const totalYield = milkLogs.reduce((sum, log) => sum + (parseFloat(log.total_qty_liters) || 0), 0);
    const activeMilkers = buffaloes.filter(b => b.status === 'milking').length;
    
    // Average daily yield per buffalo based on logged records
    const uniqueBuffaloesLogged = new Set(milkLogs.map(l => l.buffalo_id)).size;
    const averageYield = uniqueBuffaloesLogged > 0 ? (totalYield / milkLogs.length) : 0;

    return {
      totalYield,
      activeMilkers,
      averageYield
    };
  }, [buffaloes, milkLogs]);

  // Weekly Trend: calculate daily sums for the last 7 days
  const weeklyTrend = useMemo(() => {
    const days = [];
    const dateMap: Record<string, { total: number; morning: number; evening: number }> = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({ dateStr, label: dayLabel });
      dateMap[dateStr] = { total: 0, morning: 0, evening: 0 };
    }

    // Accumulate logs
    milkLogs.forEach(log => {
      const dateStr = log.log_date;
      if (dateMap[dateStr]) {
        dateMap[dateStr].total += parseFloat(log.total_qty_liters) || 0;
        dateMap[dateStr].morning += parseFloat(log.morning_qty_liters) || 0;
        dateMap[dateStr].evening += parseFloat(log.evening_qty_liters) || 0;
      }
    });

    const items = days.map(d => ({
      label: d.label,
      date: d.dateStr,
      total: dateMap[d.dateStr].total,
      morning: dateMap[d.dateStr].morning,
      evening: dateMap[d.dateStr].evening
    }));

    const maxVal = Math.max(...items.map(i => i.total), 1); // Avoid division by zero

    return items.map(item => ({
      ...item,
      percentage: (item.total / maxVal) * 100
    }));
  }, [milkLogs]);

  // Breed breakdown analytics
  const breedMix = useMemo(() => {
    if (buffaloes.length === 0) return [];
    const counts: Record<string, number> = {};
    buffaloes.forEach(b => {
      const bBreed = b.breed?.trim() || 'Other';
      counts[bBreed] = (counts[bBreed] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / buffaloes.length) * 100)
    }));
  }, [buffaloes]);

  // Buffalo Operations
  const handleAddBuffalo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAdd(true);
    try {
      await api.post('/buffaloes/', {
        name: newBufName,
        tag_number: newBufTag || null,
        breed: newBufBreed || null,
        status: newBufStatus,
        notes: newBufNotes || null
      });
      toast.success('Buffalo registered successfully!');
      setNewBufName(''); setNewBufTag(''); setNewBufBreed(''); setNewBufStatus('milking'); setNewBufNotes('');
      setShowAddModal(false);
      fetchDashboard();
    } catch {
      toast.error('Could not register buffalo.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleOpenEdit = (b: any) => {
    setEditBufId(b.id);
    setEditBufName(b.name);
    setEditBufTag(b.tag_number || '');
    setEditBufBreed(b.breed || '');
    setEditBufStatus(b.status || 'milking');
    setEditBufNotes(b.notes || '');
    setShowEditModal(true);
  };

  const handleEditBuffalo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEdit(true);
    try {
      await api.put(`/buffaloes/${editBufId}`, {
        name: editBufName || null,
        tag_number: editBufTag || null,
        breed: editBufBreed || null,
        status: editBufStatus,
        notes: editBufNotes || null
      });
      toast.success('Buffalo details updated!');
      setShowEditModal(false);
      fetchDashboard();
    } catch {
      toast.error('Failed to update details.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteBuffalo = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this buffalo? All milk logs associated with it will be removed.')) return;
    try {
      await api.delete(`/buffaloes/${id}`);
      toast.success('Buffalo removed from your herd.');
      fetchDashboard();
    } catch {
      toast.error('Failed to remove buffalo.');
    }
  };

  // Milk logging
  const handleLogMilk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuf) return toast.error('Please choose a buffalo.');
    setSubmittingMilk(true);
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
      toast.error('Could not log milk.');
    } finally {
      setSubmittingMilk(false);
    }
  };

  // Health logging
  const handleLogHealth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!healthBufId) return toast.error('Please select a buffalo.');
    setSubmittingHealth(true);
    try {
      await api.post('/health/', {
        buffalo_id: healthBufId,
        record_date: new Date().toISOString().split('T')[0],
        record_type: healthType,
        description: healthDesc,
        cost: parseFloat(healthCost) || 0
      });
      toast.success('Health event saved successfully!');
      setShowHealthModal(false);
      setHealthDesc(''); setHealthCost(''); setHealthBufId('');
    } catch {
      toast.error('Failed to save health record.');
    } finally {
      setSubmittingHealth(false);
    }
  };

  // AI Chat SSE Streaming
  const askAI = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const userMsg = chatInput.trim();
    if (!userMsg || loadingAI) return;

    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setLoadingAI(true);

    // Append empty bubble for assistant response typing
    setChatMessages(prev => [...prev, { role: 'assistant', text: '', streaming: true }]);

    abortRef.current = new AbortController();

    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      const resp = await fetch(`${BASE_URL}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMsg, session_id: chatSessionId }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) throw new Error('Stream failed');

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'session') {
              setChatSessionId(data.session_id);
            } else if (data.type === 'token') {
              setChatMessages(prev => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') {
                  copy[copy.length - 1] = { ...last, text: last.text + data.token };
                }
                return copy;
              });
            } else if (data.type === 'done') {
              setChatMessages(prev => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') {
                  copy[copy.length - 1] = { ...last, streaming: false };
                }
                return copy;
              });
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch { /* ignore parsing issues */ }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      toast.error('AI helper connection failed. Try again.');
      setChatMessages(prev => prev.filter((_, i) => !(i === prev.length - 1 && prev[i].text === '')));
    } finally {
      setLoadingAI(false);
    }
  }, [chatInput, loadingAI, chatSessionId, token]);

  const handleNewChat = () => {
    abortRef.current?.abort();
    setChatMessages([]);
    setChatSessionId(null);
    toast.success('New conversation started');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Toaster />

      {/* --- MODAL: ADD BUFFALO --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Register Buffalo</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition text-slate-500">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddBuffalo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Buffalo Name</label>
                <input required value={newBufName} onChange={e => setNewBufName(e.target.value)} placeholder="e.g. Ganga" className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Tag Number</label>
                  <input value={newBufTag} onChange={e => setNewBufTag(e.target.value)} placeholder="e.g. BUF-102" className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Breed</label>
                  <input value={newBufBreed} onChange={e => setNewBufBreed(e.target.value)} placeholder="e.g. Murrah" className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Status</label>
                <select value={newBufStatus} onChange={e => setNewBufStatus(e.target.value)} className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white">
                  <option value="milking">Active Milking</option>
                  <option value="dry">Dry Period</option>
                  <option value="pregnant">Pregnant</option>
                  <option value="sick">Sick / Medical treatment</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Notes</label>
                <textarea value={newBufNotes} onChange={e => setNewBufNotes(e.target.value)} placeholder="Age, milk records, pedigree details..." className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white h-20 resize-none" />
              </div>
              <button type="submit" disabled={submittingAdd} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2">
                {submittingAdd ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  'Add Buffalo to Herd'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EDIT BUFFALO --- */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Buffalo Details</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition text-slate-500">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditBuffalo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Buffalo Name</label>
                <input required value={editBufName} onChange={e => setEditBufName(e.target.value)} placeholder="e.g. Ganga" className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Tag Number</label>
                  <input value={editBufTag} onChange={e => setEditBufTag(e.target.value)} placeholder="e.g. BUF-102" className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Breed</label>
                  <input value={editBufBreed} onChange={e => setEditBufBreed(e.target.value)} placeholder="e.g. Murrah" className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Status</label>
                <select value={editBufStatus} onChange={e => setEditBufStatus(e.target.value)} className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white">
                  <option value="milking">Active Milking</option>
                  <option value="dry">Dry Period</option>
                  <option value="pregnant">Pregnant</option>
                  <option value="sick">Sick / Medical treatment</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Notes</label>
                <textarea value={editBufNotes} onChange={e => setEditBufNotes(e.target.value)} placeholder="Additional info..." className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white h-20 resize-none" />
              </div>
              <button type="submit" disabled={submittingEdit} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2">
                {submittingEdit ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  'Update Buffalo'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: HEALTH LOG --- */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <HeartPulse className="text-rose-500" /> Log Health Record
              </h2>
              <button onClick={() => setShowHealthModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition text-slate-500">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleLogHealth} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Select Buffalo</label>
                <select required value={healthBufId} onChange={e => setHealthBufId(e.target.value)} className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white">
                  <option value="">-- Choose buffalo --</option>
                  {buffaloes.map(b => <option key={b.id} value={b.id}>{b.name} {b.tag_number ? `(${b.tag_number})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Checkup Type</label>
                <select value={healthType} onChange={e => setHealthType(e.target.value)} className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white">
                  <option value="vaccination">Vaccination</option>
                  <option value="illness">Illness / Treatment</option>
                  <option value="checkup">Regular Checkup</option>
                  <option value="deworming">Deworming</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Medical Description</label>
                <textarea required value={healthDesc} onChange={e => setHealthDesc(e.target.value)} placeholder="Describe medicine given, symptoms, etc." className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white h-24 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Vet Treatment Cost (₹)</label>
                <input type="number" value={healthCost} onChange={e => setHealthCost(e.target.value)} placeholder="e.g. 500" className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white" />
              </div>
              <button type="submit" disabled={submittingHealth} className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2">
                {submittingHealth ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Medical Entry'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- STATS OVERVIEW CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 dark:from-slate-800 dark:to-slate-800/80 p-6 rounded-3xl border border-emerald-500/20 dark:border-slate-700 flex items-center gap-5 shadow-sm hover:shadow-md transition duration-300">
          <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Tractor size={28} />
          </div>
          <div>
            <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Herd Registry</h3>
            <p className="text-3xl font-black text-slate-850 dark:text-white mt-1">{buffaloes.length} <span className="text-sm font-normal text-slate-400">Buffaloes</span></p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">{stats.activeMilkers} active milkers</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 dark:from-slate-800 dark:to-slate-800/80 p-6 rounded-3xl border border-blue-500/20 dark:border-slate-700 flex items-center gap-5 shadow-sm hover:shadow-md transition duration-300">
          <div className="w-14 h-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Droplet size={28} />
          </div>
          <div>
            <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Lifetime Yield</h3>
            <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.totalYield.toFixed(1)} <span className="text-sm font-normal text-slate-400">Liters</span></p>
            <p className="text-xs text-blue-500 font-semibold mt-1">From start of record</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500/10 to-red-500/5 dark:from-slate-800 dark:to-slate-800/80 p-6 rounded-3xl border border-rose-500/20 dark:border-slate-700 flex items-center justify-between gap-5 shadow-sm hover:shadow-md transition duration-300">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
              <HeartPulse size={28} />
            </div>
            <div>
              <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Medical Status</h3>
              <p className="text-xl font-bold text-slate-850 dark:text-white mt-1">Herd Health</p>
              <p className="text-xs text-rose-500 font-semibold mt-1">Logs & Treatments</p>
            </div>
          </div>
          <button onClick={() => setShowHealthModal(true)} className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-md">
            Log Checkup
          </button>
        </div>
      </div>

      {/* --- WEEKLY PERFORMANCE & BREED MIX --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Responsive CSS Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-emerald-500" />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Weekly Yield Trend</h3>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Past 7 Days</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Visual tracking of daily milk logs in liters (L).</p>
          </div>

          <div className="flex items-end justify-between gap-2 h-44 px-2">
            {weeklyTrend.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 group relative">
                {/* Tooltip on Hover */}
                <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition duration-200 z-10 whitespace-nowrap shadow-xl">
                  <p className="font-bold text-emerald-400">{day.total.toFixed(1)} L Total</p>
                  <p className="text-slate-350 text-[9px] mt-0.5">☀️ {day.morning.toFixed(1)}L | 🌙 {day.evening.toFixed(1)}L</p>
                </div>

                {/* Vertical Bar */}
                <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl h-36 flex items-end overflow-hidden">
                  <div 
                    style={{ height: `${day.percentage}%` }}
                    className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-b-xl group-hover:from-emerald-500 group-hover:to-emerald-300 transition-all duration-500 ease-out min-h-[4px]"
                  />
                </div>

                {/* Day Label */}
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breed Breakdown Panel */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base mb-2 flex items-center gap-2">
              <Award size={18} className="text-emerald-500" /> Breed Concentration
            </h3>
            <p className="text-xs text-slate-400 mb-6">Distribution breakdown of your registered herd.</p>
          </div>

          <div className="space-y-4">
            {breedMix.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm italic">Add buffaloes to analyze.</div>
            ) : breedMix.map((breed, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>{breed.name}</span>
                  <span>{breed.count} buf ({breed.percentage}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${breed.percentage}%` }}
                    className={`h-full rounded-full bg-gradient-to-r ${
                      idx === 0 ? 'from-emerald-500 to-teal-400' :
                      idx === 1 ? 'from-blue-500 to-indigo-400' :
                      'from-amber-500 to-orange-400'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-150 dark:border-slate-700 mt-4 text-[10px] text-slate-400 flex items-center justify-between font-semibold">
            <span>TOTAL BREEDS: {breedMix.length}</span>
            <span>HERD TOTAL: {buffaloes.length}</span>
          </div>
        </div>
      </div>

      {/* --- HERD DIRECTORY & MILK LOGGING FORM --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Herd Directory */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Buffalo Directory</h3>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/10">
              <Plus size={16} /> Register Buffalo
            </button>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {buffaloes.map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-150/40 dark:border-slate-700 hover:border-emerald-500/40 dark:hover:border-slate-600 transition group">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 dark:from-slate-700 dark:to-slate-700/50 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold text-lg">
                    {b.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-white text-sm">{b.name}</span>
                      <span className="text-[10px] font-black uppercase tracking-wide bg-slate-200/60 dark:bg-slate-850 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
                        {b.tag_number || 'No Tag'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                      <span className="font-medium">{b.breed || 'Murrah Breed'}</span>
                      <span>•</span>
                      {/* Status indicator badge */}
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.status === 'milking' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                        b.status === 'dry' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400' :
                        b.status === 'pregnant' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400' :
                        'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition">
                  <button onClick={() => handleOpenEdit(b)} className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" title="Edit Buffalo">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDeleteBuffalo(b.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" title="Delete Buffalo">
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
            {buffaloes.length === 0 && (
              <div className="text-center py-16 text-slate-450 italic text-sm">Your herd is empty. Register your first buffalo above!</div>
            )}
          </div>
        </div>

        {/* Daily Milk Log Form */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base mb-2 flex items-center gap-1.5">
              <Droplet className="text-emerald-500" /> Log Daily Milk
            </h3>
            <p className="text-xs text-slate-400 mb-6">Log daily morning and evening yield per buffalo.</p>
          </div>

          <form onSubmit={handleLogMilk} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Select Buffalo</label>
              <select 
                value={selectedBuf} 
                onChange={e => setSelectedBuf(e.target.value)}
                className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition text-slate-950 dark:text-white text-sm"
              >
                <option value="">-- Choose buffalo --</option>
                {buffaloes.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.tag_number || 'No Tag'})</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Morning (L)</label>
                <input type="number" step="0.1" value={morning} onChange={e => setMorning(e.target.value)} placeholder="e.g. 5.5" className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition text-slate-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Evening (L)</label>
                <input type="number" step="0.1" value={evening} onChange={e => setEvening(e.target.value)} placeholder="e.g. 4.0" className="w-full p-3.5 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition text-slate-900 dark:text-white text-sm" />
              </div>
            </div>

            <button type="submit" disabled={submittingMilk} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2">
              {submittingMilk ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Yield Log'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* --- AI CHAT ADVISOR WITH STREAMING --- */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-3xl shadow-xl border border-slate-700 text-white flex flex-col h-[500px]">
        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">CommilK AI Assistant</h2>
              <p className="text-[10px] text-emerald-400 font-medium">Equipped with your herd & yield data</p>
            </div>
          </div>
          <button onClick={handleNewChat}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition">
            New Conversation
          </button>
        </div>

        {/* Chat Bubbles */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
          {chatMessages.length === 0 && (
            <div className="text-center mt-16 flex flex-col items-center justify-center gap-3">
              <span className="text-3xl">🤖</span>
              <p className="text-white/40 text-sm font-semibold">How can I assist you with your herd today?</p>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mt-4">
                <button onClick={() => setChatInput("Tell me about my buffaloes' average yield.")} className="text-[11px] font-bold px-3 py-2 bg-white/5 hover:bg-white/10 hover:text-emerald-300 rounded-lg transition border border-white/10">Show herd summary</button>
                <button onClick={() => setChatInput("How can I increase the milk production of my buffaloes?")} className="text-[11px] font-bold px-3 py-2 bg-white/5 hover:bg-white/10 hover:text-emerald-300 rounded-lg transition border border-white/10">Tips to increase yield</button>
              </div>
            </div>
          )}

          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  🤖
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-sm shadow-md'
                  : 'bg-white/10 text-white/90 rounded-bl-sm'
              }`}>
                {msg.role === 'user' ? (
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                ) : msg.text ? (
                  <div className="relative">
                    <MarkdownMessage text={msg.text} />
                    {msg.streaming && (
                      <span className="inline-block w-1.5 h-4 bg-emerald-450 ml-1 animate-pulse rounded-sm align-middle" />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 py-1.5 px-0.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input box */}
        <form onSubmit={askAI} className="flex gap-2 shrink-0">
          <input 
            type="text" 
            value={chatInput} 
            onChange={e => setChatInput(e.target.value)}
            placeholder="Ask about vaccination schedule, low yields, or feeds..."
            disabled={loadingAI}
            className="flex-1 p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner text-sm disabled:opacity-60" 
          />
          <button disabled={loadingAI || !chatInput.trim()} type="submit" className="bg-emerald-650 hover:bg-emerald-600 disabled:bg-slate-700 disabled:opacity-50 text-white px-6 rounded-xl shadow-lg transition flex items-center justify-center">
            {loadingAI ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FarmerDashboard;
