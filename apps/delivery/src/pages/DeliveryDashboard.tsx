import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Package, Clock, History, RefreshCw, LogOut, MapPin as MapPinIcon } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import DeliveryStats from "@/components/delivery/DeliveryStats";
import DeliveryOrderCard from "@/components/delivery/DeliveryOrderCard";
import DeliveryActiveOrder from "@/components/delivery/DeliveryActiveOrder";
import * as api from "@/api";
import { socketService } from "@/services/socket";
import { useAuthStore } from "@/store/useAuthStore";

type Tab = "available" | "active" | "history";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "available", label: "Available", icon: Package },
  { id: "active", label: "Active", icon: Bike },
  { id: "history", label: "History", icon: History },
];

const DeliveryDashboard = () => {
  const { user, setUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") as Tab;
  const isValidTab = tabs.some(t => t.id === urlTab);
  const activeTab = isValidTab ? urlTab : "available";

  const setActiveTab = (tabId: Tab) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [trackingOrderIds, setTrackingOrderIds] = useState<Set<string>>(new Set());
  const watchIdsRef = useRef<Map<string, number>>(new Map());

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [availableRes, activeRes, historyRes, statsRes]: any[] = await Promise.all([
        api.getAvailableOrders(),
        api.getMyActiveDeliveries(),
        api.getMyDeliveryHistory(),
        api.getDeliveryStats(),
      ]);

      if (availableRes.status === "success") setAvailableOrders(availableRes.data);
      if (activeRes.status === "success") setActiveDeliveries(activeRes.data);
      if (historyRes.status === "success") setDeliveryHistory(historyRes.data);
      if (statsRes.status === "success") setStats(statsRes.data);
    } catch (err: any) {
      console.error("Delivery fetch error:", err);
      toast.error(err.message || "Failed to fetch delivery data");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleAvailability = async () => {
    if (!user) return;
    try {
      setProcessing('availability');
      const newAvailability = !user.availability;
      await api.updateDeliveryStatus(newAvailability);
      // Optimistically update the auth store without extra fetch
      setUser({ ...user, availability: newAvailability });
      toast.success('Availability updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update availability');
    } finally {
      setProcessing(null);
    }
  };

  // Initial Data & Socket setup
  useEffect(() => {
    fetchData();

    const socket = socketService.connect();
    socketService.joinDeliveryRoom();

    // New order available for pickup
    socketService.onNewAvailableOrder((order) => {
      setAvailableOrders((prev) => {
        if (prev.find((o) => o._id === order._id)) return prev;
        toast.success("🔔 New order available for pickup!", { duration: 5000 });
        return [order, ...prev];
      });
    });

    // Another rider took an order
    socketService.onOrderTaken(({ orderId }) => {
      setAvailableOrders((prev) => prev.filter((o) => o._id !== orderId));
    });

    return () => {
      socketService.offDeliveryEvents();
    };
  }, [fetchData]);

  // Auto-resume tracking for picked-up orders
  useEffect(() => {
    activeDeliveries.forEach((order) => {
      if (order.pickedUpAt && order.status !== "Delivered" && !trackingOrderIds.has(order._id)) {
        startLocationTracking(order._id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeliveries]);

  const startLocationTracking = (orderId: string) => {
    socketService.joinTracking(orderId);
    setTrackingOrderIds((prev) => new Set(prev).add(orderId));

    if (navigator.geolocation) {
      // Immediate ping
      navigator.geolocation.getCurrentPosition(
        (position) => {
          socketService.emitLocationUpdate(orderId, position.coords.latitude, position.coords.longitude);
        },
        (err) => console.error("Initial GPS error:", err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

      // Continuous tracking
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          socketService.emitLocationUpdate(orderId, position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.error("Geolocation error:", err);
          toast.error("Location access denied. Please enable GPS.");
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
      watchIdsRef.current.set(orderId, watchId);
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  const handleAccept = async (orderId: string) => {
    setProcessing(orderId);
    try {
      const res: any = await api.acceptDeliveryOrder(orderId);
      if (res.status === "success") {
        toast.success("Order accepted! Head to the restaurant.");
        setAvailableOrders((prev) => prev.filter((o) => o._id !== orderId));
        setActiveDeliveries((prev) => [res.data, ...prev]);
        setActiveTab("active");
        fetchData(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to accept order");
    } finally {
      setProcessing(null);
    }
  };

  const handlePickup = async (orderId: string) => {
    setProcessing(orderId);
    try {
      const res: any = await api.pickupDeliveryOrder(orderId);
      if (res.status === "success") {
        toast.success("Pickup confirmed! Live tracking started.");
        setActiveDeliveries((prev) =>
          prev.map((o) => (o._id === orderId ? res.data : o))
        );

        // Start live location broadcasting
        startLocationTracking(orderId);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm pickup");
    } finally {
      setProcessing(null);
    }
  };

  const handleComplete = async (orderId: string) => {
    setProcessing(orderId);
    try {
      const res: any = await api.completeDeliveryOrder(orderId);
      if (res.status === "success") {
        toast.success("🎉 Delivery completed! Great job!");
        setActiveDeliveries((prev) => prev.filter((o) => o._id !== orderId));
        setDeliveryHistory((prev) => [res.data, ...prev]);
        fetchData(false);

        // Stop GPS broadcasting
        const watchId = watchIdsRef.current.get(orderId);
        if (watchId !== undefined) {
          navigator.geolocation.clearWatch(watchId);
          watchIdsRef.current.delete(orderId);
        }
        setTrackingOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to complete delivery");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Delivery Hub
            </h1>
            <p className="text-sm font-medium text-gray-400 mt-0.5">
              Welcome back, <span className="text-primary font-bold">{user?.name || "Rider"}</span>
            </p>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-primary hover:shadow-md transition-all active:scale-95 border border-gray-100"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
                    {user?.roles?.includes("delivery") && user?.status !== "rejected" && user?.status !== "suspended" && (
            <button
              onClick={handleToggleAvailability}
              disabled={processing === 'availability'}
              className={`p-3 rounded-2xl shadow-sm transition-all active:scale-95 border border-gray-100 ${processing === 'availability' ? 'opacity-50 cursor-not-allowed' : ''} ${user?.availability ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-800' : 'bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800'}`}
              title={user?.availability ? 'Go Offline' : 'Go Online'}
            >
              {user?.availability ? 'Online' : 'Offline'}
            </button>
          )}
        </div>

        {/* Live Tracking Indicator */}
        {trackingOrderIds.size > 0 && (
          <div className="mb-4 bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-200 rounded-2xl p-3 flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
            </span>
            <p className="text-sm font-bold text-violet-700">
              📍 Live Tracking Active — Sharing your location with {trackingOrderIds.size} order{trackingOrderIds.size > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8">
          <DeliveryStats stats={stats} loading={loading} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white/80 backdrop-blur-xl rounded-2xl p-1.5 border border-gray-100 shadow-sm">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const count =
              tab.id === "available" ? availableOrders.length :
                tab.id === "active" ? activeDeliveries.length :
                  deliveryHistory.length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all relative ${isActive
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="delivery-tab-bg"
                    className={`absolute inset-0 rounded-xl ${tab.id === "available" ? "bg-gradient-to-r from-orange-500 to-amber-500" :
                      tab.id === "active" ? "bg-gradient-to-r from-blue-500 to-violet-500" :
                        "bg-gradient-to-r from-emerald-500 to-green-500"
                      } shadow-lg`}
                    transition={{ type: "spring", duration: 0.4 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
                {count > 0 && (
                  <span className={`relative z-10 text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${isActive ? "bg-white/25" : "bg-gray-100 text-gray-500"
                    }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {/* Available Orders */}
            {activeTab === "available" && (
              <div>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white/70 rounded-2xl animate-pulse h-48" />
                    ))}
                  </div>
                ) : availableOrders.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="No Available Orders"
                    desc="New orders will appear here when restaurants finish preparing them."
                    color="orange"
                  />
                ) : (
                  <div className="space-y-4">
                    {availableOrders.map((order) => (
                      <DeliveryOrderCard
                        key={order._id}
                        order={order}
                        type="available"
                        onAccept={handleAccept}
                        isProcessing={processing === order._id}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active Deliveries */}
            {activeTab === "active" && (
              <div>
                {loading ? (
                  <div className="bg-white/70 rounded-2xl animate-pulse h-96" />
                ) : activeDeliveries.length === 0 ? (
                  <EmptyState
                    icon={Bike}
                    title="No Active Deliveries"
                    desc="Accept an available order to start delivering!"
                    color="blue"
                  />
                ) : (
                  <div className="space-y-6">
                    {activeDeliveries.map((order) => (
                      <DeliveryActiveOrder
                        key={order._id}
                        order={order}
                        onPickup={handlePickup}
                        onComplete={handleComplete}
                        isProcessing={processing === order._id}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Delivery History */}
            {activeTab === "history" && (
              <div>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white/70 rounded-2xl animate-pulse h-40" />
                    ))}
                  </div>
                ) : deliveryHistory.length === 0 ? (
                  <EmptyState
                    icon={History}
                    title="No Delivery History"
                    desc="Your completed deliveries will appear here."
                    color="emerald"
                  />
                ) : (
                  <div className="space-y-4">
                    {deliveryHistory.map((order) => (
                      <DeliveryOrderCard
                        key={order._id}
                        order={order}
                        type="history"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Empty state component
const EmptyState = ({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-24 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/30 shadow-lg"
  >
    <div className={`w-20 h-20 rounded-3xl bg-${color}-50 flex items-center justify-center mx-auto mb-5`}>
      <Icon className={`w-10 h-10 text-${color}-300`} />
    </div>
    <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-400 font-medium text-sm max-w-xs mx-auto">{desc}</p>
  </motion.div>
);

export default DeliveryDashboard;
