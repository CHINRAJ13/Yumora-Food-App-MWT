import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // Crucial for HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

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
export const updateAdminUserRole = (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role });

export const getAdminCategories = () => api.get("/admin/categories");
export const createAdminCategory = (data: any) => api.post("/admin/categories", data);
export const deleteAdminCategory = (id: string) => api.delete(`/admin/categories/${id}`);

export const getAdminBanners = () => api.get("/admin/banners");
export const createAdminBanner = (data: any) => api.post("/admin/banners", data);
export const deleteAdminBanner = (id: string) => api.delete(`/admin/banners/${id}`);
