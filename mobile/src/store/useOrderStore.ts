import { create } from 'zustand';
import { CartItem } from './useCartStore';

export interface OrderItem {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  type: 'tester' | 'full';
  quantity: number;
  price: number;
}

export type OrderStatus = 'Confirmed' | 'Preparing' | 'Shipped' | 'Delivered';

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  walletDeduction: number;
  total: number;
  cashbackEarned: number;
  paymentMethod: string;
  status: OrderStatus;
  estimatedDelivery: string;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
}

interface OrderState {
  orders: Order[];
  placeOrder: (params: {
    items: CartItem[];
    subtotal: number;
    walletDeduction: number;
    total: number;
    paymentMethod: string;
    shippingAddress: {
      fullName: string;
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
  }) => Order;
  getOrderById: (id: string) => Order | undefined;
}

// Initial luxury orders for rich experience
const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'TRV-89421',
    date: 'Aug 04, 2026',
    status: 'Delivered',
    subtotal: 950,
    walletDeduction: 0,
    total: 950,
    cashbackEarned: 950,
    paymentMethod: 'UPI (GPay)',
    estimatedDelivery: 'Delivered on Aug 06, 2026',
    shippingAddress: {
      fullName: 'Luxury Member',
      street: '42 Altamount Road, Penthouse B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400026',
    },
    items: [
      {
        id: 'item-1',
        name: 'Baccarat Rouge 540',
        brand: 'Maison Francis Kurkdjian',
        imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop',
        type: 'tester',
        quantity: 1,
        price: 950,
      },
    ],
  },
  {
    id: 'ord-102',
    orderNumber: 'TRV-76219',
    date: 'Jul 28, 2026',
    status: 'Delivered',
    subtotal: 5550,
    walletDeduction: 350,
    total: 5200,
    cashbackEarned: 350,
    paymentMethod: 'Tryvia Black Card',
    estimatedDelivery: 'Delivered on Jul 30, 2026',
    shippingAddress: {
      fullName: 'Luxury Member',
      street: '42 Altamount Road, Penthouse B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400026',
    },
    items: [
      {
        id: 'item-2',
        name: 'Midnight Recovery Cloud Cream',
        brand: 'Kiehls',
        imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop',
        type: 'full',
        quantity: 1,
        price: 5200,
      },
      {
        id: 'item-3',
        name: 'Midnight Recovery Cloud Cream',
        brand: 'Kiehls',
        imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop',
        type: 'tester',
        quantity: 1,
        price: 350,
      },
    ],
  },
];

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: INITIAL_ORDERS,

  placeOrder: ({ items, subtotal, walletDeduction, total, paymentMethod, shippingAddress }) => {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `TRV-${randomSuffix}`;
    const id = `ord-${Date.now()}`;
    
    // Calculate cashback earned from tester purchases
    const testers = items.filter(i => i.type === 'tester');
    const cashbackEarned = testers.reduce((acc, i) => acc + (i.price * i.quantity), 0);

    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(new Date());

    const newOrder: Order = {
      id,
      orderNumber,
      date: formattedDate,
      items: items.map(i => ({
        id: i.id,
        name: i.product.name,
        brand: i.product.brand?.name || 'TRYVIA',
        imageUrl: i.product.image_url || 'https://via.placeholder.com/200',
        type: i.type,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal,
      walletDeduction,
      total,
      cashbackEarned,
      paymentMethod,
      status: 'Confirmed',
      estimatedDelivery: 'Estimated in 2-4 business days',
      shippingAddress,
    };

    set((state) => ({
      orders: [newOrder, ...state.orders],
    }));

    return newOrder;
  },

  getOrderById: (id: string) => {
    return get().orders.find(o => o.id === id || o.orderNumber === id);
  },
}));
