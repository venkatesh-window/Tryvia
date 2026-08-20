import { create } from 'zustand';
import { CartItem } from './useCartStore';
import { orderService, OrderItemInput } from '../api/services/orderService';

export interface OrderItem {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  type: 'tester' | 'full';
  quantity: number;
  price: number;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  walletDeduction: number;
  platformFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
}

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  fetchOrders: () => Promise<void>;
  placeOrder: (params: {
    items: CartItem[];
    paymentMethod: string;
    apply_wallet_credit_id?: number | null;
  }) => Promise<Order | null>;
  getOrderById: (id: string) => Order | undefined;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  isLoading: false,

  fetchOrders: async () => {
    set({ isLoading: true });
    try {
      const backendOrders = await orderService.getOrders();
      const mappedOrders: Order[] = backendOrders.map(bo => {
        const formattedDate = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }).format(new Date(bo.created_at));
        
        return {
          id: bo.id.toString(),
          orderNumber: `TRV-${10000 + bo.id}`,
          date: formattedDate,
          subtotal: bo.subtotal,
          walletDeduction: bo.wallet_discount,
          platformFee: bo.platform_fee,
          total: bo.total_amount,
          status: bo.status as OrderStatus,
          paymentMethod: 'Tryvia Pay', // Mock
          items: bo.items.map((bi: any) => ({
            id: bi.product_id.toString(),
            name: bi.product_name || `Product #${bi.product_id}`,
            brand: bi.product_brand || 'TRYVIA',
            imageUrl: bi.product_image_url || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
            type: bi.item_type.toLowerCase() as 'tester' | 'full',
            quantity: bi.quantity,
            price: bi.unit_price
          }))
        };
      });
      set({ orders: mappedOrders, isLoading: false });
    } catch (e) {
      console.log('Error fetching orders', e);
      set({ isLoading: false });
    }
  },

  placeOrder: async ({ items, paymentMethod, apply_wallet_credit_id }) => {
    try {
      const orderInputs: OrderItemInput[] = items.map(i => ({
        product_id: i.product.id,
        item_type: i.type,
        quantity: i.quantity,
        unit_price: i.price
      }));
      
      const bo = await orderService.createOrder({
        items: orderInputs,
        apply_wallet_credit_id
      });
      
      // Map to frontend order format (for immediate UI response)
      const formattedDate = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).format(new Date(bo.created_at));
      
      const newOrder: Order = {
        id: bo.id.toString(),
        orderNumber: `TRV-${10000 + bo.id}`,
        date: formattedDate,
        subtotal: bo.subtotal,
        walletDeduction: bo.wallet_discount,
        platformFee: bo.platform_fee,
        total: bo.total_amount,
        status: bo.status as OrderStatus,
        paymentMethod,
        items: items.map(i => ({
          id: i.id,
          name: i.product.name,
          brand: i.product.brand?.name || 'TRYVIA',
          imageUrl: i.product.image_url || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
          type: i.type,
          quantity: i.quantity,
          price: i.price
        }))
      };
      
      set(state => ({ orders: [newOrder, ...state.orders] }));
      
      // Update wallet balance across app if needed
      // (This usually triggered by components watching wallet/orders)
      
      return newOrder;
    } catch (e) {
      console.log('Error placing order:', e);
      return null;
    }
  },

  getOrderById: (id: string) => {
    return get().orders.find(o => o.id === id || o.orderNumber === id);
  },
}));
