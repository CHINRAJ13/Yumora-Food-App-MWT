import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminRestaurants from "@/components/admin/AdminRestaurants";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminApprovals from "@/components/admin/AdminApprovals";
import AdminCatalog from "@/components/admin/AdminCatalog";
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
  Bell,
  ShieldCheck
} from "lucide-react";
import AdminManagement from "@/components/admin/AdminManagement";

type Tab = "overview" | "orders" | "restaurants" | "users" | "approvals" | "catalog" | "admins";

const ALL_TABS: { id: Tab; label: string; icon: any; permission?: string }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 }, // visible to all by default
  { id: "orders", label: "Orders", icon: ShoppingBag, permission: 'monitor_orders' },
  { id: "restaurants", label: "Restaurants", icon: ChefHat, permission: 'manage_restaurants' },
  { id: "users", label: "Users", icon: Users, permission: 'manage_users' },
  { id: "approvals", label: "Approvals", icon: ShieldAlert, permission: 'manage_approvals' },
  { id: "catalog", label: "Catalog", icon: Tag, permission: 'manage_catalog' },
  { id: "admins", label: "Admins", icon: ShieldCheck, permission: 'super_admin' },
];

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const userPermissions = user?.permissions || [];
  const isSuperAdmin = userPermissions.includes('super_admin');

  const tabs = ALL_TABS.filter(tab => {
    if (isSuperAdmin) return true;
    if (!tab.permission) return true;
    return userPermissions.includes(tab.permission);
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") as Tab;
  const isValidTab = tabs.some(t => t.id === urlTab);
  const activeTab = isValidTab ? urlTab : tabs[0]?.id || "overview";
  
  const setActiveTab = (tabId: Tab) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const canViewApprovals = isSuperAdmin || userPermissions.includes('manage_users') || userPermissions.includes('manage_approvals');

  useEffect(() => {
    if (canViewApprovals) {
      fetchPendingCount();
      // Refresh count every 2 minutes
      const interval = setInterval(fetchPendingCount, 120000);
      return () => clearInterval(interval);
    }
  }, [canViewApprovals]);

  const fetchPendingCount = async () => {
    try {
      const res = await api.getAdminUsers();
      const count = res.data.filter((u: any) => u.status === 'pending').length;
      setPendingCount(count);
    } catch (err) {
      console.error("Failed to fetch pending count", err);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverview />;
      case "orders":
        return <AdminOrders />;
      case "restaurants":
        return <AdminRestaurants />;
      case "users":
        return <AdminUsers />;
      case "approvals":
        return <AdminApprovals />;
      case "catalog":
        return <AdminCatalog />;
      case "admins":
        return <AdminManagement />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Navbar />

      <div className="flex">
        {/* ── Sidebar (Desktop) ── */}
        <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-72px)] bg-white border-r border-gray-100 py-8 px-4 sticky top-[72px]">
          <div className="mb-8 px-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-300">
              Admin Panel
            </h2>
          </div>

          <nav className="flex-1 space-y-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 relative ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-primary/10 rounded-2xl"
                      transition={{ type: "spring", duration: 0.4 }}
                    />
                  )}
                  <tab.icon className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                  
                  {tab.id === "approvals" && pendingCount > 0 && (
                    <span className="ml-auto relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white shadow-lg shadow-orange-200 animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="px-4 pt-6 border-t border-gray-100 mt-4">
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Back to App
            </button>
          </div>
        </aside>

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
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="flex-1">{tab.label}</span>
                  {tab.id === "approvals" && pendingCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white shadow-lg shadow-orange-200">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
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
              <h1 className="text-xl font-black text-gray-900 capitalize">
                {activeTab}
              </h1>
            </div>
          </div>

          {/* Desktop header */}
          <header className="hidden lg:block mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight capitalize">
              {activeTab === "overview" ? "Dashboard Overview" : activeTab}
            </h1>
            <p className="text-gray-400 font-medium text-sm mt-1">
              Manage your delivery platform operations
            </p>
          </header>

          {/* Tab content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
