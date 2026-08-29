import { create } from "zustand";
import { orderService } from "../api/services/orderService";

export const useOrderStore = create((set, get) => ({
  orders: [],
  isLoading: false,

  fetchOrders: async () => {
    set({ isLoading: true });
    try {
      const backendOrders = await orderService.getOrders();
      if (
        backendOrders &&
        Array.isArray(backendOrders) &&
        backendOrders.length > 0
      ) {
        const mappedOrders = backendOrders.map((bo) => {
          const formattedDate = new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }).format(new Date(bo.created_at));
          const isOrderCod =
            (bo.payment_method || "").toLowerCase().includes("cash") ||
            (bo.payment_method || "").toLowerCase().includes("cod");
          const effectiveStatus =
            isOrderCod && bo.status === "PAID" ? "PENDING" : bo.status;

          return {
            id: bo.id.toString(),
            orderNumber: `TRV-${10000 + bo.id}`,
            date: formattedDate,
            subtotal: bo.subtotal,
            walletDeduction: bo.wallet_discount,
            platformFee: bo.platform_fee,
            total: bo.total_amount,
            status: effectiveStatus,
            paymentMethod:
              bo.payment_method ||
              (isOrderCod ? "Cash on Delivery" : "Tryvia Pay"),
            shippingAddress: bo.shipping_address,
            items: bo.items.map((bi) => ({
              id: bi.product_id.toString(),
              name: bi.product_name || `Product #${bi.product_id}`,
              brand: bi.product_brand || "TRYVIA",
              imageUrl:
                bi.product_image_url ||
                "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80",
              type: bi.item_type.toLowerCase(),
              quantity: bi.quantity,
              price: bi.unit_price,
            })),
          };
        });
        set({ orders: mappedOrders, isLoading: false });
        return;
      }
      set({ isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  placeOrder: async ({
    items,
    paymentMethod,
    apply_wallet_credit_id,
    shippingAddress,
  }) => {
    const isCod =
      paymentMethod.toLowerCase().includes("cash") ||
      paymentMethod.toLowerCase().includes("cod");

    try {
      const { useCartStore } = await import("./useCartStore");
      const orderInputs = items.map((i) => ({
        product_id: i.product.id,
        item_type: i.type,
        quantity: i.quantity,
        unit_price: i.price,
      }));
      const bo = await orderService.createOrder({
        items: orderInputs,
        payment_method: paymentMethod,
        apply_wallet_credit_id,
        use_wallet: useCartStore.getState().walletDeduction > 0,
        shipping_address: shippingAddress || null,
      });
      const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).format(new Date(bo.created_at));
      const effectiveStatus = isCod ? "PENDING" : bo.status || "PAID";

      const newOrder = {
        id: bo.id.toString(),
        orderNumber: `TRV-${10000 + bo.id}`,
        date: formattedDate,
        subtotal: bo.subtotal,
        walletDeduction: bo.wallet_discount,
        platformFee: bo.platform_fee,
        total: bo.total_amount,
        status: effectiveStatus,
        paymentMethod,
        shippingAddress: bo.shipping_address || shippingAddress || undefined,
        items: items.map((i) => ({
          id: i.id,
          name: i.product.name,
          brand: i.product.brand?.name || "TRYVIA",
          imageUrl:
            i.product.image_url ||
            "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80",
          type: i.type,
          quantity: i.quantity,
          price: i.price,
        })),
      };
      set((state) => ({ orders: [newOrder, ...state.orders] }));
      return newOrder;
    } catch (e) {
      const orderId = String(Date.now()).slice(-6);
      const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).format(new Date());

      const fallbackStatus = isCod ? "PENDING" : "PAID";
      const fallbackSubtotal = items.reduce(
        (acc, i) => acc + i.price * i.quantity,
        0,
      );
      const fallbackOrder = {
        id: orderId,
        orderNumber: `TRV-${orderId}`,
        date: formattedDate,
        subtotal: fallbackSubtotal,
        walletDeduction: 0,
        platformFee: 0,
        total: fallbackSubtotal,
        status: fallbackStatus,
        paymentMethod,
        shippingAddress: shippingAddress || undefined,
        items: items.map((i) => ({
          id: String(i.id),
          name: i.product.name,
          brand: i.product.brand?.name || "TRYVIA",
          imageUrl:
            i.product.image_url ||
            "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80",
          type: i.type,
          quantity: i.quantity,
          price: i.price,
        })),
      };

      set((state) => ({ orders: [fallbackOrder, ...state.orders] }));
      return fallbackOrder;
    }
  },

  getOrderById: (id) => {
    return get().orders.find((o) => o.id === id || o.orderNumber === id);
  },
}));
