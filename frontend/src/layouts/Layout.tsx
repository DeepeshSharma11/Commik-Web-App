import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAiChat = location.pathname.includes('/ai-chat');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors flex flex-col">
      <Navbar />
      
      <main className={`flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 ${isAiChat ? 'pb-24 lg:pb-6' : ''}`}>
        {children}
      </main>

      {!isAiChat && <Footer />}
    </div>
  );
};

export default Layout;
