import { create } from 'zustand';
import { getRestaurantMenuApi, updateRestaurantMenuApi } from '../api';
import { MenuItem } from '../types';

interface RestaurantMenuState {
  menuItems: MenuItem[];
  isLoading: boolean;
  isSaving: boolean;

  fetchMenu: () => Promise<void>;
  toggleItemStock: (itemId: string, inStock: boolean) => Promise<boolean>;
  addItem: (item: Omit<MenuItem, 'id'>) => Promise<boolean>;
  updateItem: (itemId: string, updates: Partial<MenuItem>) => Promise<boolean>;
  deleteItem: (itemId: string) => Promise<boolean>;
}

export const useRestaurantMenuStore = create<RestaurantMenuState>((set, get) => ({
  menuItems: [],
  isLoading: false,
  isSaving: false,

  fetchMenu: async () => {
    try {
      set({ isLoading: true });
      const res: any = await getRestaurantMenuApi();
      if (res?.data) {
        set({ menuItems: res.data });
      }
    } catch (err) {
      console.error('[MenuStore] Fetch menu error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleItemStock: async (itemId: string, inStock: boolean) => {
    const current = get().menuItems;
    const updated = current.map((i) =>
      (i.id === itemId || i._id === itemId) ? { ...i, inStock, isAvailable: inStock } : i
    );
    set({ menuItems: updated });

    try {
      set({ isSaving: true });
      await updateRestaurantMenuApi(updated);
      return true;
    } catch (err) {
      // Rollback on fail
      set({ menuItems: current });
      console.error('[MenuStore] Toggle stock error:', err);
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  addItem: async (item) => {
    const current = get().menuItems;
    const newItem: MenuItem = {
      ...item,
      id: Date.now().toString(),
      inStock: true,
      isAvailable: true,
    };
    const updated = [...current, newItem];
    set({ menuItems: updated });

    try {
      set({ isSaving: true });
      await updateRestaurantMenuApi(updated);
      return true;
    } catch (err) {
      set({ menuItems: current });
      console.error('[MenuStore] Add item error:', err);
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  updateItem: async (itemId: string, updates: Partial<MenuItem>) => {
    const current = get().menuItems;
    const updated = current.map((i) =>
      (i.id === itemId || i._id === itemId) ? { ...i, ...updates } : i
    );
    set({ menuItems: updated });

    try {
      set({ isSaving: true });
      await updateRestaurantMenuApi(updated);
      return true;
    } catch (err) {
      set({ menuItems: current });
      console.error('[MenuStore] Update item error:', err);
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  deleteItem: async (itemId: string) => {
    const current = get().menuItems;
    const updated = current.filter((i) => (i.id !== itemId && i._id !== itemId));
    set({ menuItems: updated });

    try {
      set({ isSaving: true });
      await updateRestaurantMenuApi(updated);
      return true;
    } catch (err) {
      set({ menuItems: current });
      console.error('[MenuStore] Delete item error:', err);
      return false;
    } finally {
      set({ isSaving: false });
    }
  },
}));
