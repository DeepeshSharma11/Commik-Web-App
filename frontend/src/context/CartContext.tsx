import React, { createContext, useContext, useMemo } from 'react';
import { useCartStore } from '../cartStore';

interface CartContextType {
  items: { [key: string]: number };
  addItem: (id: string, qty?: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { items, addItem, removeItem, clearCart } = useCartStore();

  const totalItems = useMemo(
    () => Object.values(items).reduce((sum, qty) => sum + qty, 0),
    [items]
  );

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    clearCart,
    totalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
