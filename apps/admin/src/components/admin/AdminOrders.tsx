import { useState, useEffect, useRef, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { getAdminOrders, updateAdminOrder, getDeliveryPersons, assignDeliveryPerson } from "@/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Truck,
  ChefHat,
  Search,
  Filter,
  Eye,
  Bike,
  Package,
  Timer,
  AlertTriangle,
  Activity
} from "lucide-react";

const getOrderDurationInfo = (order: any, nowMs: number) => {
  const createdMs = order?.createdAt ? new Date(order.createdAt).getTime() : nowMs;
  const estMins = order?.estimatedDeliveryMinutes || 35;
  const isDelivered = order?.status === "Delivered";
  const isCancelled = order?.status === "Cancelled";
  const isActive = !isDelivered && !isCancelled;

  // Stage breakdown in minutes
  const prepMins = order?.readyForPickupAt
    ? Math.max(1, Math.round((new Date(order.readyForPickupAt).getTime() - createdMs) / 60000))
    : null;
  const waitMins =
    order?.readyForPickupAt && order?.pickedUpAt
      ? Math.max(
          0,
          Math.round(
            (new Date(order.pickedUpAt).getTime() - new Date(order.readyForPickupAt).getTime()) /
              60000
          )
        )
      : null;
  const transitMins =
    order?.pickedUpAt && isDelivered && order?.deliveredAt
      ? Math.max(
          1,
          Math.round(
            (new Date(order.deliveredAt).getTime() - new Date(order.pickedUpAt).getTime()) / 60000
          )
        )
      : null;

  if (isDelivered) {
    const deliveredMs = order?.deliveredAt
      ? new Date(order.deliveredAt).getTime()
      : order?.updatedAt
      ? new Date(order.updatedAt).getTime()
      : nowMs;
    const totalMins =
      order?.actualDeliveryMinutes || Math.max(1, Math.round((deliveredMs - createdMs) / 60000));
    return {
      isActive: false,
      isDelivered: true,
      isCancelled: false,
      totalMins,
      estMins,
      slaState: totalMins > estMins ? "breached" : "ontime",
      display: `${totalMins}m total`,
      prepMins,
      waitMins,
      transitMins,
    };
  }

  if (isCancelled) {
    const cancelledMs = order?.cancellation?.cancelledAt
      ? new Date(order.cancellation.cancelledAt).getTime()
      : order?.updatedAt
      ? new Date(order.updatedAt).getTime()
      : nowMs;
    const totalMins = Math.max(1, Math.round((cancelledMs - createdMs) / 60000));
    return {
      isActive: false,
      isDelivered: false,
      isCancelled: true,
      totalMins,
      estMins,
      slaState: "cancelled",
      display: `Stopped @ ${totalMins}m`,
      prepMins,
      waitMins,
      transitMins,
    };
  }

  const elapsedSec = Math.max(0, Math.floor((nowMs - createdMs) / 1000));
  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;
  const ratio = mins / estMins;
  const slaState = ratio >= 1 ? "breached" : ratio >= 0.75 ? "warning" : "normal";

  return {
    isActive,
    isDelivered: false,
    isCancelled: false,
    totalMins: mins,
    estMins,
    slaState,
    display: `${mins}m ${String(secs).padStart(2, "0")}s`,
    prepMins,
    waitMins,
    transitMins,
  };
};

