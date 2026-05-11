import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  isVeg: boolean;
  restaurantId: string;
  restaurantName: string;
}

interface CartState {
  items: CartItem[];
  coupon: string | null;
  addItem: (item: any, restaurantId: string, restaurantName: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
}

const COUPONS: Record<string, { type: "percent" | "flat"; value: number }> = {
  YUMORA100: { type: "flat", value: 100 },
  FLAT50: { type: "percent", value: 50 },
  SAVE20: { type: "percent", value: 20 },
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: (item, restaurantId, restaurantName) => {
        const { items } = get();
        
        if (items.length > 0 && items[0].restaurantId !== restaurantId) {
          toast.error("Cart contains items from another restaurant. Clear it first!");
          return;
        }

        const existingItem = items.find((i) => i.id === item.id);
        
        if (existingItem) {
          set({
            items: items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({
            items: [...items, { ...item, quantity: 1, restaurantId, restaurantName }],
          });
        }
        toast.success(`${item.name} added to cart`);
      },

      removeItem: (itemId) => {
        set({ items: get().items.filter((i) => i.id !== itemId) });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === itemId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [], coupon: null }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      
      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      applyCoupon: (code) => {
        const upper = code.toUpperCase().trim();
        if (COUPONS[upper]) {
          set({ coupon: upper });
          toast.success(`Coupon ${upper} applied!`);
        } else {
          toast.error("Invalid coupon code");
        }
      },

      removeCoupon: () => {
        set({ coupon: null });
        toast("Coupon removed");
      }
    }),
    {
      name: 'yumora-cart',
    }
  )
);
