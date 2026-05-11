import React, { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Index from "./pages/Index";
import Restaurants from "./pages/Restaurants";
import RestaurantDetail from "./pages/RestaurantDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Offers from "./pages/Offers";
import Login from "./pages/Login";
import Tracking from "./pages/Tracking";
import AdminDashboard from "./pages/AdminDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import AuthLoader from "./components/AuthLoader";
import { Loader } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AuthLoader>
          <Toaster />
          <Sonner />
          <HotToaster position="top-center" />
          <HashRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/restaurants" element={<Restaurants />} />
              <Route path="/restaurant/:id" element={<RestaurantDetail />} />
              
              <Route path="/cart" element={<Cart />} />
              
              <Route 
                path="/checkout" 
                element={
                  <ProtectedRoute>
                  <Suspense fallback={<Loader />}>
                    <Checkout />
                  </Suspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tracking/:orderId?" 
                element={
                  <ProtectedRoute>
                    <Tracking />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/delivery" 
                element={
                  <ProtectedRoute roles={["delivery"]}>
                    <DeliveryDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/restaurant" 
                element={
                  <ProtectedRoute roles={["restaurant"]}>
                    <RestaurantDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route path="/offers" element={<Offers />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </AuthLoader>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
