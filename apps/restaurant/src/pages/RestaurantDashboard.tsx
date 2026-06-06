import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Clock, UtensilsCrossed, BarChart3, RefreshCw, Settings } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import RestaurantStats from "@/components/restaurant/RestaurantStats";
import RestaurantOrderCard from "@/components/restaurant/RestaurantOrderCard";
import RestaurantMenuEditor from "@/components/restaurant/RestaurantMenuEditor";
import RestaurantRevenueChart from "@/components/restaurant/RestaurantRevenueChart";
import RestaurantProfileEditor from "@/components/restaurant/RestaurantProfileEditor";
import * as api from "@/api";
import { socketService } from "@/services/socket";
import { useAuthStore } from "@/store/useAuthStore";

type Tab = "orders" | "history" | "menu" | "revenue" | "settings";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "orders", label: "Live Orders", icon: ShoppingBag },
  { id: "history", label: "History", icon: Clock },
  { id: "menu", label: "Menu", icon: UtensilsCrossed },
  { id: "revenue", label: "Revenue", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

const RestaurantDashboard = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [savingMenu, setSavingMenu] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [activeRes, statsRes, menuRes]: any[] = await Promise.all([
        api.getRestaurantActiveOrders(),
        api.getRestaurantStats(),
        api.getRestaurantMenu(),
      ]);
      if (activeRes.status === "success") setActiveOrders(activeRes.data);
      if (statsRes.status === "success") {
        setStats(statsRes.data);
        setRestaurant(statsRes.data.restaurant);
      }
      if (menuRes.status === "success") setMenuItems(menuRes.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res: any = await api.getRestaurantOrders();
      if (res.status === "success") setAllOrders(res.data);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
  }, [activeTab, fetchHistory]);

  // Socket setup
  useEffect(() => {
    if (!restaurant?.id) return;
    const socket = socketService.connect();
    socketService.joinRestaurantRoom(restaurant.id);

    socketService.onNewRestaurantOrder((order) => {
      setActiveOrders((prev) => {
        if (prev.find((o) => o._id === order._id)) return prev;
        toast.success("🔔 New order received!", { duration: 5000 });
        return [order, ...prev];
      });
      fetchData(false);
    });

    socketService.onRestaurantOrderUpdated(({ orderId, status, data }) => {
      setActiveOrders((prev) =>
        status === "Out for Delivery" || status === "Delivered" || status === "Cancelled"
          ? prev.filter((o) => o._id !== orderId)
          : prev.map((o) => (o._id === orderId ? { ...o, status, ...data } : o))
      );
    });

    return () => { socketService.offRestaurantEvents(); };
  }, [restaurant?.id, fetchData]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setProcessing(orderId);
    try {
      const res: any = await api.updateRestaurantOrderStatus(orderId, status);
      if (res.status === "success") {
        toast.success(`Order marked as ${status}`);
        if (status === "Cancelled" || status === "Ready for Pickup") {
          setActiveOrders((prev) => status === "Cancelled" ? prev.filter((o) => o._id !== orderId) : prev.map((o) => o._id === orderId ? res.data : o));
        } else {
          setActiveOrders((prev) => prev.map((o) => (o._id === orderId ? res.data : o)));
        }
        fetchData(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setProcessing(null);
    }
  };

  const handleSaveMenu = async (menu: any[]) => {
    setSavingMenu(true);
    try {
      const res: any = await api.updateRestaurantMenu(menu);
      if (res.status === "success") {
        setMenuItems(res.data);
        toast.success("Menu saved!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save menu");
    } finally {
      setSavingMenu(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const res: any = await api.toggleRestaurantStatus();
      if (res.status === "success") {
        setRestaurant((prev: any) => ({ ...prev, acceptsOrders: res.data.acceptsOrders }));
        toast.success(res.data.acceptsOrders ? "Restaurant is now Online!" : "Restaurant is now Offline");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {restaurant?.name || "Restaurant Dashboard"}
            </h1>
            <p className="text-sm font-medium text-gray-400 mt-0.5">
              Manage orders, menu & revenue
            </p>
          </div>
          <button onClick={() => fetchData()} disabled={loading} className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-primary hover:shadow-md transition-all border border-gray-100">
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <RestaurantStats stats={stats} loading={loading} isOnline={restaurant?.acceptsOrders ?? true} onToggleStatus={handleToggleStatus} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white/80 backdrop-blur-xl rounded-2xl p-1.5 border border-gray-100 shadow-sm">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const count = tab.id === "orders" ? activeOrders.length : undefined;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all relative ${isActive ? "text-white" : "text-gray-400 hover:text-gray-600"}`}>
                {isActive && (
                  <motion.div layoutId="rest-tab-bg" className={`absolute inset-0 rounded-xl ${
                    tab.id === "orders" ? "bg-gradient-to-r from-orange-500 to-amber-500" :
                    tab.id === "history" ? "bg-gradient-to-r from-blue-500 to-indigo-500" :
                    tab.id === "menu" ? "bg-gradient-to-r from-violet-500 to-purple-500" :
                    tab.id === "revenue" ? "bg-gradient-to-r from-emerald-500 to-green-500" :
                    "bg-gradient-to-r from-gray-700 to-gray-900"
                  } shadow-lg`} transition={{ type: "spring", duration: 0.4 }} />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                {count !== undefined && count > 0 && (
                  <span className={`relative z-10 text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${isActive ? "bg-white/25" : "bg-gray-100 text-gray-500"}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
            {activeTab === "orders" && (
              <div>
                {loading ? (
                  <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-white/70 rounded-2xl animate-pulse h-48" />)}</div>
                ) : activeOrders.length === 0 ? (
                  <EmptyState icon={ShoppingBag} title="No Active Orders" desc="New orders will appear here in real-time." color="orange" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeOrders.map((order) => (
                      <RestaurantOrderCard key={order._id} order={order} onUpdateStatus={handleUpdateStatus} isProcessing={processing === order._id} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div>
                {allOrders.length === 0 ? (
                  <EmptyState icon={Clock} title="No Order History" desc="Your completed orders will appear here." color="blue" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allOrders.map((order) => (
                      <RestaurantOrderCard key={order._id} order={order} onUpdateStatus={handleUpdateStatus} isProcessing={processing === order._id} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "menu" && (
              <RestaurantMenuEditor menu={menuItems} onSave={handleSaveMenu} saving={savingMenu} />
            )}

            {activeTab === "revenue" && (
              <RestaurantRevenueChart dailyRevenue={stats?.dailyRevenue || []} topItems={stats?.topItems || []} stats={stats} />
            )}

            {activeTab === "settings" && restaurant && (
              <RestaurantProfileEditor restaurant={restaurant} onUpdate={(updated) => setRestaurant(updated)} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, desc, color }: any) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/30 shadow-lg">
    <div className={`w-20 h-20 rounded-3xl bg-${color}-50 flex items-center justify-center mx-auto mb-5`}>
      <Icon className={`w-10 h-10 text-${color}-300`} />
    </div>
    <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-400 font-medium text-sm max-w-xs mx-auto">{desc}</p>
  </motion.div>
);

export default RestaurantDashboard;
