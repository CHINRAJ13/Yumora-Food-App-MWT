import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api",
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const authStorage = localStorage.getItem('yumora-auth');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        if (state.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (e) {
        console.error('Error parsing auth storage', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle standardized backend responses
api.interceptors.response.use(
  (response) => {
    // If backend uses { status: 'success', data: ... }
    return response.data;
  },
  (error) => {
    // Standardized error handling
    const message = error.response?.data?.message || "Something went wrong";

    if (error.response?.status === 401) {
      // Handle unauthorized (clear store/redirect if needed)
      // This will be handled by the Auth store
    }

    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

export default api;

// --- API Service Methods ---

export const getRestaurants = (params?: any) => api.get("/restaurants", { params });
export const getRestaurantById = (id: string) => api.get(`/restaurants/${id}`);
export const getCategories = () => api.get("/categories");
export const getBanners = () => api.get("/banners");

export const registerUser = (data: any) => api.post('/auth/register', data);
export const loginUser = (data: any) => api.post('/auth/login', data);
export const logoutUser = () => api.get('/auth/logout');
export const sendOtp = (phone: string) => api.post('/auth/send-otp', { phone });
export const verifyOtp = (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp });
export const forgotPassword = (data: { email?: string; phone?: string }) => api.post('/auth/forgot-password', data);
export const resetPassword = (token: string, data: any) => api.patch(`/auth/reset-password/${token}`, data);

export const placeOrder = (orderData: any) => api.post('/orders', orderData);
export const getMyOrders = () => api.get('/orders/my-orders');
export const getOrderById = (id: string) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id: string, status: string) => api.patch(`/orders/update/${id}`, { status });

// Admin Methods
export const getAdminStats = () => api.get("/admin/stats");
export const getAdminOrders = () => api.get("/admin/orders");
export const updateAdminOrder = (id: string, status: string) => api.patch(`/admin/orders/${id}`, { status });

export const getAdminRestaurants = () => api.get("/admin/restaurants");
export const createAdminRestaurant = (data: any) => api.post("/admin/restaurants", data);
export const updateAdminRestaurant = (id: string, data: any) => api.put(`/admin/restaurants/${id}`, data);
export const deleteAdminRestaurant = (id: string) => api.delete(`/admin/restaurants/${id}`);

export const getAdminUsers = () => api.get("/admin/users");
export const updateAdminUserRole = (id: string, data: { role: string; restaurantId?: string }) => api.patch(`/admin/users/${id}/role`, data);
export const updateAdminUserStatus = (id: string, status: string) => api.patch(`/admin/users/${id}/status`, { status });

export const getAdminCategories = () => api.get("/admin/categories");
export const createAdminCategory = (data: any) => api.post("/admin/categories", data);
export const deleteAdminCategory = (id: string) => api.delete(`/admin/categories/${id}`);

export const getAdminBanners = () => api.get("/admin/banners");
export const createAdminBanner = (data: any) => api.post("/admin/banners", data);
export const deleteAdminBanner = (id: string) => api.delete(`/admin/banners/${id}`);

// Delivery Person Methods
export const getAvailableOrders = () => api.get("/delivery/available");
export const getMyActiveDeliveries = () => api.get("/delivery/my-active");
export const getMyDeliveryHistory = () => api.get("/delivery/my-history");
export const getDeliveryStats = () => api.get("/delivery/stats");
export const acceptDeliveryOrder = (id: string) => api.patch(`/delivery/accept/${id}`);
export const pickupDeliveryOrder = (id: string) => api.patch(`/delivery/pickup/${id}`);
export const completeDeliveryOrder = (id: string) => api.patch(`/delivery/complete/${id}`);

// Admin - Delivery assignment
export const assignDeliveryPerson = (orderId: string, deliveryPersonId: string) =>
  api.patch(`/admin/orders/${orderId}/assign`, { deliveryPersonId });
export const getDeliveryPersons = () => api.get("/admin/delivery-persons");

// Restaurant Dashboard Methods
export const getRestaurantProfile = () => api.get("/restaurant-dash/profile");
export const getRestaurantOrders = (status?: string) => api.get(`/restaurant-dash/orders${status ? `?status=${status}` : ''}`);
export const getRestaurantActiveOrders = () => api.get("/restaurant-dash/orders/active");
export const updateRestaurantOrderStatus = (id: string, status: string) => api.patch(`/restaurant-dash/orders/${id}/status`, { status });
export const getRestaurantStats = () => api.get("/restaurant-dash/stats");
export const getRestaurantMenu = () => api.get("/restaurant-dash/menu");
export const updateRestaurantMenu = (menu: any[]) => api.put("/restaurant-dash/menu", { menu });
export const toggleRestaurantStatus = () => api.patch("/restaurant-dash/toggle-status");
export const uploadMenuImage = (formData: FormData) => api.post("/restaurant-dash/menu/upload", formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateRestaurantProfile = (formData: FormData) => api.patch("/restaurant-dash/profile", formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// User Profile Methods
export const getUserProfile = () => api.get("/users/me");
export const updateUserProfile = (data: { name?: string; email?: string; phone?: string }) => api.patch("/users/updateMe", data);
