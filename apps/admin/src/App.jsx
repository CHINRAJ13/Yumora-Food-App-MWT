import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, Navigate, useSearchParams } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";

// Public & Profile Pages
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Admin Shell & Separate Pages
import AdminLayout from "./components/admin/AdminLayout";
import OverviewPage from "./pages/admin/OverviewPage";
import OrdersPage from "./pages/admin/OrdersPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import DeliveryPricingPage from "./pages/admin/DeliveryPricingPage";
import RestaurantsPage from "./pages/admin/RestaurantsPage";
import UsersPage from "./pages/admin/UsersPage";
import ApprovalsPage from "./pages/admin/ApprovalsPage";
import CatalogPage from "./pages/admin/CatalogPage";
import AdminManagementPage from "./pages/admin/AdminManagementPage";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import AuthLoader from "./components/AuthLoader";

const queryClient = new QueryClient();

const TAB_TO_PATH = {
  overview: "/overview",
  orders: "/orders",
  payments: "/payments",
  pricing: "/delivery-pricing",
  restaurants: "/restaurants",
  users: "/users",
  approvals: "/approvals",
  catalog: "/catalog",
  admins: "/admins",
};

const AdminLegacyRedirect = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const target = (tab && TAB_TO_PATH[tab]) || "/overview";
  return <Navigate to={target} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AuthLoader>
          <Toaster />
          <Sonner />
          <HotToaster position="top-center" />
          <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Legacy root & /admin redirects (supports ?tab=... bookmarks) */}
              <Route path="/" element={<AdminLegacyRedirect />} />
              <Route path="/admin" element={<AdminLegacyRedirect />} />

              {/* Persistent Admin Sidebar Layout with Separate Pages */}
              <Route
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/overview" element={<OverviewPage />} />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute requiredRole="admin" permission="monitor_orders">
                      <OrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <ProtectedRoute requiredRole="admin" permission="monitor_payments">
                      <PaymentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/delivery-pricing"
                  element={
                    <ProtectedRoute requiredRole="admin" permission="monitor_payments">
                      <DeliveryPricingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/restaurants"
                  element={
                    <ProtectedRoute requiredRole="admin" permission="manage_restaurants">
                      <RestaurantsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute requiredRole="admin" permission="manage_users">
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/approvals"
                  element={
                    <ProtectedRoute requiredRole="admin" permission="manage_approvals">
                      <ApprovalsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/catalog"
                  element={
                    <ProtectedRoute requiredRole="admin" permission="manage_catalog">
                      <CatalogPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admins"
                  element={
                    <ProtectedRoute requiredRole="admin" permission="super_admin">
                      <AdminManagementPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </AuthLoader>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
