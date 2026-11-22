export interface DeliveryDetails {
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  rating?: number;
  totalRatings?: number;
}

export interface DeliveryUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'delivery' | string;
  availability: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  deliveryDetails?: DeliveryDetails;
}

export interface OrderItem {
  id?: string;
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  isVeg?: boolean;
}

export interface OrderLocation {
  lat: number;
  lng: number;
}

export interface DeliveryOrder {
  id: string;
  _id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  restaurantLocation?: OrderLocation;
  address: string;
  phone: string;
  location?: OrderLocation;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee?: number;
  status: 'Placed' | 'Preparing' | 'Ready for Pickup' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  deliveryPersonId?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  estimatedEarnings?: number;
  distance?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DeliveryStats {
  todayEarnings: number;
  todayDeliveries: number;
  totalEarnings: number;
  totalDeliveries: number;
  averageRating: number;
  acceptanceRate?: number;
}
