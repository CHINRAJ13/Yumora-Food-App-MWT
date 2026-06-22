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
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import NotFound from "./pages/NotFound";
import DeliveryApprovalStatus from "./pages/DeliveryApprovalStatus";
import Profile from "./pages/Profile";

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
              <Route path="/approval-status" element={<DeliveryApprovalStatus />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute roles={["delivery"]}>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute roles={["delivery"]}>
                    <DeliveryDashboard />
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
