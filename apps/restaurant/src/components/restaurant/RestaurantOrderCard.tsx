import { motion } from "framer-motion";
import { Clock, MapPin, Phone, ChefHat, Package, XCircle, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RestaurantOrderCardProps {
  order: any;
  onUpdateStatus: (orderId: string, status: string) => void;
  isProcessing: boolean;
}

const statusConfig: any = {
  Placed: { color: "blue", label: "New Order", icon: Clock },
  Preparing: { color: "orange", label: "Preparing", icon: ChefHat },
  "Ready for Pickup": { color: "amber", label: "Ready", icon: Package },
  "Out for Delivery": { color: "purple", label: "Out for Delivery", icon: Package },
  Delivered: { color: "emerald", label: "Delivered", icon: Package },
  Cancelled: { color: "red", label: "Cancelled", icon: XCircle },
};

const RestaurantOrderCard = ({ order, onUpdateStatus, isProcessing }: RestaurantOrderCardProps) => {
  const config = statusConfig[order.status] || statusConfig.Placed;
  const StatusIcon = config.icon;
  const timeAgo = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true });

  const getNextAction = () => {
    switch (order.status) {
      case "Placed":
        return { label: "Start Preparing", status: "Preparing", gradient: "from-orange-500 to-amber-500" };
      case "Preparing":
        return { label: "Mark Ready", status: "Ready for Pickup", gradient: "from-emerald-500 to-green-500" };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all ${
        order.status === "Placed" ? "border-blue-200 ring-1 ring-blue-100" : "border-gray-100"
      }`}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-lg bg-${config.color}-50`}>
              <span className={`text-[10px] font-black uppercase tracking-wider text-${config.color}-600`}>
                {config.label}
              </span>
            </div>
            {order.status === "Placed" && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> NEW
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-gray-400">{timeAgo}</span>
        </div>

        {/* Order ID & Amount */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm font-black text-gray-900">
            #{order._id.substring(order._id.length - 8)}
          </span>
          <div className="flex flex-col items-end gap-1">
            <span className="text-lg font-black text-gray-900 leading-none">₹{order.totalAmount}</span>
            <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
              order.paymentMethod === 'cod' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}>
              {order.paymentMethod === 'cod' ? 'COD' : 'PREPAID'}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-gray-50 rounded-xl p-3 mb-3">
          <div className="space-y-1.5">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-sm ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="font-bold text-gray-700">{item.name}</span>
                  <span className="text-gray-300 font-bold">×{item.quantity}</span>
                </div>
                <span className="font-black text-gray-500">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Info */}
        <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold">
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <User className="w-4 h-4 text-gray-400" />
            <span>{order.customerName || order.email || "Customer"}</span>
          </div>
          {order.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>{order.phone}</span>
            </div>
          )}
        </div>
        {order.address && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold mt-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{order.address}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {(nextAction || order.status === "Placed" || order.status === "Preparing") && (
        <div className="flex gap-2 p-4 pt-2 border-t border-gray-50">
          {nextAction && (
            <button
              onClick={() => onUpdateStatus(order._id, nextAction.status)}
              disabled={isProcessing}
              className={`flex-1 py-3 rounded-xl text-sm font-black text-white bg-gradient-to-r ${nextAction.gradient} shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50`}
            >
              {isProcessing ? "Updating..." : nextAction.label}
            </button>
          )}
          {(order.status === "Placed" || order.status === "Preparing") && (
            <button
              onClick={() => onUpdateStatus(order._id, "Cancelled")}
              disabled={isProcessing}
              className="px-4 py-3 rounded-xl text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Delivery info for ready/out orders */}
      {order.deliveryPersonName && (order.status === "Ready for Pickup" || order.status === "Out for Delivery") && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 bg-violet-50 rounded-xl px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
              <Package className="w-3 h-3 text-violet-600" />
            </div>
            <span className="text-xs font-bold text-violet-700">Rider: {order.deliveryPersonName}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RestaurantOrderCard;
