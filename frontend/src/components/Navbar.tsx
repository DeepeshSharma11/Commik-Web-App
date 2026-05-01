import React from 'react';
import { LogOut, Sun, Moon, Bell, User } from 'lucide-react';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Navbar = () => {
  const { theme, toggleTheme, setToken, role } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(null, null);
    window.location.href = '/login';
  };

  const handleProfileClick = () => {
    // For now, we can just show a toast if the profile page doesn't exist yet,
    // or navigate to a profile route. Let's assume we'll have a /profile route.
    navigate('/profile');
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 h-16 sticky top-0 z-40 shadow-sm px-4 sm:px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <span className="text-2xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
          <span>🐃</span> CommilK
        </span>
        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ml-2">
          {role}
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition" aria-label="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition relative" aria-label="Notifications">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>
        <button onClick={handleProfileClick} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition" aria-label="My Profile">
          <User size={18} /> <span className="hidden sm:inline">My Profile</span>
        </button>
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1"></div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition" aria-label="Logout">
          <LogOut size={18} /> <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
