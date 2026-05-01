import React, { useEffect, useState } from 'react';
import { User, Mail, MapPin, Phone, ShieldCheck, Calendar, Camera } from 'lucide-react';
import { ProfileSkeleton } from '../../components/Skeleton';
import { toast } from 'react-hot-toast';
import { api } from '../../api';

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then(r => setProfile(r.data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ProfileSkeleton />;

  if (!profile) return <div className="text-center py-20 text-slate-400">Could not load profile.</div>;

  const initial = profile.full_name?.[0]?.toUpperCase() || '?';

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <h2 className="text-2xl font-black mb-2">My Profile</h2>

      {/* Hero Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {/* Gradient Banner */}
        <div className="h-28 sm:h-32 bg-gradient-to-r from-emerald-500 to-teal-600 relative">
          <div className="absolute -bottom-10 left-5 sm:left-8">
            <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg text-3xl font-black text-emerald-600 overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
          </div>
        </div>

        <div className="pt-14 px-5 sm:px-8 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {profile.full_name}
              </h1>
              <p className="text-slate-500 flex items-center gap-2 mt-1">
                <ShieldCheck size={16} className={
                  profile.role === 'malik' ? 'text-rose-500' :
                  profile.role === 'distributor' ? 'text-amber-500' : 'text-emerald-500'
                } />
                <span className="uppercase text-xs font-bold tracking-wider">{profile.role} Account</span>
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Email */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-500 shrink-0">
                <Mail size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                <p className="font-semibold text-sm truncate">{profile.email}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-500 shrink-0">
                <Phone size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                <p className="font-semibold text-sm">{profile.phone || <span className="text-slate-400 italic">Not provided</span>}</p>
              </div>
            </div>

            {/* Village */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-500 shrink-0">
                <MapPin size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Village</p>
                <p className="font-semibold text-sm">{profile.village || <span className="text-slate-400 italic">Not provided</span>}</p>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-500 shrink-0">
                <Calendar size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member Since</p>
                <p className="font-semibold text-sm">{profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
