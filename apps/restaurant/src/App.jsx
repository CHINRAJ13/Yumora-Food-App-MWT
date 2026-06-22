import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Login from "./pages/Login";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import NotFound from "./pages/NotFound";
import ApprovalStatus from "./pages/ApprovalStatus";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import AuthLoader from "./components/AuthLoader";

const queryClient = new QueryClient();

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
              <Route path="/approval-status" element={<ApprovalStatus />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute roles={["restaurant"]}>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute roles={["restaurant"]}>
                    <RestaurantDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </AuthLoader>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
