import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Plus, Minus, CreditCard, CheckCircle2, ChevronRight, Package, Droplet, Star, MapPin, ClockIcon, X, History, AlertCircle } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { api } from '../api';

const PRODUCTS = [
  {
    id: 'p1', name: 'Fresh Buffalo Milk',
    description: '100% pure, unadulterated raw buffalo milk directly from our farm. Rich in A2 protein and fat.',
    price: 65, unit: 'L',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800',
    tag: 'Bestseller'
  },
  {
    id: 'p2', name: 'Pure Desi Ghee',
    description: 'Traditional bilona churned ghee made from A2 buffalo milk. Perfect aroma and granular texture.',
    price: 850, unit: 'kg',
    image: 'https://images.unsplash.com/photo-1605296830501-c889781ce7db?auto=format&fit=crop&q=80&w=800',
    tag: 'Premium'
  },
  {
    id: 'p3', name: 'Fresh Farm Paneer',
    description: 'Soft, creamy, and freshly prepared paneer. No preservatives or artificial softeners added.',
    price: 320, unit: 'kg',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?auto=format&fit=crop&q=80&w=800'
  },
];

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

const UserDashboard = () => {
  const [tab, setTab] = useState<'shop' | 'orders'>('shop');
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [checkoutStep, setCheckoutStep] = useState<'shop' | 'checkout' | 'success'>('shop');
  const [address, setAddress] = useState('');
  const [timeSlot, setTimeSlot] = useState('Morning (6:00 AM - 8:00 AM)');
  const [placing, setPlacing] = useState(false);

  // Order history
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const newQty = (prev[id] || 0) + delta;
      if (newQty <= 0) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: newQty };
    });
  };

  const getCartTotal = () =>
    Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = PRODUCTS.find(p => p.id === id);
      return sum + (p ? p.price * qty : 0);
    }, 0);

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/orders/');
      setOrders(res.data);
    } catch {
      toast.error('Failed to load order history');
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'orders') fetchOrders();
  }, [tab, fetchOrders]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(cart).length === 0) return toast.error('Your cart is empty!');
    if (!address.trim()) return toast.error('Please provide a delivery address.');

    const items = Object.entries(cart).map(([id, qty]) => {
      const p = PRODUCTS.find(pr => pr.id === id)!;
      return { product_id: id, product_name: p.name, quantity: qty, price: p.price };
    });

    setPlacing(true);
    try {
      await api.post('/orders/', {
        delivery_address: address,
        time_slot: timeSlot,
        total_amount: getCartTotal(),
        items,
      });
      toast.success('Order placed!');
      setCheckoutStep('success');
      setCart({});
      setAddress('');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!window.confirm('Cancel this order?')) return;
    setCancellingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Cannot cancel this order');
    } finally {
      setCancellingId(null);
    }
  };

  // ── SUCCESS SCREEN ──────────────────────────────────────────
  if (checkoutStep === 'success') return (
    <div className="min-h-[600px] flex items-center justify-center animate-in zoom-in duration-500">
      <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-xl text-center max-w-md w-full border border-slate-100 dark:border-slate-700">
        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={52} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Order Confirmed!</h2>
        <p className="text-slate-500 mb-8">Your fresh dairy products will be delivered by tomorrow morning. Track your order in "My Orders".</p>
        <div className="flex gap-3">
          <button onClick={() => { setCheckoutStep('shop'); setTab('shop'); }}
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition">
            Shop More
          </button>
          <button onClick={() => { setCheckoutStep('shop'); setTab('orders'); }}
            className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-white font-bold rounded-xl transition">
            My Orders
          </button>
        </div>
      </div>
    </div>
  );

  // ── CHECKOUT SCREEN ─────────────────────────────────────────
  if (checkoutStep === 'checkout') return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
      <Toaster />
      <button onClick={() => setCheckoutStep('shop')}
        className="text-blue-600 text-sm font-medium hover:underline mb-6 flex items-center gap-1">
        ← Back to Shopping
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Delivery form */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><MapPin className="text-blue-500" /> Delivery Details</h2>
          <form onSubmit={handlePlaceOrder} id="checkout-form" className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Complete Address</label>
              <textarea required value={address} onChange={e => setAddress(e.target.value)}
                placeholder="House No, Street, Village/City, Landmark..."
                className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none transition" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <ClockIcon size={14} /> Delivery Time Slot
              </label>
              <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)}
                className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option>Morning (6:00 AM - 8:00 AM)</option>
                <option>Evening (5:00 PM - 7:00 PM)</option>
              </select>
            </div>
          </form>
        </div>

        {/* Payment panel */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><CreditCard className="text-blue-400" /> Payment Summary</h2>
          <div className="space-y-3 mb-8 max-h-[200px] overflow-y-auto pr-1">
            {Object.entries(cart).map(([id, qty]) => {
              const p = PRODUCTS.find(pr => pr.id === id)!;
              return (
                <div key={id} className="flex justify-between">
                  <span className="text-slate-300">{p.name} <span className="text-slate-500 text-sm">x{qty}</span></span>
                  <span className="font-medium">₹{p.price * qty}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-slate-700 pt-4 space-y-2 mb-8">
            <div className="flex justify-between text-slate-400 text-sm"><span>Subtotal</span><span>₹{getCartTotal()}</span></div>
            <div className="flex justify-between text-slate-400 text-sm"><span>Delivery</span><span className="text-emerald-400 font-medium">Free</span></div>
            <div className="flex justify-between text-xl font-black text-white pt-3 border-t border-slate-700"><span>Total</span><span>₹{getCartTotal()}</span></div>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 flex items-start gap-3">
            <div className="w-4 h-4 rounded-full border-4 border-blue-500 bg-slate-900 shrink-0 mt-0.5" />
            <div><p className="font-bold text-sm">Cash on Delivery</p><p className="text-xs text-slate-400 mt-0.5">Pay when your order arrives.</p></div>
          </div>
          <button form="checkout-form" type="submit" disabled={placing}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg transition">
            {placing ? 'Placing...' : `Place Order (₹${getCartTotal()})`}
          </button>
        </div>
      </div>
    </div>
  );

  // ── MAIN SHOP / ORDERS SCREEN ────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      <Toaster />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="bg-blue-500/30 text-blue-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block border border-blue-400/30">Farm to Home</span>
          <h1 className="text-4xl sm:text-5xl font-black mb-3 leading-tight">Fresh, Pure & Unadulterated Dairy.</h1>
          <p className="text-blue-100 text-lg opacity-90">A2 buffalo milk, delivered within hours of milking.</p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4"><Droplet size={260} /></div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {([['shop', 'Shop', ShoppingCart], ['orders', 'My Orders', History]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 -mb-px transition ${
              tab === key ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}>
            <Icon size={15} /> {label}
            {key === 'shop' && totalItems > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{totalItems}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── SHOP TAB ── */}
      {tab === 'shop' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Star className="text-amber-500" fill="currentColor" size={18} /> Premium Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {PRODUCTS.map(product => (
                <div key={product.id} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all group">
                  <div className="h-48 relative overflow-hidden">
                    {product.tag && (
                      <span className="absolute top-3 left-3 z-10 bg-amber-500 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-full shadow">
                        {product.tag}
                      </span>
                    )}
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-bold">{product.name}</h3>
                      <p className="font-bold text-blue-600 dark:text-blue-400">₹{product.price}<span className="text-xs text-slate-400 font-normal">/{product.unit}</span></p>
                    </div>
                    <p className="text-sm text-slate-500 mb-5 line-clamp-2">{product.description}</p>
                    {cart[product.id] ? (
                      <div className="flex items-center justify-between bg-blue-50 dark:bg-slate-900 rounded-xl p-1 border border-blue-100 dark:border-slate-700">
                        <button onClick={() => updateQuantity(product.id, -1)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg text-blue-600 shadow-sm hover:bg-blue-100 transition"><Minus size={16} /></button>
                        <span className="font-bold w-8 text-center">{cart[product.id]}</span>
                        <button onClick={() => updateQuantity(product.id, 1)} className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition"><Plus size={16} /></button>
                      </div>
                    ) : (
                      <button onClick={() => updateQuantity(product.id, 1)}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition flex items-center justify-center gap-2">
                        <Plus size={18} /> Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ShoppingCart className="text-blue-500" /> Your Cart
                {totalItems > 0 && <span className="ml-auto text-xs font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{totalItems}</span>}
              </h2>
              {totalItems === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Package size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Your cart is empty.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 mb-5">
                    {Object.entries(cart).map(([id, qty]) => {
                      const p = PRODUCTS.find(pr => pr.id === id)!;
                      return (
                        <div key={id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div>
                            <p className="font-bold text-sm">{p.name}</p>
                            <p className="text-xs text-slate-400">₹{p.price} × {qty}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-blue-600 text-sm">₹{p.price * qty}</p>
                            <button onClick={() => { const n = { ...cart }; delete n[id]; setCart(n); }}
                              className="text-slate-300 hover:text-rose-500 transition"><X size={14} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t dark:border-slate-700 pt-4 space-y-2 mb-5">
                    <div className="flex justify-between text-sm text-slate-500"><span>Subtotal</span><span>₹{getCartTotal()}</span></div>
                    <div className="flex justify-between text-sm text-slate-500"><span>Delivery</span><span className="text-emerald-500 font-medium">Free</span></div>
                    <div className="flex justify-between text-lg font-black pt-2 border-t dark:border-slate-700"><span>Total</span><span>₹{getCartTotal()}</span></div>
                  </div>
                  <button onClick={() => setCheckoutStep('checkout')}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 group">
                    Checkout <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ORDERS TAB ── */}
      {tab === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="flex items-center justify-center py-20 text-blue-600 text-3xl animate-bounce">🛒</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Package size={56} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No orders yet.</p>
              <button onClick={() => setTab('shop')} className="mt-4 text-blue-600 hover:underline text-sm">Start shopping →</button>
            </div>
          ) : orders.map(order => (
            <div key={order.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-lg border ${STATUS_STYLES[order.status] || ''}`}>
                    {order.status}
                  </span>
                  <div>
                    <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleString()}</p>
                    <p className="text-sm text-slate-500">{order.time_slot}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-black text-blue-600 dark:text-blue-400 text-xl">₹{order.total_amount}</p>
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      disabled={cancellingId === order.id}
                      className="text-xs text-rose-600 border border-rose-200 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition disabled:opacity-50 flex items-center gap-1">
                      <X size={12} /> {cancellingId === order.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
              <div className="p-5 space-y-2">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Items</p>
                {(order.order_items || []).map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">{item.product_name} <span className="text-slate-400">×{item.quantity}</span></span>
                    <span className="font-medium">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t dark:border-slate-700 flex items-start gap-2 text-xs text-slate-400">
                  <MapPin size={12} className="mt-0.5 shrink-0" />
                  {order.delivery_address}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
