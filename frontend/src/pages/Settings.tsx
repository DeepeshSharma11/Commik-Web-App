import React, { useEffect, useState } from 'react';
import { User, ShieldCheck, Tractor, Truck, Smartphone, Settings as SettingsIcon, Eye, EyeOff } from 'lucide-react';
import { api } from '../api';
import { toast, Toaster } from 'react-hot-toast';
import { useAuth } from '../context';

type TabType = 'account' | 'security' | 'preferences' | 'payment';

const SettingsPanel = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [profile, setProfile] = useState<any>({
    full_name: '',
    phone: '',
    village: '',
    district: '',
    avatar_url: '',
    farm_name: '',
    daily_yield_target: 0,
    preferred_delivery_address: '',
    preferred_time_slot: ''
  });
  
  // Password state
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  // Payment settings state (for admin)
  const [payConfig, setPayConfig] = useState<any>({
    upi_id: '',
    mobile_number: '',
    business_name: '',
    instructions: '',
    qr_code_url: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [savingPay, setSavingPay] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await api.get('/auth/me');
        setProfile(profileRes.data || {});
        
        if (role === 'admin') {
          const payRes = await api.get('/admin/payment-settings');
          setPayConfig(payRes.data || {});
        }
      } catch (err) {
        toast.error('Failed to load settings data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [role]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', {
        full_name: profile.full_name,
        phone: profile.phone,
        village: profile.village,
        district: profile.district,
        avatar_url: profile.avatar_url,
        farm_name: profile.farm_name,
        daily_yield_target: Number(profile.daily_yield_target || 0),
        preferred_delivery_address: profile.preferred_delivery_address,
        preferred_time_slot: profile.preferred_time_slot
      });
      toast.success('Profile settings updated successfully!');
      setProfile(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return toast.error('New passwords do not match');
    }
    if (passwordForm.new_password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setChangingPass(true);
    try {
      await api.post('/auth/change-password', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      });
      toast.success('Password updated successfully!');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPay(true);
    try {
      await api.put('/admin/payment-settings', payConfig);
      toast.success('Payment configurations saved!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save payment settings');
    } finally {
      setSavingPay(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-blue-600 animate-spin text-4xl font-bold">🐃</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <Toaster />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
          <SettingsIcon size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Settings</h2>
          <p className="text-sm text-slate-500">Configure your account details, preferences, and security settings.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Left Tabs */}
        <div className="md:col-span-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          <button onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap ${
              activeTab === 'account'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}>
            <User size={16} /> Account Details
          </button>
          
          <button onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}>
            <ShieldCheck size={16} /> Security
          </button>

          {role === 'seller' && (
            <button onClick={() => setActiveTab('preferences')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap ${
                activeTab === 'preferences'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}>
              <Tractor size={16} /> Farm Settings
            </button>
          )}

          {role === 'customer' && (
            <button onClick={() => setActiveTab('preferences')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap ${
                activeTab === 'preferences'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}>
              <Truck size={16} /> Preferences
            </button>
          )}

          {role === 'admin' && (
            <button onClick={() => setActiveTab('payment')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap ${
                activeTab === 'payment'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}>
              <Smartphone size={16} /> Payments Config
            </button>
          )}
        </div>

        {/* Right Content Panel */}
        <div className="md:col-span-3 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          {/* 1. Account Settings */}
          {activeTab === 'account' && (
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b dark:border-slate-700 pb-3">Edit Profile</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                  <input required type="text" value={profile.full_name || ''} 
                    onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                  <input required type="tel" value={profile.phone || ''} 
                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Village</label>
                  <input type="text" value={profile.village || ''} 
                    onChange={e => setProfile({ ...profile, village: e.target.value })}
                    className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">District</label>
                  <input type="text" value={profile.district || ''} 
                    onChange={e => setProfile({ ...profile, district: e.target.value })}
                    className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Avatar Image Link</label>
                <input type="text" value={profile.avatar_url || ''} 
                  onChange={e => setProfile({ ...profile, avatar_url: e.target.value })}
                  placeholder="https://example.com/avatar.png"
                  className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg transition">
                {saving ? 'Updating...' : 'Save Profile Details'}
              </button>
            </form>
          )}

          {/* 2. Security Settings */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b dark:border-slate-700 pb-3">Update Password</h3>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Old Password</label>
                <div className="relative">
                  <input required type={showOldPass ? "text" : "password"} value={passwordForm.old_password}
                    onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full p-4 pr-12 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    {showOldPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                  <div className="relative">
                    <input required type={showNewPass ? "text" : "password"} value={passwordForm.new_password}
                      onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full p-4 pr-12 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      {showNewPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input required type={showConfirmPass ? "text" : "password"} value={passwordForm.confirm_password}
                      onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full p-4 pr-12 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      {showConfirmPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={changingPass}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg transition">
                {changingPass ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          )}

          {/* 3. Farm Settings (Sellers only) */}
          {activeTab === 'preferences' && role === 'seller' && (
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b dark:border-slate-700 pb-3">Dairy Farm Profile</h3>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Farm / Dairy Shop Name</label>
                <input type="text" value={profile.farm_name || ''} 
                  onChange={e => setProfile({ ...profile, farm_name: e.target.value })}
                  placeholder="e.g. Sharma Buffalo Farm"
                  className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Daily Yield Target (Liters)</label>
                <input type="number" value={profile.daily_yield_target || 0} 
                  onChange={e => setProfile({ ...profile, daily_yield_target: Number(e.target.value) })}
                  className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg transition">
                {saving ? 'Saving...' : 'Save Farm Configuration'}
              </button>
            </form>
          )}

          {/* 4. Customer Preferences (Customers only) */}
          {activeTab === 'preferences' && role === 'customer' && (
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b dark:border-slate-700 pb-3">Shopping Preferences</h3>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Default Delivery Address</label>
                <input type="text" value={profile.preferred_delivery_address || ''} 
                  onChange={e => setProfile({ ...profile, preferred_delivery_address: e.target.value })}
                  placeholder="Street details, building, sector, landmark"
                  className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Preferred Delivery Time Slot</label>
                <select value={profile.preferred_time_slot || ''}
                  onChange={e => setProfile({ ...profile, preferred_time_slot: e.target.value })}
                  className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition font-medium">
                  <option value="">Select Time Slot</option>
                  <option value="morning_6_8">Morning (6:00 AM - 8:00 AM)</option>
                  <option value="morning_8_10">Morning (8:00 AM - 10:00 AM)</option>
                  <option value="evening_5_7">Evening (5:00 PM - 7:00 PM)</option>
                  <option value="evening_7_9">Evening (7:00 PM - 9:00 PM)</option>
                </select>
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg transition">
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          )}

          {/* 5. Payments Config (Admin only) */}
          {activeTab === 'payment' && role === 'admin' && (
            <form onSubmit={handleSavePaymentSettings} className="space-y-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b dark:border-slate-700 pb-3">UPI Payment Settings</h3>
              
              {([['upi_id','UPI ID','yourname@upi'],['mobile_number','Mobile Number','9999999999'],['business_name','Business Name','CommilK Dairy'],['instructions','Customer Instructions','Scan QR or use UPI ID to pay...']] as [string,string,string][]).map(([key, label, ph]) => (
                <div key={key}>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{label}</label>
                  <input type="text" value={payConfig[key] || ''} onChange={e => setPayConfig((prev: any) => ({ ...prev, [key]: e.target.value }))} placeholder={ph}
                    className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition" />
                </div>
              ))}

              {/* QR Code Upload */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">UPI QR Code Image</label>
                <label className={`flex items-center gap-3 cursor-pointer border-2 border-dashed rounded-xl p-5 transition ${
                  uploadingQr ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }`}>
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingQr(true);
                      try {
                        const form = new FormData();
                        form.append('file', file);
                        const res = await api.post('/payments/upload-qr', form, { headers: { 'Content-Type': 'multipart/form-data' } });
                        setPayConfig((prev: any) => ({ ...prev, qr_code_url: res.data.url }));
                        toast.success('QR code uploaded!');
                      } catch (err: any) {
                        toast.error(err?.response?.data?.detail || 'Upload failed');
                      } finally {
                        setUploadingQr(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                    {uploadingQr ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/> : <Smartphone size={20}/>}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{uploadingQr ? 'Uploading...' : 'Click to upload QR code'}</p>
                    <p className="text-xs text-slate-400">PNG, JPEG or WebP · Max 2 MB</p>
                  </div>
                </label>
                {payConfig.qr_code_url && (
                  <div className="mt-3 flex items-center gap-4">
                    <img src={payConfig.qr_code_url} alt="QR" className="w-28 h-28 object-contain border rounded-xl p-1 bg-white" onError={e=>(e.currentTarget.style.display='none')}/>
                    <div>
                      <p className="text-xs font-bold text-emerald-600 mb-1">✓ QR code uploaded</p>
                      <button type="button" onClick={()=>setPayConfig((p:any)=>({...p,qr_code_url:''}))} className="text-xs text-rose-500 hover:underline">Remove</button>
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={savingPay} className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg transition">
                {savingPay ? 'Saving...' : 'Save Payment Config'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
