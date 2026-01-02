import React, { createContext, useContext, useEffect, useState } from 'react';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  requiresPrescription?: boolean;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (p: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clear: () => void;
  total: () => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('cart_items');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const addItem = (p: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === p.productId);
      if (existing) return prev.map((i) => i.productId === p.productId ? { ...i, quantity: i.quantity + p.quantity } : i);
      return [...prev, p];
    });
  };

  const removeItem = (productId: string) => setItems((prev) => prev.filter((i) => i.productId !== productId));

  const updateQuantity = (productId: string, qty: number) => setItems((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));

  const clear = () => setItems([]);

  const total = () => items.reduce((s, i) => s + i.price * i.quantity, 0);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cart_items', JSON.stringify(items));
    } catch {}
  }, [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export default CartProvider;
