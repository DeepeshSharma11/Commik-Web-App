import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

  // ── Browser push permission ─────────────────────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const prevUnread = useRef(0);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      const count: number = res.data.count;

      // Show OS notification when count goes up
      if (
        count > prevUnread.current &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        const diff = count - prevUnread.current;
        new Notification('CommilK 🐃', {
          body: diff === 1 ? 'You have a new notification' : `You have ${diff} new notifications`,
          icon: '/favicon.ico',
          tag: 'commilk-notif',
        });
      }
      prevUnread.current = count;
      setUnread(count);
    } catch { /* silent */ }
  }, []);

  // Poll every 15 seconds
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15_000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data);
    } catch { /* silent */ }
    finally { setLoadingNotifs(false); }
  }, []);

  // Fetch list when drawer opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (e) { console.error('markRead failed', e); }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
      prevUnread.current = 0;
    } catch (e) { console.error('markAllRead failed', e); }
  };

  const handleLogout = () => {
    setToken(null, null);
    window.location.href = '/login';
  };

  // ── Drawer rendered via portal so it's NEVER clipped by header ──
  const drawer = open ? createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
        style={{ zIndex: 9998 }}
        onClick={() => setOpen(false)}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
        style={{ zIndex: 9999 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <span className="font-bold text-base flex items-center gap-2">
            <Bell size={16} className="text-blue-500" /> Notifications
            {unread > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{unread}</span>
            )}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-3 py-1.5 rounded-lg transition"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500 dark:text-slate-400"
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {loadingNotifs ? (
            <div className="py-20 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-sm gap-3">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <Bell size={24} className="opacity-30" />
              </div>
              No notifications yet
            </div>
          ) : notifications.map(n => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.is_read) markRead(n.id);
                if (n.link) { navigate(n.link); setOpen(false); }
              }}
              className={`flex gap-4 px-5 py-4 cursor-pointer transition ${
                !n.is_read
                  ? 'bg-blue-50/60 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <span className="text-2xl shrink-0 mt-0.5">{TYPE_ICON[n.type] || 'ℹ️'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold leading-tight mb-1 ${!n.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  {n.title}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
                <p className="text-[11px] text-slate-400 mt-1.5 uppercase tracking-wider font-medium">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {!n.is_read && (
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 h-16 sticky top-0 z-40 shadow-sm px-4 sm:px-6 flex items-center justify-between transition-colors">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/user/shop')}>
          <span className="text-2xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <span>🐃</span> CommilK
          </span>
          <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ml-2">
            {role}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme */}
          <button onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
            aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Bell */}
          <button
            onClick={() => setOpen(true)}
            className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
            aria-label="Notifications">
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          {/* Profile */}
          <button onClick={() => navigate('/user/profile')}
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

      {/* Drawer rendered outside header via portal */}
      {drawer}
    </>
  );
};

export default Navbar;
