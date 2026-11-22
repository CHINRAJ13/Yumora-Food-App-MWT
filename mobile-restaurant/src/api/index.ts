import api from './client';

// ─── Authentication & Onboarding ───
export const loginRestaurantApi = (data: { email?: string; phone?: string; password: string }) =>
  api.post('/auth/restaurant/login', data);

export const registerRestaurantApi = (formData: FormData) =>
  api.post('/auth/restaurant/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getMeApi = () => api.get('/users/me');

export const logoutApi = () => api.post('/auth/logout');

export const forgotPasswordApi = (data: { email?: string; phone?: string }) =>
  api.post('/auth/forgot-password', data);

export const resetPasswordApi = (token: string, data: any) =>
  api.patch(`/auth/reset-password/${token}`, data);

// ─── Restaurant Dashboard & Operations ───
export const getRestaurantProfileApi = () => api.get('/restaurant-dash/profile');

export const updateRestaurantProfileApi = (formData: FormData) =>
  api.patch('/restaurant-dash/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getRestaurantOrdersApi = (status?: string) =>
  api.get(`/restaurant-dash/orders${status ? `?status=${status}` : ''}`);

export const getRestaurantActiveOrdersApi = () =>
  api.get('/restaurant-dash/orders/active');

export const updateRestaurantOrderStatusApi = (id: string, status: string) =>
  api.patch(`/restaurant-dash/orders/${id}/status`, { status });

export const getRestaurantStatsApi = () => api.get('/restaurant-dash/stats');

export const getRestaurantMenuApi = () => api.get('/restaurant-dash/menu');

export const updateRestaurantMenuApi = (menu: any[]) =>
  api.put('/restaurant-dash/menu', { menu });

export const toggleRestaurantStatusApi = () =>
  api.patch('/restaurant-dash/toggle-status');

export const uploadMenuImageApi = (formData: FormData) =>
  api.post('/restaurant-dash/menu/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ─── Wallet & Payout Operations ───
export const getMyWalletApi = () => api.get('/wallet/my-wallet');

export const requestPayoutApi = (amount: number, bankDetails?: any) =>
  api.post('/wallet/request-payout', { amount, bankDetails });
