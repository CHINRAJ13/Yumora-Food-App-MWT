import api from './client';

// ─── Authentication ───
export const loginDeliveryApi = (data: { email?: string; phone?: string; password: string }) =>
  api.post('/auth/delivery/login', data);

export const registerDeliveryApi = (data: FormData | any) =>
  api.post('/auth/delivery/register', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });

export const getMeApi = () => api.get('/users/me');

export const logoutApi = () => api.post('/auth/logout');

// ─── Rider Duty & Availability ───
export const updateDeliveryStatusApi = (availability: boolean) =>
  api.patch('/delivery/status', { availability });

// ─── Orders & Delivery Operations ───
export const getAvailableOrdersApi = () => api.get('/delivery/available');

export const getMyActiveDeliveriesApi = () => api.get('/delivery/my-active');

export const getMyDeliveryHistoryApi = () => api.get('/delivery/my-history');

export const getDeliveryStatsApi = () => api.get('/delivery/stats');

export const getOrderByIdApi = (id: string) => api.get(`/orders/single/${id}`);

export const acceptDeliveryOrderApi = (id: string) => api.patch(`/delivery/accept/${id}`);

export const pickupDeliveryOrderApi = (id: string) => api.patch(`/delivery/pickup/${id}`);

export const completeDeliveryOrderApi = (id: string) => api.patch(`/delivery/complete/${id}`);

// ─── Wallet & Payout Operations ───
export const getMyWalletApi = () => api.get('/wallet/my-wallet');

export const requestPayoutApi = (amount: number, bankDetails?: any) =>
  api.post('/wallet/request-payout', { amount, bankDetails });

// ─── Road Routing / Navigation Polyline ───
export const getRouteApi = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
) => api.post('/locations/route', { start, end });
