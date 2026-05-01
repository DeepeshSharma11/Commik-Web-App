import React, { useState, useEffect } from 'react';
import { Minus, Plus, ArrowRight, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api } from '../../api';
import { useCartStore } from '../../cartStore';

const Cart = () => {
  const { items, addItem, removeItem } = useCartStore();
  const [products, setProducts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products/');
        setProducts(res.data);
      } catch {
        toast.error('Failed to load products');
      }
    };
    fetchProducts();
  }, []);

  const getCartTotal = () =>
    Object.entries(items).reduce((sum, [id, qty]) => {
      const p = products.find(pr => pr.id === id);
      return sum + (p ? p.price * qty : 0);
    }, 0);

  const updateQuantity = (id: string, delta: number) => {
    const qty = items[id] || 0;
    if (qty + delta <= 0) removeItem(id);
    else addItem(id, delta); // Since addItem adds to existing qty, we just pass delta!
  };

  if (Object.keys(items).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm animate-in fade-in">
        <Package size={64} className="opacity-20 mb-6" />
        <p className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-6">Your cart is empty.</p>
        <button onClick={() => navigate('/user/shop')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <h2 className="text-2xl font-black mb-6">Your Cart</h2>
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
        {Object.entries(items).map(([id, qty]) => {
          const p = products.find(pr => pr.id === id);
          if (!p) return null;
          return (
            <div key={id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
              <div className="flex items-center gap-4">
                <img src={p.image} alt={p.name} className="w-16 h-16 rounded-xl object-cover bg-slate-100 border dark:border-slate-700" />
                <div>
                  <h4 className="font-bold">{p.name}</h4>
                  <p className="text-blue-600 dark:text-blue-400 font-black">₹{p.price}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 p-1">
                  <button onClick={() => updateQuantity(id, -1)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded shadow-sm text-slate-500 transition"><Minus size={14} /></button>
                  <span className="w-8 text-center font-bold text-sm">{qty}</span>
                  <button onClick={() => updateQuantity(id, 1)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded shadow-sm text-slate-500 transition"><Plus size={14} /></button>
                </div>
                <p className="font-black w-16 text-right">₹{p.price * qty}</p>
              </div>
            </div>
          );
        })}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Total Amount</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">₹{getCartTotal()}</p>
          </div>
          <button onClick={() => navigate('/user/checkout')} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2">
            Proceed to Checkout <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
