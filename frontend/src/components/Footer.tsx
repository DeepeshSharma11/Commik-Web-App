import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 pt-6 pb-24 lg:py-6 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-slate-500 dark:text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} CommilK. All rights reserved.
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Terms of Service</Link>
          <Link to="/user/support" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Support</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
