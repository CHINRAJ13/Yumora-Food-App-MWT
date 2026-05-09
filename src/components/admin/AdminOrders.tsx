import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { getAdminOrders, updateAdminOrder } from "@/api";
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
  Eye
} from "lucide-react";

export const StatusBadge = ({ status }: { status: string }) => {
  const configs: any = {
    Placed: { bg: "bg-blue-50", text: "text-blue-600", icon: Clock },
    Preparing: { bg: "bg-orange-50", text: "text-orange-600", icon: ChefHat },
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

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchOrders();

    // Connect to Socket.io (proxied through Vite in dev)
    const socket = io({
      withCredentials: true,
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
    } catch (err) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateAdminOrder(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order._id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
      <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-gray-900">Recent Orders</h2>
        
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
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Order Details</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
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
                      <span className="font-bold text-gray-900 text-sm truncate max-w-[150px]">{order.userId?.name || "Guest User"}</span>
                      <span className="text-[10px] font-medium text-gray-400 mt-0.5 truncate max-w-[150px]">{order.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-black text-gray-900">₹{order.totalAmount}</span>
                  </td>
                  <td className="px-8 py-6">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className="text-[10px] font-black bg-gray-100 border-none rounded-lg px-2 py-1 focus:ring-0 cursor-pointer outline-none"
                      >
                        <option value="Placed">Placed</option>
                        <option value="Preparing">Preparing</option>
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
  );
};

export default AdminOrders;
