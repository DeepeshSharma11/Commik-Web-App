import React, { useEffect, useState } from 'react';
import { User, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store';
import { toast, Toaster } from 'react-hot-toast';
import { api } from '../api';

const Profile = () => {
  const { role } = useAppStore();
  
  // Since we don't have a GET /auth/me route yet, we'll just show basic role info
  // and placeholder data, or you can implement a fetch profile route later.

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <Toaster />
      
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg text-4xl text-blue-600 font-bold">
              <User size={40} />
            </div>
          </div>
        </div>
        
        <div className="pt-16 p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
              <p className="text-slate-500 flex items-center gap-2 mt-1">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span className="uppercase text-xs font-bold tracking-wider">{role} Account</span>
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-slate-600 transition">
              Edit Profile
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">Contact Info</h3>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400"><Mail size={18} /></div>
                <div>
                  <p className="text-xs text-slate-400">Email Address</p>
                  <p className="font-medium">farmer@example.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400"><Phone size={18} /></div>
                <div>
                  <p className="text-xs text-slate-400">Phone Number</p>
                  <p className="font-medium">+91 9876543210</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">Location</h3>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400"><MapPin size={18} /></div>
                <div>
                  <p className="text-xs text-slate-400">Village</p>
                  <p className="font-medium">Kumbhraj</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 text-center">
         <p className="text-slate-500">More profile settings and customization coming soon.</p>
      </div>

    </div>
  );
};

export default Profile;
