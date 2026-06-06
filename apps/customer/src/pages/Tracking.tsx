import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import * as api from "@/api";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { ChefHat, Truck, CheckCircle2, Package, ArrowLeft, Timer, MapPin, RefreshCw, Bike, User, Navigation } from "lucide-react";
import { socketService } from "@/services/socket";
import { toast } from "sonner";
import LiveTrackingMap from "@/components/LiveTrackingMap";

const Tracking = () => {
  const { orderId } = useParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [singleOrder, setSingleOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchTrackingData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      if (orderId) {
        const res: any = await api.getOrderById(orderId);
        if (res.status === 'success') {
          setSingleOrder(res.data);
        }
      } else {
        const res: any = await api.getMyOrders();
        if (res.status === 'success') {
          // Filter only active orders for general tracking page
          setOrders(res.data.filter((o: any) => o.status !== "Delivered" && o.status !== "Cancelled"));
        }
      }
    } catch (err) {
      console.error("Tracking Error:", err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchTrackingData();

    // Connect to Socket
    const socket = socketService.connect();

    if (orderId) {
      socketService.joinOrder(orderId);
    }

    socketService.onOrderStatusUpdate(({ status, data }) => {
      console.log("Real-time update received:", status, data);

      if (orderId && data._id === orderId) {
        setSingleOrder(data);
        toast.info(`Order status updated to: ${status}`);
      } else {
        setOrders(prev => prev.map(o => o._id === data._id ? data : o));
        toast.info(`Order ${data._id.substring(0, 6)} updated: ${status}`);
      }
    });

    return () => {
      socketService.offOrderStatusUpdate();
      // We don't disconnect globally because other parts might use it, 
      // but in this specific app, it's fine.
    };
  }, [orderId, fetchTrackingData]);

  return (
    <div className="min-h-screen bg-secondary/30 pb-20 lg:pb-0">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <Link to="/orders" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-black text-gray-900">Live Tracking</h1>
          <button
            onClick={() => fetchTrackingData()}
            className="p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-orange-500 hover:shadow-md transition-all active:scale-95"
            title="Refresh Tracking"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {orderId ? (
          singleOrder ? (
            <EnhancedTrackingCard order={singleOrder} />
          ) : (
            <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-3xl border border-white/20">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 font-bold">Locating your order...</p>
            </div>
          )
        ) : orders.length === 0 && !loading ? (
          <div className="text-center py-32 bg-white/50 backdrop-blur-md rounded-3xl border border-white/20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Orders</h3>
            <p className="text-gray-500 mb-8 px-8">You don't have any active orders to track right now.</p>
            <Link to="/restaurants" className="gradient-primary text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg">
              Start Ordering
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => <EnhancedTrackingCard key={order._id} order={order} />)}
          </div>
        )}
      </div>
    </div>
  );
};

const STEPS = [
  { id: "Placed", label: "Confirmed", icon: CheckCircle2, desc: "Order received" },
  { id: "Preparing", label: "Preparing", icon: ChefHat, desc: "Chef is cooking" },
  { id: "Ready for Pickup", label: "Ready", icon: Package, desc: "Waiting for rider" },
  { id: "Out for Delivery", label: "On the Way", icon: Truck, desc: "Rider is nearby" },
  { id: "Delivered", label: "Delivered", icon: CheckCircle2, desc: "Enjoy your meal" },
];

const EnhancedTrackingCard = ({ order }: { order: any }) => {
  const currentStepIndex = STEPS.findIndex(s => s.id === order.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl border border-white/20 overflow-hidden relative mb-6"
    >
      {/* Header Info */}
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <h2 className="text-xl font-black text-gray-900">{order.restaurantName || "Crave Kitchen"}</h2>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest mt-1 uppercase">ID: #{order._id?.toString().substring(order._id?.toString().length - 6)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            {order.status}
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold mt-1">
            <Timer className="w-3 h-3" />
            <span>25-35 MINS</span>
          </div>
        </div>
      </div>

      {/* Stepper UI */}
      <div className="relative mb-8 px-2">
        {/* Progress Line Background */}
        <div className="absolute left-6 top-0 bottom-0 w-1 bg-gray-100 rounded-full" />

        {/* Active Progress Line */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${Math.max(0, (currentStepIndex / (STEPS.length - 1)) * 100)}%` }}
          className="absolute left-6 top-0 w-1 bg-primary rounded-full z-10 transition-all duration-1000"
        />

        <div className="space-y-10 relative z-20">
          {STEPS.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-start gap-6">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-4 border-white shadow-xl ${isCompleted ? "bg-primary text-white" : "bg-gray-100 text-gray-300"
                  }`}>
                  <Icon className={`w-4 h-4 ${isCurrent ? "animate-bounce" : ""}`} />
                </div>
                <div>
                  <h4 className={`text-sm font-black transition-colors ${isCompleted ? "text-gray-900" : "text-gray-300"}`}>
                    {step.label}
                  </h4>
                  <p className={`text-[10px] font-bold ${isCompleted ? "text-gray-500" : "text-gray-300"}`}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery Person Info */}
      {order.deliveryPersonName && (
        <div className="bg-violet-50/50 rounded-2xl p-4 border border-violet-100 mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <Bike className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Your Rider</p>
              <p className="text-xs font-bold text-violet-700 mt-0.5">{order.deliveryPersonName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Live Tracking Map — visible when order is out for delivery */}
      {order.status === "Out for Delivery" && (
        <div className="mb-3">
          <LiveTrackingMap orderId={order._id} orderLocation={order.location} />
        </div>
      )}

      {/* Address & Delivery Info */}
      <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
        <div className="flex items-start gap-3">
          <div className="bg-white p-2 rounded-xl shadow-sm">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Delivery Address</p>
            <p className="text-xs font-bold text-gray-700 mt-0.5 line-clamp-1">{order.address}</p>
          </div>
          {order.location?.lat && (
            <button
              onClick={() => {
                const url = `https://www.google.com/maps/search/?api=1&query=${order.location.lat},${order.location.lng}`;
                window.open(url, "_blank");
              }}
              className="bg-primary/5 p-2 rounded-xl text-primary hover:bg-primary/10 transition-all"
              title="View on Map"
            >
              <Navigation className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl p-1" />
    </motion.div>
  );
};

export default Tracking;
