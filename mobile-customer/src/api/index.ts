import api from './client';

export const getRestaurants = (params?: any) => api.get('/restaurants', { params });
export const getRestaurantById = (id: string) => api.get(`/restaurants/${id}`);
export const getCategories = () => api.get('/categories');
export const getBanners = () => api.get('/banners');

export const loginApi = (credentials: { email: string; password: string }) =>
  api.post('/auth/customer/login-email', credentials);

export const sendOtpApi = (data: { phone: string }) =>
  api.post('/auth/customer/send-otp', data);

export const verifyOtpApi = (data: { phone: string; otp: string }) =>
  api.post('/auth/customer/verify-otp', data);

export const registerApi = (userData: { name: string; email: string; password: string; phone?: string }) =>
  api.post('/auth/customer/register', userData);

export const createOrderApi = (orderData: any) => api.post('/orders', orderData);
export const getUserOrdersApi = () => api.get('/orders/my-orders');
export const getOrderByIdApi = (orderId: string) => api.get(`/orders/single/${orderId}`);
export const cancelOrderApi = (orderId: string, reason?: string) =>
  api.post(`/orders/${orderId}/cancel`, { reason });

export const reverseGeocodeAddressApi = (lat: number, lng: number) =>
  api.post('/locations/address', { lat, lng });

export const getRouteApi = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) =>
  api.post('/locations/route', { start, end });

export const createRazorpayOrderApi = (amount: number) =>
  api.post('/payment/create-order', { amount });

export const verifyRazorpayPaymentApi = (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => api.post('/payment/verify', data);


