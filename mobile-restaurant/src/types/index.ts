export interface RestaurantUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'restaurant' | string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'suspended';
  restaurantId?: string;
  restaurant?: RestaurantProfile;
}

export interface RestaurantProfile {
  id: string;
  _id?: string;
  name: string;
  ownerId?: string;
  cuisines: string[];
  image?: string;
  address?: string;
  phone?: string;
  email?: string;
  rating?: number;
  totalRatings?: number;
  deliveryTime?: string;
  priceForTwo?: string | number;
  distance?: string;
  isVeg?: boolean;
  acceptsOrders?: boolean;
  isOpen?: boolean;
}

export interface MenuItem {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  isVeg: boolean;
  isBestseller?: boolean;
  isAvailable?: boolean;
  inStock?: boolean;
}

export interface OrderItem {
  id?: string;
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  isVeg?: boolean;
}

export interface OrderPricing {
  foodSubtotal: number;
  packagingFee: number;
  deliveryFee: number;
  platformFee: number;
  tax: number;
  discount: number;
  totalAmount: number;
}

export interface OrderSettlement {
  commissionRate: number;
  platformCommission: number;
  restaurantAmount: number;
  deliveryPartnerAmount: number;
  platformProfit: number;
  isSettled: boolean;
  settledAt?: string;
}

export type OrderStatus =
  | 'Placed'
  | 'Preparing'
  | 'Ready for Pickup'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface RestaurantOrder {
  id: string;
  _id: string;
  restaurantId: string;
  restaurantName: string;
  customerName?: string;
  userId?: string;
  address: string;
  phone?: string;
  items: OrderItem[];
  totalAmount: number;
  pricing?: OrderPricing;
  settlement?: OrderSettlement;
  paymentMethod: string;
  paymentStatus: string;
  status: OrderStatus;
  deliveryPersonId?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RestaurantStats {
  todayRevenue: number;
  todayOrders: number;
  activeOrders: number;
  totalOrders: number;
  deliveredOrders: number;
  monthlyRevenue: number;
  monthlyOrders: number;
  weeklyRevenue?: number;
  dailyRevenue?: Array<{ _id: string; revenue: number; orders: number }>;
  topItems?: Array<{ name: string; count: number; revenue: number }>;
  restaurant?: RestaurantProfile;
}
