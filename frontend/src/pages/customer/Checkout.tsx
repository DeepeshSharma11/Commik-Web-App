import React, { useState, useEffect, lazy, Suspense } from 'react';
import { CreditCard, CheckCircle2, ChevronRight, Smartphone, Copy, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api } from '../../api';
import { useCart } from '../../context';

// Lazy-load Leaflet to avoid SSR issues
const LocationPicker = lazy(() => import('../../components/LocationPicker'));

const Checkout = () => {
  const { items, clearCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const navigate = useNavigate();

  const [step, setStep] = useState<'address' | 'upi' | 'success'>('address');
  const [address, setAddress] = useState('');
  const [timeSlot, setTimeSlot] = useState('Morning (6:00 AM - 8:00 AM)');
  const [placing, setPlacing] = useState(false);
  const [useMapPicker, setUseMapPicker] = useState(false);

  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [utr, setUtr] = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);

  useEffect(() => {
    if (Object.keys(items).length === 0 && step === 'address') {
      navigate('/user/cart');
    }
  }, [items, navigate, step]);

  useEffect(() => {
    api.get('/products/').then(r => setProducts(r.data)).catch(() => {});
    api.get('/payments/settings').then(r => setPaymentSettings(r.data)).catch(() => {});
  }, []);

  const getCartTotal = () =>
    Object.entries(items).reduce((sum, [id, qty]) => {
      const p = products.find(pr => pr.id === id);
      return sum + (p ? p.price * qty : 0);
    }, 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return toast.error('Please provide a delivery address.');

    const orderItems = Object.entries(items).map(([id, qty]) => {
      const p = products.find(pr => pr.id === id)!;
      return { product_id: id, product_name: p.name, quantity: qty, price: p.price };
    });

    setPlacing(true);
    let lastErr: any;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await api.post('/orders/', {
          delivery_address: address,
          time_slot: timeSlot,
          total_amount: getCartTotal(),
          items: orderItems,
        });
        toast.success('Order created! Please complete UPI payment.');
        setPendingOrderId(res.data.order_id);
        clearCart();
        setStep('upi');
        setPlacing(false);
        return;
      } catch (err: any) {
        lastErr = err;
        if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
      }
    }
    toast.error(lastErr?.response?.data?.detail || 'Failed to place order. Check your internet.');
    setPlacing(false);
  };

  const handleSubmitUtr = async () => {
    if (!utr.trim() || utr.trim().length < 6) return toast.error('Enter a valid UTR/Transaction ID');
    if (!pendingOrderId) return;
    setSubmittingUtr(true);
    try {
      await api.post('/payments/submit-utr', { order_id: pendingOrderId, utr: utr.trim() });
      toast.success('Payment reference submitted!');
      setStep('success');
      setPendingOrderId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to submit payment reference');
    } finally {
      setSubmittingUtr(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-6 text-emerald-500">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-black mb-2 text-center">Payment Submitted!</h2>
        <p className="text-slate-500 text-center max-w-md mb-8">
          Thank you! We have received your payment reference. The admin will verify it shortly. You will be notified once verified.
        </p>
        <button onClick={() => navigate('/user/orders')} className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition">
          View My Orders
        </button>
      </div>
    );
  }

  if (step === 'upi') {
    return (
      <div className="min-h-[600px] flex items-center justify-center animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100 dark:border-slate-700 space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="text-emerald-600" size={28} />
            </div>
            <h2 className="text-2xl font-bold">Complete Your Payment</h2>
            <p className="text-slate-500 text-sm mt-1">Pay using UPI, then enter your transaction ID below.</p>
          </div>

          {paymentSettings ? (
            <div className="space-y-4">
              {paymentSettings.qr_code_url && (
                <div className="flex justify-center">
                  <img src={paymentSettings.qr_code_url} alt="UPI QR Code" loading="lazy" className="w-48 h-48 border-4 border-emerald-500 rounded-2xl object-contain bg-white p-2 shadow-lg" onError={e => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border dark:border-slate-700">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">UPI ID</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-emerald-600 text-lg">{paymentSettings.upi_id}</p>
                  <button onClick={() => { navigator.clipboard.writeText(paymentSettings.upi_id); toast.success('UPI ID copied!'); }} className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg hover:bg-emerald-200 transition text-emerald-600"><Copy size={16} /></button>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border dark:border-slate-700">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Phone Number</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-slate-900 dark:text-white text-lg">{paymentSettings.mobile_number}</p>
                  <button onClick={() => { navigator.clipboard.writeText(paymentSettings.mobile_number); toast.success('Number copied!'); }} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 transition"><Copy size={16} /></button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-xl">Loading payment details...</div>
          )}

          <div className="pt-6 border-t dark:border-slate-700">
            <label className="block text-sm font-bold mb-2">Enter UTR / Transaction ID</label>
            <input type="text" placeholder="e.g. 31234567890" value={utr} onChange={e => setUtr(e.target.value)} className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition font-mono" />
            <button disabled={submittingUtr || !utr.trim()} onClick={handleSubmitUtr} className="w-full mt-4 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition">
              {submittingUtr ? 'Submitting...' : 'Submit Payment Reference'}
            </button>
            <button onClick={() => { toast.success('Order saved. You can submit UTR later from My Orders.'); navigate('/user/orders'); }} className="w-full mt-3 py-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-bold transition">
              I'll submit UTR later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step: address
  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
      <h2 className="text-2xl font-black mb-6">Delivery Details</h2>
      <form onSubmit={handlePlaceOrder} className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">

        {/* Address input toggle */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <MapPin size={16} className="text-emerald-500" /> Delivery Address
            </label>
            <button
              type="button"
              onClick={() => setUseMapPicker(p => !p)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${useMapPicker
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-emerald-400'}`}
            >
              {useMapPicker ? '✓ Map Active' : '📍 Pick on Map'}
            </button>
          </div>

          {useMapPicker ? (
            <Suspense fallback={<div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 text-sm">Loading map...</div>}>
              <LocationPicker
                onLocationSelect={(addr) => {
                  setAddress(addr);
                  toast.success('Location selected!', { icon: '📍' });
                }}
              />
            </Suspense>
          ) : null}

          {/* Always show editable textarea */}
          <textarea
            required
            placeholder="Enter your full address (House No, Street, Landmark)..."
            value={address}
            onChange={e => setAddress(e.target.value)}
            rows={3}
            className="w-full mt-3 p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
          />
          {useMapPicker && address && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <MapPin size={11} /> You can edit the address above if needed
            </p>
          )}
        </div>

        {/* Time Slot */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            <Clock size={16} className="text-emerald-500" /> Preferred Delivery Time
          </label>
          <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer appearance-none">
            <option>Morning (6:00 AM - 8:00 AM)</option>
            <option>Evening (5:00 PM - 7:00 PM)</option>
          </select>
        </div>

        {/* Total + Submit */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">Amount to Pay</p>
            <p className="text-3xl font-black">₹{getCartTotal()}</p>
          </div>
          <button type="submit" disabled={placing || !products.length} className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2">
            {placing ? 'Placing Order...' : 'Confirm & Pay'} <ChevronRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
