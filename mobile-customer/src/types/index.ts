export interface MenuItem {
  id: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVeg: boolean;
  isBestseller?: boolean;
}

export interface Restaurant {
  id: string;
  _id?: string;
  name: string;
  image: string;
  cuisines: string[];
  rating: number;
  deliveryTime: string;
  priceForTwo: number;
  distance: string;
  address: string;
  isVeg: boolean;
  offer?: string;
  menu: MenuItem[];
  acceptsOrders?: boolean;
  availability?: boolean;
  isActive?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}
