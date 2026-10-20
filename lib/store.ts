'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Variant } from '@/data/products';

export type CartItem = { slug: string; variant: Variant; qty: number };

type ShopState = {
  cart: CartItem[];
  favorites: string[];
  cartOpen: boolean;
  searchOpen: boolean;
  ringGuideOpen: boolean;
  /** Incrementa a cada "adicionar" para disparar o bump do contador. */
  bump: number;
  add: (slug: string, variant: Variant, qty?: number) => void;
  remove: (slug: string, variant: Variant) => void;
  setQty: (slug: string, variant: Variant, qty: number) => void;
  clear: () => void;
  toggleFavorite: (slug: string) => void;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setRingGuideOpen: (open: boolean) => void;
};

const same = (a: CartItem, slug: string, variant: Variant) => a.slug === slug && a.variant === variant;

export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      cart: [],
      favorites: [],
      cartOpen: false,
      searchOpen: false,
      ringGuideOpen: false,
      bump: 0,
      add: (slug, variant, qty = 1) =>
        set((s) => {
          const exists = s.cart.find((i) => same(i, slug, variant));
          const cart = exists
            ? s.cart.map((i) => (same(i, slug, variant) ? { ...i, qty: Math.min(99, i.qty + qty) } : i))
            : [...s.cart, { slug, variant, qty }];
          return { cart, bump: s.bump + 1 };
        }),
      remove: (slug, variant) => set((s) => ({ cart: s.cart.filter((i) => !same(i, slug, variant)) })),
      setQty: (slug, variant, qty) =>
        set((s) => ({ cart: s.cart.map((i) => (same(i, slug, variant) ? { ...i, qty: Math.max(1, Math.min(99, qty)) } : i)) })),
      clear: () => set({ cart: [] }),
      toggleFavorite: (slug) =>
        set((s) => ({ favorites: s.favorites.includes(slug) ? s.favorites.filter((f) => f !== slug) : [...s.favorites, slug] })),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      setRingGuideOpen: (ringGuideOpen) => set({ ringGuideOpen }),
    }),
    {
      name: 'valut-shop',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ cart: s.cart, favorites: s.favorites }),
      skipHydration: true,
    },
  ),
);

export const cartCount = (cart: CartItem[]) => cart.reduce((n, i) => n + i.qty, 0);
