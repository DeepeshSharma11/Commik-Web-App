import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '../context';

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  image?: string;
  tag?: string;
  category?: string;
};

type ProductCardProps = {
  product: Product;
  variant?: 'detailed' | 'compact';
};

const ProductCard: React.FC<ProductCardProps> = ({ product: p, variant = 'detailed' }) => {
  const { items, addItem, removeItem } = useCart();
  const qty = items[p.id] || 0;

  const updateQty = (delta: number) => {
    if (qty + delta <= 0) removeItem(p.id);
    else addItem(p.id, delta);
  };

  if (variant === 'compact') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex overflow-hidden hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 group">
        <div className="w-24 sm:w-28 shrink-0 relative overflow-hidden">
          {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />}
          {p.tag && <span className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] uppercase font-black px-2 py-0.5 rounded-full">{p.tag}</span>}
        </div>
        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
          <div>
            <h4 className="font-bold text-sm truncate">{p.name}</h4>
            <p className="text-xs text-slate-400 truncate mt-0.5">{p.description}</p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="font-black text-emerald-600 dark:text-emerald-400">₹{p.price}</span>
              <span className="text-[9px] text-slate-400 font-bold ml-1">/{p.unit}</span>
            </div>
            {qty === 0 ? (
              <button onClick={() => addItem(p.id)} className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg hover:bg-emerald-100 transition">
                <Plus size={14} />
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-1 border border-emerald-100 dark:border-emerald-900">
                <button onClick={() => updateQty(-1)} className="p-1.5 text-emerald-600"><Minus size={12} /></button>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 w-5 text-center">{qty}</span>
                <button onClick={() => updateQty(1)} className="p-1.5 text-emerald-600"><Plus size={12} /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden group hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-900 transition-all duration-300">
      <div className="h-48 overflow-hidden relative">
        {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />}
        {p.tag && <span className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full shadow-lg">{p.tag}</span>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg leading-tight">{p.name}</h3>
          <div className="text-right shrink-0 ml-4">
            <p className="font-black text-emerald-600 dark:text-emerald-400 text-xl">₹{p.price}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">per {p.unit}</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">{p.description}</p>
        {qty === 0 ? (
          <button onClick={() => addItem(p.id)} className="w-full py-3 bg-slate-50 hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-900/30 text-slate-700 dark:text-slate-300 hover:text-emerald-600 font-bold rounded-xl transition flex justify-center items-center gap-2 border dark:border-slate-700">
            <Plus size={16} /> Add to Cart
          </button>
        ) : (
          <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-1 border border-emerald-100 dark:border-emerald-900">
            <button onClick={() => updateQty(-1)} className="p-3 text-emerald-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg shadow-sm transition"><Minus size={16} /></button>
            <span className="font-black text-emerald-700 dark:text-emerald-300 w-12 text-center">{qty}</span>
            <button onClick={() => updateQty(1)} className="p-3 text-emerald-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg shadow-sm transition"><Plus size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
