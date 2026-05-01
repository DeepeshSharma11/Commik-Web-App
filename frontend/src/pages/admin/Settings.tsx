import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Smartphone } from 'lucide-react';
import { api } from '../../api';
import { toast } from 'react-hot-toast';
import { FormSkeleton } from '../../components/Skeleton';

const Settings = () => {
  const [payConfig, setPayConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/payment-settings');
        setPayConfig(res.data || {});
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) return <FormSkeleton rows={4} />;

  return (
    <div className="max-w-2xl bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-5 animate-in fade-in duration-300">
      <h3 className="text-xl font-bold flex items-center gap-2"><SettingsIcon className="text-blue-500" size={20} /> UPI Payment Settings</h3>
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
              <button onClick={()=>setPayConfig((p:any)=>({...p,qr_code_url:''}))} className="text-xs text-rose-500 hover:underline">Remove</button>
            </div>
          </div>
        )}
      </div>
      <button disabled={savingSettings} onClick={async () => {
        setSavingSettings(true);
        try { await api.put('/admin/payment-settings', payConfig); toast.success('Payment settings saved!'); }
        catch (err: any) { toast.error(err?.response?.data?.detail || 'Failed to save'); }
        finally { setSavingSettings(false); }
      }} className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg transition">
        {savingSettings ? 'Saving...' : 'Save Payment Settings'}
      </button>
    </div>
  );
};

export default Settings;
