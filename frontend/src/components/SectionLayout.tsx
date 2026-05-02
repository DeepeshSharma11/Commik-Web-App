import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import ProductCard, { type Product } from './ProductCard';

type ViewType = 'grid' | 'slider' | 'list';
type CardVariant = 'detailed' | 'compact';

interface SectionLayoutProps {
  title: string;
  subtitle?: string;
  viewType?: ViewType;
  cardVariant?: CardVariant;
  data: Product[];
  onViewAll?: () => void;
  cols?: 2 | 3 | 4;
  emptyText?: string;
}

const SectionLayout: React.FC<SectionLayoutProps> = ({
  title,
  subtitle,
  viewType = 'grid',
  cardVariant,
  data,
  onViewAll,
  cols = 3,
  emptyText = 'No products available.',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-decide card variant if not specified
  const variant: CardVariant = cardVariant || (viewType === 'grid' ? 'detailed' : 'compact');

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  // Grid column classes
  const gridCols = cols === 4
    ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
    : cols === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  if (data.length === 0) return null;

  return (
    <section className="py-6">
      {/* ── Section Header ── */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {onViewAll && (
          <button onClick={onViewAll} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition flex items-center gap-1 shrink-0">
            View All <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* ── GRID View ── */}
      {viewType === 'grid' && (
        <div className={`grid ${gridCols} gap-5 sm:gap-6`}>
          {data.map(p => <ProductCard key={p.id} product={p} variant={variant} />)}
        </div>
      )}

      {/* ── SLIDER View ── */}
      {viewType === 'slider' && (
        <div className="relative group/slider">
          {/* Scroll buttons */}
          <button onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-emerald-600 transition opacity-0 group-hover/slider:opacity-100">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-emerald-600 transition opacity-0 group-hover/slider:opacity-100">
            <ChevronRight size={18} />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style>{`.slider-hide-scroll::-webkit-scrollbar { display: none; }`}</style>
            {data.map(p => (
              <div key={p.id} className={`shrink-0 ${variant === 'detailed' ? 'w-[280px]' : 'w-[300px]'}`}>
                <ProductCard product={p} variant={variant} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LIST View ── */}
      {viewType === 'list' && (
        <div className="space-y-3">
          {data.map(p => <ProductCard key={p.id} product={p} variant="compact" />)}
        </div>
      )}
    </section>
  );
};

export default SectionLayout;
