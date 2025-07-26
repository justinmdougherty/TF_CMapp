import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, CartSummary } from 'src/types/Cart';

interface CartStore {
  // State
  items: CartItem[];
  isCartOpen: boolean;

  // Actions
  addItem: (item: Omit<CartItem, 'id' | 'dateAdded'>) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateItemCost: (id: string, cost: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Computed getters
  getCartSummary: () => CartSummary;
  getNewItems: () => CartItem[];
  getReorderItems: () => CartItem[];
  getAdjustmentItems: () => CartItem[];
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isCartOpen: false,

      // Actions
      addItem: (itemData) => {
        const newItem: CartItem = {
          ...itemData,
          id: `cart-${Date.now()}-${Math.random().toString(36).substring(2)}`,
          dateAdded: new Date(),
        };

        set((state) => ({
          items: [...state.items, newItem],
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateItemQuantity: (id, quantity) => {
        // Allow temporary 0 values during editing to prevent focus loss
        // Only remove items when quantity is explicitly set to 0 AND confirmed
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
          ),
        }));
      },

      updateItemCost: (id, estimated_cost) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, estimated_cost } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set((state) => ({ isCartOpen: !state.isCartOpen }));
      },

      openCart: () => {
        set({ isCartOpen: true });
      },

      closeCart: () => {
        set({ isCartOpen: false });
      },

      // Computed getters
      getCartSummary: (): CartSummary => {
        const items = get().items;
        
        const summary = items.reduce(
          (acc, item) => {
            acc.totalItems += 1;
            acc.totalQuantity += item.quantity;
            acc.estimatedTotalCost += (item.estimated_cost || 0) * item.quantity;
            
            if (item.type === 'new') {
              acc.newItemsCount += 1;
            } else if (item.type === 'reorder') {
              acc.reorderItemsCount += 1;
            } else if (item.type === 'adjustment') {
              acc.adjustmentItemsCount += 1;
            }
            
            return acc;
          },
          {
            totalItems: 0,
            totalQuantity: 0,
            estimatedTotalCost: 0,
            newItemsCount: 0,
            reorderItemsCount: 0,
            adjustmentItemsCount: 0,
          }
        );

        return summary;
      },

      getNewItems: () => {
        return get().items.filter((item) => item.type === 'new');
      },

      getReorderItems: () => {
        return get().items.filter((item) => item.type === 'reorder');
      },

      getAdjustmentItems: () => {
        return get().items.filter((item) => item.type === 'adjustment');
      },
    }),
    {
      name: 'inventory-cart', // LocalStorage key
      // Only persist items, not UI state like isCartOpen
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Helper functions for cart operations
export const cartHelpers = {
  // Check if an item is already in cart (for reorder items)
  isItemInCart: (inventory_item_id: number): boolean => {
    const items = useCartStore.getState().items;
    return items.some(
      (item) => item.inventory_item_id === inventory_item_id && item.type === 'reorder'
    );
  },

  // Get cart item by inventory_item_id (for reorder items)
  getCartItemByInventoryId: (inventory_item_id: number): CartItem | undefined => {
    const items = useCartStore.getState().items;
    return items.find(
      (item) => item.inventory_item_id === inventory_item_id && item.type === 'reorder'
    );
  },

  // Format currency for display
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  },

  // Generate a descriptive name for cart items
  getItemDisplayName: (item: CartItem): string => {
    if (item.part_number) {
      return `${item.item_name} (${item.part_number})`;
    }
    return item.item_name;
  },
};
