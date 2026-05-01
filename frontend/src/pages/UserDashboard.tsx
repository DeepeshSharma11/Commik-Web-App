import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, CreditCard, CheckCircle2, ChevronRight, Package, Droplet, Star } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// Mock Products for the E-Commerce Store
const PRODUCTS = [
  {
    id: 'p1',
    name: 'Fresh Buffalo Milk',
    description: '100% pure, unadulterated raw buffalo milk directly from our farm. Rich in A2 protein and fat.',
    price: 65,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800',
    tag: 'Bestseller'
  },
  {
    id: 'p2',
    name: 'Pure Desi Ghee',
    description: 'Traditional bilona churned ghee made from A2 buffalo milk. Perfect aroma and granular texture.',
    price: 850,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1605296830501-c889781ce7db?auto=format&fit=crop&q=80&w=800',
    tag: 'Premium'
  },
  {
    id: 'p3',
    name: 'Fresh Farm Paneer',
    description: 'Soft, creamy, and freshly prepared paneer. No preservatives or artificial softeners added.',
    price: 320,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?auto=format&fit=crop&q=80&w=800'
  }
];

const UserDashboard = () => {
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [checkoutStep, setCheckoutStep] = useState<'shop' | 'checkout' | 'success'>('shop');
  const [address, setAddress] = useState('');

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const newQty = (prev[id] || 0) + delta;
      if (newQty <= 0) {
        const newCart = { ...prev };
        delete newCart[id];
        return newCart;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [id, qty]) => {
      const product = PRODUCTS.find(p => p.id === id);
      return total + (product ? product.price * qty : 0);
    }, 0);
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(cart).length === 0) return toast.error('Your cart is empty!');
    if (!address.trim()) return toast.error('Please provide a delivery address.');
    
    // Simulate API call
    toast.loading('Processing payment...', { duration: 1500 });
    setTimeout(() => {
      setCheckoutStep('success');
      setCart({});
    }, 1500);
  };

  if (checkoutStep === 'success') {
    return (
      <div className="min-h-[600px] flex items-center justify-center animate-in zoom-in duration-500">
        <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-xl text-center max-w-md w-full border border-slate-100 dark:border-slate-700">
          <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Order Confirmed!</h2>
          <p className="text-slate-500 mb-8">Thank you for choosing CommilK. Your fresh dairy products will be delivered by tomorrow morning.</p>
          <button 
            onClick={() => setCheckoutStep('shop')}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <Toaster />
      
      {/* Header Banner */}
      {checkoutStep === 'shop' && (
        <div className="bg-gradient-to-r from-blue-700 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="bg-blue-500/30 text-blue-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block backdrop-blur-sm border border-blue-400/30">Farm to Home</span>
            <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">Fresh, Pure & Unadulterated Dairy.</h1>
            <p className="text-blue-100 text-lg sm:text-xl opacity-90 max-w-xl">Experience the rich taste of pure A2 buffalo milk, delivered straight from our local farms to your doorstep within hours of milking.</p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none transform translate-x-1/4 translate-y-1/4">
            <Droplet size={300} />
          </div>
        </div>
      )}

      {checkoutStep === 'shop' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Listing */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="text-amber-500" fill="currentColor" /> Premium Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {PRODUCTS.map(product => (
                <div key={product.id} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all group">
                  <div className="h-48 overflow-hidden relative">
                    {product.tag && (
                      <span className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full z-10 shadow-md">
                        {product.tag}
                      </span>
                    )}
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{product.name}</h3>
                      <p className="font-bold text-blue-600 dark:text-blue-400 text-lg">₹{product.price}<span className="text-xs text-slate-400 font-normal">/{product.unit}</span></p>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">{product.description}</p>
                    
                    {cart[product.id] ? (
                      <div className="flex items-center justify-between bg-blue-50 dark:bg-slate-900 rounded-xl p-1 border border-blue-100 dark:border-slate-700">
                        <button onClick={() => updateQuantity(product.id, -1)} className="p-2 w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg text-blue-600 shadow-sm hover:bg-blue-100 transition"><Minus size={16}/></button>
                        <span className="font-bold text-slate-900 dark:text-white w-8 text-center">{cart[product.id]}</span>
                        <button onClick={() => updateQuantity(product.id, 1)} className="p-2 w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition"><Plus size={16}/></button>
                      </div>
                    ) : (
                      <button onClick={() => updateQuantity(product.id, 1)} className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition flex items-center justify-center gap-2">
                        <Plus size={18} /> Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <ShoppingCart className="text-blue-500" /> Your Cart
                {totalItems > 0 && <span className="bg-blue-100 text-blue-600 text-xs py-0.5 px-2 rounded-full ml-auto">{totalItems} items</span>}
              </h2>

              {totalItems === 0 ? (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500">Your cart is empty.</p>
                  <p className="text-sm text-slate-400 mt-1">Add some fresh dairy to get started.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6">
                    {Object.entries(cart).map(([id, qty]) => {
                      const product = PRODUCTS.find(p => p.id === id);
                      if (!product) return null;
                      return (
                        <div key={id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">{product.name}</p>
                            <p className="text-xs text-slate-500">₹{product.price} x {qty}</p>
                          </div>
                          <p className="font-bold text-blue-600 dark:text-blue-400">₹{product.price * qty}</p>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="border-t dark:border-slate-700 pt-4 space-y-3 mb-6">
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Subtotal</span>
                      <span>₹{getCartTotal()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Delivery</span>
                      <span className="text-emerald-500 font-medium">Free</span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white pt-2 border-t dark:border-slate-700">
                      <span>Total</span>
                      <span>₹{getCartTotal()}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setCheckoutStep('checkout')}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition flex items-center justify-center gap-2 group"
                  >
                    Proceed to Checkout <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* CHECKOUT STEP */
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setCheckoutStep('shop')}
            className="text-blue-600 text-sm font-medium hover:underline mb-6 flex items-center gap-1"
          >
            &larr; Back to Shopping
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Delivery Details */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><MapPin className="text-blue-500"/> Delivery Details</h2>
              <form onSubmit={handlePlaceOrder} id="checkout-form" className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Complete Address</label>
                  <textarea 
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="House No, Street, Village/City, Landmark..."
                    className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Delivery Time Slot</label>
                  <select className="w-full p-4 border dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                    <option>Morning (6:00 AM - 8:00 AM)</option>
                    <option>Evening (5:00 PM - 7:00 PM)</option>
                  </select>
                </div>
              </form>
            </div>

            {/* Payment & Summary */}
            <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2"><CreditCard className="text-blue-400"/> Payment Summary</h2>
              
              <div className="space-y-4 mb-8 max-h-[200px] overflow-y-auto pr-2">
                {Object.entries(cart).map(([id, qty]) => {
                  const product = PRODUCTS.find(p => p.id === id);
                  if (!product) return null;
                  return (
                    <div key={id} className="flex justify-between items-center">
                      <p className="text-slate-300">{product.name} <span className="text-slate-500 text-sm ml-2">x{qty}</span></p>
                      <p className="font-medium">₹{product.price * qty}</p>
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t border-slate-700 pt-6 mb-8 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{getCartTotal()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Fee</span>
                  <span className="text-emerald-400">Free</span>
                </div>
                <div className="flex justify-between text-2xl font-black text-white pt-4 mt-2 border-t border-slate-700">
                  <span>Total Due</span>
                  <span>₹{getCartTotal()}</span>
                </div>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-8 flex items-start gap-3">
                <div className="mt-1 w-4 h-4 rounded-full border-4 border-blue-500 bg-slate-900 shrink-0"></div>
                <div>
                  <p className="font-bold text-sm">Cash on Delivery</p>
                  <p className="text-xs text-slate-400 mt-1">Pay when your farm-fresh milk arrives.</p>
                </div>
              </div>

              <button 
                form="checkout-form"
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition"
              >
                Place Order (₹{getCartTotal()})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
