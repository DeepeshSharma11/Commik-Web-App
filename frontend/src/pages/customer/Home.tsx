import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Package, Droplet, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useCartStore } from '../../cartStore';

const Home = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { items, addItem, removeItem } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products/');
        setProducts(res.data);
      } catch {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const totalItems = Object.values(items).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 right-10 opacity-10">
          <Droplet size={180} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-6">Farm to Home</span>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">Fresh, Pure & Unadulterated Dairy.</h1>
          <p className="text-blue-100 text-lg mb-8 max-w-lg">A2 buffalo milk, delivered within hours of milking.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black flex items-center gap-2"><Star className="text-amber-500 fill-amber-500" size={20} /> Premium Products</h2>
        {totalItems > 0 && (
          <button onClick={() => navigate('/user/cart')} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">
            <ShoppingCart size={18} /> View Cart ({totalItems})
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(n => <div key={n} className="bg-slate-200 dark:bg-slate-800 h-80 rounded-3xl"></div>)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p => {
            const qty = items[p.id] || 0;
            return (
              <div key={p.id} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden group hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300">
                <div className="h-48 overflow-hidden relative">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  {p.tag && <span className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full shadow-lg">{p.tag}</span>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg leading-tight">{p.name}</h3>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-black text-blue-600 dark:text-blue-400 text-xl">₹{p.price}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">per {p.unit}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">{p.description}</p>
                  {qty === 0 ? (
                    <button onClick={() => addItem(p.id)} className="w-full py-3 bg-slate-50 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold rounded-xl transition flex justify-center items-center gap-2 border dark:border-slate-700">
                      <Plus size={16} /> Add to Cart
                    </button>
                  ) : (
                    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-xl p-1 border border-blue-100 dark:border-blue-900">
                      <button onClick={() => updateQuantity(p.id, -1)} className="p-3 text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg shadow-sm transition"><Minus size={16} /></button>
                      <span className="font-black text-blue-700 dark:text-blue-300 w-12 text-center">{qty}</span>
                      <button onClick={() => updateQuantity(p.id, 1)} className="p-3 text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg shadow-sm transition"><Plus size={16} /></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  function updateQuantity(id: string, delta: number) {
    const qty = items[id] || 0;
    if (qty + delta <= 0) removeItem(id);
    else addItem(id, delta);
  }
};

export default Home;
