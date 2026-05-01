import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LogOut, Sun, Moon, Bell, User, CheckCheck, X } from 'lucide-react';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const TYPE_ICON: Record<string, string> = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

const Navbar = () => {
  const { theme, toggleTheme, setToken, role } = useAppStore();
  const navigate = useNavigate();

  // ── Notification state ──────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnread(res.data.count);
    } catch { /* silent */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data);
    } catch { /* silent */ }
    finally { setLoadingNotifs(false); }
  }, []);

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Open panel → fetch full list
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  const handleLogout = () => {
    setToken(null, null);
    window.location.href = '/login';
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 h-16 sticky top-0 z-40 shadow-sm px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Logo */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <span className="text-2xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
          <span>🐃</span> CommilK
        </span>
        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ml-2">
          {role}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
          aria-label="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notification bell + dropdown */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setOpen(v => !v)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition relative"
            aria-label="Notifications">
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
                <span className="font-bold text-sm flex items-center gap-2"><Bell size={14} className="text-blue-500" /> Notifications</span>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={markAllRead}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-bold">
                      <CheckCheck size={12} /> Mark all read
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-400">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                {loadingNotifs ? (
                  <div className="py-10 text-center text-slate-400 text-sm animate-pulse">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-sm">
                    <Bell size={32} className="mx-auto mb-2 opacity-30" />
                    No notifications yet
                  </div>
                ) : notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) markRead(n.id);
                      if (n.link) { navigate(n.link); setOpen(false); }
                    }}
                    className={`flex gap-3 px-4 py-3 cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-700/40 ${!n.is_read ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''}`}>
                    <span className="text-xl shrink-0 mt-0.5">{TYPE_ICON[n.type] || 'ℹ️'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold leading-tight ${!n.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <button onClick={() => navigate('/profile')}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
          aria-label="My Profile">
          <User size={18} /> <span className="hidden sm:inline">My Profile</span>
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />

        {/* Logout */}
        <button onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition"
          aria-label="Logout">
          <LogOut size={18} /> <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
