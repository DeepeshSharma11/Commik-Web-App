import React from 'react';
import { Headphones, MessageSquare, Mail, PhoneCall } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Support = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <Headphones className="absolute -bottom-10 -right-10 text-white opacity-10" size={200} />
        <h2 className="text-3xl font-black mb-2 relative z-10">How can we help?</h2>
        <p className="text-blue-100 relative z-10">Our support team is here to assist you with any questions or concerns.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-blue-300 transition cursor-pointer" onClick={() => toast.success('Calling support...')}>
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <PhoneCall size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Call Us</h3>
          <p className="text-slate-500 mb-4">Talk directly to our farm representatives. Available 8AM to 8PM.</p>
          <p className="font-black text-lg">+91 99999 99999</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-blue-300 transition cursor-pointer" onClick={() => toast.success('Opening email client...')}>
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <Mail size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Email Us</h3>
          <p className="text-slate-500 mb-4">Send us your queries and we will get back to you within 24 hours.</p>
          <p className="font-black text-lg">support@commilk.com</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-6">
          <MessageSquare className="text-blue-500" size={24} />
          <h3 className="text-xl font-bold">Send a Message</h3>
        </div>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); toast.success('Message sent! We will contact you soon.'); }}>
          <div className="grid sm:grid-cols-2 gap-4">
            <input type="text" placeholder="Your Name" required className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
            <input type="email" placeholder="Your Email" required className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
          <textarea placeholder="Describe your issue..." required rows={4} className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"></textarea>
          <button type="submit" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition">Send Message</button>
        </form>
      </div>
    </div>
  );
};

export default Support;
