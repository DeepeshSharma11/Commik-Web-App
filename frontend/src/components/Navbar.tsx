import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Sun, Moon, Bell, User, CheckCheck, X, Menu, BarChart3, Users as UsersIcon, ShoppingBag, Smartphone, Settings, UserPlus, PlusCircle, History, ShoppingCart, CreditCard, Truck, Headphones, AlertTriangle, Sparkles } from 'lucide-react';
import { useAuth, useTheme } from '../context';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { api } from '../api';

const TYPE_ICON: Record<string, string> = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

// Role-specific nav items
const NAV_ITEMS: Record<string, { to: string; icon: any; label: string }[]> = {
  malik: [
    { to: '/admin/overview', icon: BarChart3, label: 'Overview' },
    { to: '/admin/users', icon: UsersIcon, label: 'Users' },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
    { to: '/admin/payments', icon: Smartphone, label: 'Payments' },
    { to: '/admin/create-distributor', icon: UserPlus, label: 'Add Distributor' },
    { to: '/admin/settings', icon: Settings, label: 'Pay Settings' },
    { to: '/user/ai-chat', icon: Sparkles, label: 'AI Chat' },
  ],
  distributor: [
    { to: '/distributor/log', icon: PlusCircle, label: 'Log Collection' },
    { to: '/distributor/history', icon: History, label: 'History' },
    { to: '/user/ai-chat', icon: Sparkles, label: 'AI Chat' },
  ],
  user: [
    { to: '/user/shop', icon: ShoppingBag, label: 'Shop' },
    { to: '/user/cart', icon: ShoppingCart, label: 'Cart' },
    { to: '/user/checkout', icon: CreditCard, label: 'Checkout' },
    { to: '/user/orders', icon: History, label: 'Orders' },
    { to: '/user/bulk', icon: Truck, label: 'Bulk' },
    { to: '/user/support', icon: Headphones, label: 'Support' },
    { to: '/user/payment-issues', icon: AlertTriangle, label: 'Issues' },
    { to: '/user/ai-chat', icon: Sparkles, label: 'AI Chat' },
    { to: '/user/profile', icon: User, label: 'Profile' },
  ],
};

const Navbar = () => {
  const { role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const navItems = NAV_ITEMS[role || 'user'] || NAV_ITEMS.user;

  // ── Notification state ──────────────────────────────────────
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

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
      if (count > prevUnread.current && 'Notification' in window && Notification.permission === 'granted') {
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

  useEffect(() => {
    if (notifOpen) fetchNotifications();
  }, [notifOpen, fetchNotifications]);

  useEffect(() => {
    document.body.style.overflow = notifOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [notifOpen]);

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

  // ── Notification Drawer ──
  const notifDrawer = notifOpen ? createPortal(
    <>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" style={{ zIndex: 9998 }} onClick={() => setNotifOpen(false)} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800" style={{ zIndex: 9999 }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <span className="font-bold text-base flex items-center gap-2">
            <Bell size={16} className="text-emerald-500" /> Notifications
            {unread > 0 && <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{unread}</span>}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-3 py-1.5 rounded-lg transition">
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
            <button onClick={() => setNotifOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500 dark:text-slate-400" aria-label="Close notifications">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {loadingNotifs ? (
            <div className="py-20 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-sm gap-3">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center"><Bell size={24} className="opacity-30" /></div>
              No notifications yet
            </div>
          ) : notifications.map(n => (
            <div key={n.id} onClick={() => { if (!n.is_read) markRead(n.id); if (n.link) { navigate(n.link); setNotifOpen(false); } }}
              className={`flex gap-4 px-5 py-4 cursor-pointer transition ${!n.is_read ? 'bg-emerald-50/60 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
              <span className="text-2xl shrink-0 mt-0.5">{TYPE_ICON[n.type] || 'ℹ️'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold leading-tight mb-1 ${!n.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{n.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
                <p className="text-[11px] text-slate-400 mt-1.5 uppercase tracking-wider font-medium">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0 mt-2" />}
            </div>
          ))}
        </div>
      </div>
    </>, document.body
  ) : null;

  // ── Mobile Menu Drawer ──
  const mobileDrawer = mobileMenuOpen ? createPortal(
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" style={{ zIndex: 9996 }} onClick={() => setMobileMenuOpen(false)} />
      <div className="fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800" style={{ zIndex: 9997 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <img src="/commilk_logo.png" alt="CommilK Logo" className="h-8 object-contain" />
          </span>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Role badge */}
        {role !== 'user' && (
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="inline-block bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs uppercase font-black px-3 py-1 rounded-full tracking-wider">
              {role === 'malik' ? 'Admin' : 'Distributor'}
            </span>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-5 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-r-4 border-emerald-500'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}>
              <item.icon size={18} /> {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-2">
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={() => { setMobileMenuOpen(false); logout(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </>, document.body
  ) : null;

  return (
    <>
      <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 h-16 sticky top-0 z-40 shadow-sm px-4 sm:px-6 flex items-center justify-between transition-colors">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition lg:hidden" aria-label="Menu">
            <Menu size={22} />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(role === 'malik' ? '/admin' : role === 'distributor' ? '/distributor' : '/user/shop')}>
            <span className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <img src="/commilk_logo.png" alt="CommilK Logo" className="h-8 sm:h-10 object-contain" />
            </span>
            {role !== 'user' && (
              <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                {role === 'malik' ? 'Admin' : 'Distributor'}
              </span>
            )}
          </div>
        </div>

        {/* Center: Desktop nav links */}
        <nav className="hidden lg:flex items-center gap-1 max-w-3xl overflow-x-auto slider-hide-scroll" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`.slider-hide-scroll::-webkit-scrollbar { display: none; }`}</style>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}>
              <item.icon size={14} /> {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme - desktop only */}
          <button onClick={toggleTheme}
            className="hidden sm:flex p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
            aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Bell */}
          <button onClick={() => setNotifOpen(true)}
            className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
            aria-label="Notifications">
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          {/* Logout - desktop only */}
          <button onClick={logout}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition"
            aria-label="Logout">
            <LogOut size={18} /> <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>

      {notifDrawer}
      {mobileDrawer}
    </>
  );
};

export default Navbar;
