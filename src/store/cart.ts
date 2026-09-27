"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ItemSelection } from "@/lib/pricing";

/** Item no carrinho: a seleção (enviada ao servidor) + dados de exibição */
export type CartItem = {
  key: string;
  selection: ItemSelection;
  name: string;
  imageUrl: string | null;
  details: string[];
  unitPrice: number; // estimativa exibida; o servidor recalcula no checkout
  sector: string;
};

type CartState = {
  items: CartItem[];
  couponCode: string | null;
  isOpen: boolean;
  add: (item: Omit<CartItem, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setCoupon: (code: string | null) => void;
  open: () => void;
  close: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      couponCode: null,
      isOpen: false,
      add: (item) =>
        set((s) => ({
          items: [...s.items, { ...item, key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }],
        })),
      setQuantity: (key, quantity) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.key === key ? { ...i, selection: { ...i.selection, quantity } } : i))
            .filter((i) => i.selection.quantity > 0),
        })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [], couponCode: null }),
      setCoupon: (couponCode) => set({ couponCode }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "ranchos-carrinho",
      partialize: (s) => ({ items: s.items, couponCode: s.couponCode }),
      // Reidratado manualmente em <CartHydrator/> para evitar erro de hidratação no SSR
      skipHydration: true,
    },
  ),
);

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.unitPrice * i.selection.quantity, 0);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.selection.quantity, 0);
}
