import React from 'react';
import { LogOut, Sun, Moon, Bell } from 'lucide-react';
import { useAppStore } from '../store';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme, setToken, role } = useAppStore();

  const handleLogout = () => {
    setToken(null, null);
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors flex flex-col">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 h-16 sticky top-0 z-40 shadow-sm px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">🐃 CommilK</span>
          <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ml-2">
            {role}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition">
            <Bell size={20} />
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition">
            <LogOut size={18} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
