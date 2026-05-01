import React from 'react';

// ── Base Skeleton Bone ──
const Bone: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse ${className}`} />
);

// ── Product Card Skeleton ──
export const ProductCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
    <Bone className="h-48 rounded-none" />
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-start">
        <Bone className="h-5 w-32" />
        <Bone className="h-6 w-16" />
      </div>
      <Bone className="h-3 w-full" />
      <Bone className="h-3 w-3/4" />
      <Bone className="h-12 w-full rounded-xl" />
    </div>
  </div>
);

// ── Table Row Skeleton ──
export const TableRowSkeleton = ({ cols = 4 }: { cols?: number }) => (
  <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
    {Array.from({ length: cols }).map((_, i) => (
      <Bone key={i} className={`h-4 ${i === 0 ? 'w-10' : i === 1 ? 'w-32' : 'w-20'} ${i === 0 ? 'rounded-full' : ''}`} />
    ))}
  </div>
);

// ── Order Card Skeleton ──
export const OrderCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 space-y-4">
    <div className="flex items-center justify-between">
      <Bone className="h-5 w-28" />
      <Bone className="h-6 w-20 rounded-full" />
    </div>
    <div className="space-y-2">
      <Bone className="h-3 w-full" />
      <Bone className="h-3 w-2/3" />
    </div>
    <div className="flex justify-between items-center pt-2">
      <Bone className="h-6 w-16" />
      <Bone className="h-3 w-24" />
    </div>
  </div>
);

// ── Profile Skeleton ──
export const ProfileSkeleton = () => (
  <div className="max-w-2xl mx-auto space-y-6">
    <Bone className="h-7 w-36" />
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
      <Bone className="h-32 rounded-none" />
      <div className="pt-14 px-8 pb-8 space-y-6">
        <div className="space-y-2">
          <Bone className="h-6 w-44" />
          <Bone className="h-4 w-28" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Bone className="h-10 w-10 rounded-xl shrink-0" />
              <div className="space-y-1 flex-1">
                <Bone className="h-2.5 w-12" />
                <Bone className="h-4 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ── Settings Form Skeleton ──
export const FormSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 space-y-6">
    <Bone className="h-7 w-40" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Bone className="h-3 w-20" />
        <Bone className="h-12 w-full rounded-xl" />
      </div>
    ))}
    <Bone className="h-12 w-full rounded-xl" />
  </div>
);

// ── Full Page Skeleton (generic) ──
export const PageSkeleton = () => (
  <div className="space-y-6 animate-in fade-in">
    <Bone className="h-7 w-48" />
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 space-y-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-4">
          <Bone className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-3/4" />
            <Bone className="h-3 w-1/2" />
          </div>
          <Bone className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

// ── Product Grid Skeleton ──
export const ProductGridSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
  </div>
);

// ── Orders List Skeleton ──
export const OrdersListSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => <OrderCardSkeleton key={i} />)}
  </div>
);

export default Bone;
