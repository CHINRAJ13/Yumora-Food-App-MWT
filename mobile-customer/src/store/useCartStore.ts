import { create } from 'zustand';
import { MenuItem, CartItem } from '../types';

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  addItem: (item: MenuItem, restaurantId: string, restaurantName: string) => boolean;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  restaurantId: null,
  restaurantName: null,

  addItem: (item, restaurantId, restaurantName) => {
    const { items, restaurantId: currentRestId } = get();

    // Prevent adding from different restaurants
    if (currentRestId && currentRestId !== restaurantId && items.length > 0) {
      return false;
    }

    const existingIndex = items.findIndex((i) => i.id === item.id);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      set({ items: updated });
    } else {
      set({
        items: [...items, { ...item, quantity: 1, restaurantId, restaurantName }],
        restaurantId,
        restaurantName,
      });
    }
    return true;
  },

  removeItem: (itemId) => {
    const { items } = get();
    const updated = items.filter((i) => i.id !== itemId);
    set({
      items: updated,
      restaurantId: updated.length === 0 ? null : get().restaurantId,
      restaurantName: updated.length === 0 ? null : get().restaurantName,
    });
  },

  updateQuantity: (itemId, quantity) => {
    const { items } = get();
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    const updated = items.map((i) => (i.id === itemId ? { ...i, quantity } : i));
    set({ items: updated });
  },

  clearCart: () => set({ items: [], restaurantId: null, restaurantName: null }),

  getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

  getTotalPrice: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}));
