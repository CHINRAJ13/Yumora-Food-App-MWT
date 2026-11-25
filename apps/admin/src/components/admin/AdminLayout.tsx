import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import * as api from "@/api";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import {
  BarChart3,
  ShoppingBag,
  ChefHat,
  Users,
  Tag,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  MapPin,
} from "lucide-react";

export interface AdminNavItem {
  id: string;
  path: string;
  label: string;
  subtitle: string;
  icon: any;
  permission?: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: "overview",
    path: "/overview",
    label: "Overview",
    subtitle: "Platform metrics, revenue trends, and live operations snapshot",
    icon: BarChart3,
  },
  {
    id: "orders",
    path: "/orders",
    label: "Orders",
    subtitle: "Live order pipeline, rider assignment, and SLA duration monitor",
    icon: ShoppingBag,
    permission: "monitor_orders",
  },
  {
    id: "payments",
    path: "/payments",
    label: "Payments",
    subtitle: "Transactions, refunds, settlement splits, and partner payouts",
    icon: CreditCard,
    permission: "monitor_payments",
  },
  {
    id: "pricing",
    path: "/delivery-pricing",
    label: "Delivery Pricing",
    subtitle: "Configure distance-based fee slabs, promos, and surge rules",
    icon: MapPin,
    permission: "monitor_payments",
  },
  {
    id: "restaurants",
    path: "/restaurants",
    label: "Restaurants",
    subtitle: "Manage partner kitchens, menus, verification, and availability",
    icon: ChefHat,
    permission: "manage_restaurants",
  },
  {
    id: "users",
    path: "/users",
    label: "Users",
    subtitle: "Manage customers, delivery riders, and account status",
    icon: Users,
    permission: "manage_users",
  },
  {
    id: "approvals",
    path: "/approvals",
    label: "Approvals",
    subtitle: "Review KYC documents and onboard new partners",
    icon: ShieldAlert,
    permission: "manage_approvals",
  },
  {
    id: "catalog",
    path: "/catalog",
    label: "Catalog",
    subtitle: "Manage food categories and home screen promotional banners",
    icon: Tag,
    permission: "manage_catalog",
  },
  {
    id: "admins",
    path: "/admins",
    label: "Admins",
    subtitle: "Manage admin accounts and granular role permissions",
    icon: ShieldCheck,
    permission: "super_admin",
  },
];

const AdminLayout = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const userPermissions = user?.permissions || [];
  const isSuperAdmin = userPermissions.includes("super_admin");

  const visibleNavItems = ADMIN_NAV_ITEMS.filter((item) => {
    if (isSuperAdmin) return true;
    if (!item.permission) return true;
    return userPermissions.includes(item.permission);
  });

  const activeItem =
    visibleNavItems.find((item) => location.pathname === item.path) || visibleNavItems[0];

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingPayoutCount, setPendingPayoutCount] = useState(0);

  const canViewApprovals =
    isSuperAdmin ||
    userPermissions.includes("manage_users") ||
    userPermissions.includes("manage_approvals");
  const canViewPayments = isSuperAdmin || userPermissions.includes("monitor_payments");

  useEffect(() => {
    if (canViewApprovals) {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 120000);
      return () => clearInterval(interval);
    }
  }, [canViewApprovals]);

  useEffect(() => {
    if (canViewPayments) {
      fetchPendingPayoutCount();
      const interval = setInterval(fetchPendingPayoutCount, 120000);
      return () => clearInterval(interval);
    }
  }, [canViewPayments]);

  const fetchPendingPayoutCount = async () => {
    try {
      const res = await api.getAdminPayouts("pending");
      setPendingPayoutCount(res.data?.length || 0);
    } catch {
      // ignore
    }
  };

  const fetchPendingCount = async () => {
    try {
      const res = await api.getAdminUsers();
      const count = res.data.filter((u: any) => u.status === "pending").length;
      setPendingCount(count);
    } catch (err) {
      console.error("Failed to fetch pending count", err);
    }
  };

  const renderBadge = (id: string) => {
    if (id === "approvals" && pendingCount > 0) {
      return (
        <span className="ml-auto relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white shadow-lg shadow-orange-200 animate-pulse">
          {pendingCount}
        </span>
      );
    }
    if (id === "payments" && pendingPayoutCount > 0) {
      return (
        <span className="ml-auto relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white shadow-lg shadow-amber-200 animate-pulse">
          {pendingPayoutCount}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* ── Sidebar (Desktop - Fixed 100vh) ── */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 w-64 h-screen bg-white border-r border-gray-100 py-6 px-4 z-40">
        <div className="mb-6 px-4 shrink-0 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-md">
            <span className="text-white font-black text-base">Y</span>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-800">
              Admin Panel
            </h2>
            <p className="text-[10px] font-bold text-orange-500">Yumora PRO</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 relative ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-primary/10 rounded-2xl"
                      transition={{ type: "spring", duration: 0.4 }}
                    />
                  )}
                  <item.icon className="w-5 h-5 relative z-10 shrink-0" />
                  <span className="relative z-10">{item.label}</span>
                  {renderBadge(item.id)}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-2 pt-4 border-t border-gray-100 mt-3 shrink-0">
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Back to App
          </button>
        </div>
      </aside>

      {/* Right Content Area (Navbar + Main shifted right on desktop) */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar />

        {/* ── Mobile sidebar overlay ── */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          className={`lg:hidden fixed inset-y-0 left-0 w-64 bg-white z-50 transform transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } shadow-2xl flex flex-col py-8 px-4`}
        >
          <div className="flex items-center justify-between mb-8 px-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-300">
              Admin Panel
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <nav className="flex-1 space-y-1.5">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {renderBadge(item.id)}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 py-8 px-4 md:px-8 lg:px-10 pb-24">
          {/* Mobile header */}
          <div className="flex items-center gap-4 lg:hidden mb-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">
                {activeItem?.label || "Admin Panel"}
              </h1>
            </div>
          </div>

          {/* Desktop header */}
          <header className="hidden lg:block mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              {activeItem?.id === "overview" ? "Dashboard Overview" : activeItem?.label || "Admin"}
            </h1>
            <p className="text-gray-400 font-medium text-sm mt-1">
              {activeItem?.subtitle || "Manage your delivery platform operations"}
            </p>
          </header>

          {/* Page Route Content */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
