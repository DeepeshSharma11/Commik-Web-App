import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Droplet, Star, Flame, Clock, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useCart } from '../../context';
import { ProductGridSkeleton } from '../../components/Skeleton';
import SectionLayout from '../../components/SectionLayout';
import type { Product } from '../../components/ProductCard';

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { totalItems } = useCart();
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

  // Split products into sections based on tags/category
  const featured = useMemo(() => products.filter(p => p.tag === 'bestseller'), [products]);
  const premium = useMemo(() => products.filter(p => p.tag === 'premium'), [products]);
  const allProducts = useMemo(() => products, [products]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 right-10 opacity-10">
          <Droplet size={180} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <img src="/commilk_logo.png" alt="CommilK Logo" className="h-8 sm:h-12 object-contain drop-shadow-lg" />
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">Farm to Home</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">Fresh, Pure & Unadulterated Dairy.</h1>
          <p className="text-emerald-100 text-lg mb-8 max-w-lg">A2 buffalo milk, delivered within hours of milking.</p>
        </div>
      </div>

      {/* Floating Cart FAB (mobile) */}
      {totalItems > 0 && (
        <div className="sm:hidden fixed bottom-6 right-6 z-30">
          <button onClick={() => navigate('/user/cart')} className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-600/30 relative">
            <ShoppingCart size={22} />
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
              {totalItems}
            </span>
          </button>
        </div>
      )}

      {/* Desktop Cart Bar */}
      {totalItems > 0 && (
        <div className="hidden sm:flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-6 py-3">
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
            <ShoppingCart size={16} className="inline mr-2" />{totalItems} item{totalItems > 1 ? 's' : ''} in cart
          </span>
          <button onClick={() => navigate('/user/cart')} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition shadow-md">
            View Cart →
          </button>
        </div>
      )}

      {loading ? (
        <ProductGridSkeleton count={6} />
      ) : (
        <>
          {/* Featured / Bestseller — Slider */}
          {featured.length > 0 && (
            <SectionLayout
              title="🔥 Bestsellers"
              subtitle="Most loved by our farmers"
              viewType="slider"
              cardVariant="detailed"
              data={featured}
            />
          )}

          {/* All Products — Grid */}
          <SectionLayout
            title="⭐ All Products"
            subtitle="Fresh from the farm"
            viewType="grid"
            cols={3}
            data={allProducts}
          />

          {/* Premium — List */}
          {premium.length > 0 && (
            <SectionLayout
              title="🏆 Premium Selection"
              subtitle="Top-tier quality"
              viewType="list"
              data={premium}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Home;