export const StatusBadge = ({ status }: { status: string }) => {
  const configs: any = {
    Placed: { bg: "bg-blue-50", text: "text-blue-600", icon: Clock },
    Preparing: { bg: "bg-orange-50", text: "text-orange-600", icon: ChefHat },
    "Ready for Pickup": { bg: "bg-amber-50", text: "text-amber-600", icon: Package },
    "Out for Delivery": { bg: "bg-purple-50", text: "text-purple-600", icon: Truck },
    Delivered: { bg: "bg-emerald-50", text: "text-emerald-600", icon: CheckCircle2 },
    Cancelled: { bg: "bg-red-50", text: "text-red-600", icon: XCircle },
  };

  const config = configs[status] || configs.Placed;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3" />
      <span className="text-[10px] font-black uppercase tracking-wider">{status}</span>
    </div>
  );
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState<"all" | "active" | "warning" | "breached">("all");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [deliveryPersons, setDeliveryPersons] = useState<any[]>([]);
  const [assigningOrder, setAssigningOrder] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Single 1-second global ticker for active orders
  useEffect(() => {
    const hasActive = orders.some((o) => !["Delivered", "Cancelled"].includes(o.status));
    if (!hasActive) return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [orders]);

  useEffect(() => {
    fetchOrders();
    fetchDeliveryPersons();

    // Connect to Socket.io
    const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"]
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Admin] Socket connected:', socket.id);
      socket.emit('join_admin');
    });

    // Real-time: new order placed
    socket.on('new_order', (order: any) => {
      setOrders((prev) => [order, ...prev]);
      toast.info('🔔 New order received!', { duration: 5000 });
    });

    // Real-time: order status changed
    socket.on('order_updated', ({ orderId, status, data }: any) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status, ...data } : o))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders();
      setOrders(res.data);
      console.log(res.data)
    } catch (err) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryPersons = async () => {
    try {
      const res: any = await getDeliveryPersons();
      if (res.status === 'success') setDeliveryPersons(res.data);
    } catch (err) {
      console.error('Failed to fetch delivery persons');
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (newStatus === "Cancelled") {
      const confirmCancel = window.confirm(
        "Are you sure you want to cancel this order? This will immediately process an online refund for the customer and notify all parties."
      );
      if (!confirmCancel) return;
    }

    try {
      await updateAdminOrder(orderId, newStatus);
      if (newStatus === "Cancelled") {
        toast.success("Order cancelled and refund processed!");
      } else {
        toast.success(`Order status updated to ${newStatus}`);
      }
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleAssignRider = async (orderId: string, deliveryPersonId: string) => {
    if (!deliveryPersonId) return;
    setAssigningOrder(orderId);
    try {
      await assignDeliveryPerson(orderId, deliveryPersonId);
      toast.success('Rider assigned successfully!');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign rider');
    } finally {
      setAssigningOrder(null);
    }
  };

  const slaMetrics = useMemo(() => {
    const delivered = orders.filter((o) => o.status === "Delivered");
    const active = orders.filter((o) => !["Delivered", "Cancelled"].includes(o.status));

    let totalDeliveryMins = 0;
    let onTimeCount = 0;
    delivered.forEach((o) => {
      const info = getOrderDurationInfo(o, nowMs);
      totalDeliveryMins += info.totalMins;
      if (info.slaState === "ontime") onTimeCount += 1;
    });

    let activeWarningCount = 0;
    let activeBreachedCount = 0;
    active.forEach((o) => {
      const info = getOrderDurationInfo(o, nowMs);
      if (info.slaState === "warning") activeWarningCount += 1;
      if (info.slaState === "breached") activeBreachedCount += 1;
    });

    const avgFulfillmentMins = delivered.length > 0 ? (totalDeliveryMins / delivered.length).toFixed(1) : "—";
    const onTimeRate = delivered.length > 0 ? Math.round((onTimeCount / delivered.length) * 100) : 100;

    return {
      avgFulfillmentMins,
      onTimeRate,
      activeCount: active.length,
      activeWarningCount,
      activeBreachedCount,
    };
  }, [orders, nowMs]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    let matchesSla = true;
    if (slaFilter !== "all") {
      const info = getOrderDurationInfo(order, nowMs);
      if (slaFilter === "active") matchesSla = info.isActive;
      if (slaFilter === "warning") matchesSla = info.isActive && info.slaState === "warning";
      if (slaFilter === "breached") matchesSla = info.slaState === "breached";
    }

    return matchesSearch && matchesStatus && matchesSla;
  });

  return (
    <div className="space-y-6">
      {/* SLA & Delivery Duration KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-primary flex items-center justify-center">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Avg Delivery Time</p>
            <p className="text-xl font-black text-gray-900">
              {slaMetrics.avgFulfillmentMins !== "—" ? `${slaMetrics.avgFulfillmentMins} mins` : "—"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">SLA On-Time Rate</p>
            <p className="text-xl font-black text-emerald-700">{slaMetrics.onTimeRate}%</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSlaFilter(slaFilter === "active" ? "all" : "active")}
          className={`text-left rounded-3xl p-5 border shadow-sm flex items-center gap-4 transition-all ${
            slaFilter === "active"
              ? "bg-blue-50 border-blue-300"
              : "bg-white border-gray-100 hover:border-blue-200"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Active In Pipeline</p>
            <p className="text-xl font-black text-gray-900">{slaMetrics.activeCount}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSlaFilter(slaFilter === "breached" ? "all" : "breached")}
          className={`text-left rounded-3xl p-5 border shadow-sm flex items-center gap-4 transition-all ${
            slaFilter === "breached"
              ? "bg-red-50 border-red-300"
              : "bg-white border-gray-100 hover:border-red-200"
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            slaMetrics.activeBreachedCount > 0 ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-50 text-gray-400"
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">SLA Breached</p>
            <p className={`text-xl font-black ${slaMetrics.activeBreachedCount > 0 ? "text-red-600" : "text-gray-900"}`}>
              {slaMetrics.activeBreachedCount} active
            </p>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900">Recent Orders & SLA Monitor</h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {([
                { id: "all", label: "All Orders" },
                { id: "active", label: "Active Only" },
                { id: "warning", label: `At Risk (${slaMetrics.activeWarningCount})` },
                { id: "breached", label: "SLA Breached" },
              ] as const).map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSlaFilter(pill.id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                    slaFilter === pill.id
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search order ID or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all w-64 font-medium"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-gray-600 focus:ring-0 cursor-pointer outline-none"
            >
              <option value="all">All Status</option>
              <option value="Placed">Placed</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready for Pickup">Ready for Pickup</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 text-left">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Order Details</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Duration & SLA</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Rider</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <motion.tr 
                  key={order._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-gray-50/30 transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-sm">#{order._id.substring(order._id.length - 8)}</span>
                      <span className="text-[10px] font-medium text-gray-400 mt-0.5">
                        {format(new Date(order.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-sm truncate max-w-[150px]">{order.customerName || "Guest User"}</span>
                      <span className="text-[10px] font-medium text-gray-400 mt-0.5 truncate max-w-[150px]">{order.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="font-black text-gray-900">₹{order.totalAmount}</span>
                    {order.deliveryDistanceKm && (
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5">{order.deliveryDistanceKm} km</p>
                    )}
                  </td>
                  <td className="px-6 py-6">
                    {(() => {
                      const dur = getOrderDurationInfo(order, nowMs);
                      return (
                        <div className="space-y-1">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                              dur.slaState === "breached"
                                ? `bg-red-100 text-red-700 ${dur.isActive ? "animate-pulse" : ""}`
                                : dur.slaState === "warning"
                                ? "bg-amber-100 text-amber-800"
                                : dur.slaState === "cancelled"
                                ? "bg-gray-100 text-gray-500"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            <Timer className="w-3 h-3" />
                            <span className="font-mono">{dur.display}</span>
                            {dur.isActive && <span className="opacity-70">/ {dur.estMins}m</span>}
                          </div>
                          {(dur.prepMins !== null || dur.waitMins !== null || dur.transitMins !== null) && (
                            <p className="text-[9px] font-bold text-gray-400 whitespace-nowrap">
                              {dur.prepMins !== null ? `Prep ${dur.prepMins}m` : ""}
                              {dur.waitMins !== null ? ` • Wait ${dur.waitMins}m` : ""}
                              {dur.transitMins !== null ? ` • Transit ${dur.transitMins}m` : ""}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-6">
                    {order.deliveryPersonName ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                          <Bike className="w-3 h-3 text-violet-600" />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{order.deliveryPersonName}</span>
                      </div>
                    ) : (
                      <div>
                        {(order.status === 'Ready for Pickup' || order.status === 'Preparing') && deliveryPersons.length > 0 ? (
                          <select
                            onChange={(e) => handleAssignRider(order._id, e.target.value)}
                            disabled={assigningOrder === order._id}
                            className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-2 py-1 cursor-pointer outline-none"
                            defaultValue=""
                          >
                            <option value="" disabled>Assign Rider</option>
                            {deliveryPersons.map((dp: any) => (
                              <option key={dp._id} value={dp._id}>{dp.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-300">—</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-6">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2">
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className="text-[10px] font-black bg-gray-100 border-none rounded-lg px-2 py-1 focus:ring-0 cursor-pointer outline-none"
                      >
                        <option value="Placed">Placed</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        
        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-20">
            <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">No orders found matching your criteria</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default AdminOrders;
