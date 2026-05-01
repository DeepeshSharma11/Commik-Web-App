import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartState {
  items: { [key: string]: number };
  addItem: (id: string, qty?: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: {},
      addItem: (id, qty = 1) => set((state) => ({
        items: { ...state.items, [id]: Math.max(0, (state.items[id] || 0) + qty) }
      })),
      removeItem: (id) => set((state) => {
        const newItems = { ...state.items };
        delete newItems[id];
        return { items: newItems };
      }),
      clearCart: () => set({ items: {} }),
    }),
    { name: 'commilk-cart' }
  )
);
