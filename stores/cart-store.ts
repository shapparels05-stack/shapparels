import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  image: string;
  price: number;
  compareAtPrice: number | null;
  variantLabel: string | null;
  quantity: number;
  maxStock?: number;
  // Bundle / special-offer lines: mark the item and carry the offer id +
  // component product ids so checkout can deduct each product's stock.
  isBundle?: boolean;
  offerId?: string;
  bundleProductIds?: string[];
};

type CartStore = {
  items: CartItem[];
  isSheetOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  openSheet: () => void;
  closeSheet: () => void;
  setSheetOpen: (open: boolean) => void;
};

const getCartKey = (productId: string, variantId: string | null) =>
  `${productId}-${variantId ?? "default"}`;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isSheetOpen: false,

      addItem: (item) => {
        set((state) => {
          const key = getCartKey(item.productId, item.variantId);
          const existing = state.items.find(
            (i) => getCartKey(i.productId, i.variantId) === key
          );

          if (existing) {
            const newQty = existing.quantity + (item.quantity ?? 1);
            const capped =
              item.maxStock !== undefined
                ? Math.min(newQty, item.maxStock)
                : newQty;
            return {
              items: state.items.map((i) =>
                getCartKey(i.productId, i.variantId) === key
                  ? { ...i, quantity: capped, maxStock: item.maxStock ?? i.maxStock }
                  : i
              ),
            };
          }

          const qty = item.quantity ?? 1;
          const capped =
            item.maxStock !== undefined ? Math.min(qty, item.maxStock) : qty;
          return {
            items: [...state.items, { ...item, quantity: capped }],
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) =>
              getCartKey(i.productId, i.variantId) !==
              getCartKey(productId, variantId)
          ),
        }));
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => {
            if (
              getCartKey(i.productId, i.variantId) !==
              getCartKey(productId, variantId)
            )
              return i;
            const capped =
              i.maxStock !== undefined ? Math.min(quantity, i.maxStock) : quantity;
            return { ...i, quantity: capped };
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      openSheet: () => set({ isSheetOpen: true }),
      closeSheet: () => set({ isSheetOpen: false }),
      setSheetOpen: (open) => set({ isSheetOpen: open }),
    }),
    {
      name: "sh-apparels-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
