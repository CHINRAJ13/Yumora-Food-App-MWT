import { motion } from "framer-motion";
import { MapPin, Package, IndianRupee, Clock, ChevronRight } from "lucide-react";

interface DeliveryOrderCardProps {
  order: any;
  type: "available" | "active" | "history";
  onAccept?: (orderId: string) => void;
  onPickup?: (orderId: string) => void;
  onComplete?: (orderId: string) => void;
  isProcessing?: boolean;
}

const DeliveryOrderCard = ({ order, type, onAccept, onPickup, onComplete, isProcessing }: DeliveryOrderCardProps) => {
  const itemCount = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;
  const timeAgo = getTimeAgo(order.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      layout
      className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
    >
      {/* Status stripe */}
      <div className={`h-1.5 w-full ${
        type === "available" ? "bg-gradient-to-r from-amber-400 to-orange-500" :
        type === "active" ? "bg-gradient-to-r from-blue-400 to-violet-500" :
        "bg-gradient-to-r from-emerald-400 to-green-500"
      }`} />

      <div className="p-5">
        {/* Top row - Order ID + Time */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              type === "available" ? "bg-orange-50" :
              type === "active" ? "bg-blue-50" :
              "bg-emerald-50"
            }`}>
              <Package className={`w-4 h-4 ${
                type === "available" ? "text-orange-500" :
                type === "active" ? "text-blue-500" :
                "text-emerald-500"
              }`} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-900">
                #{order._id?.toString().substring(order._id.toString().length - 6).toUpperCase()}
              </p>
              <p className="text-[10px] font-bold text-gray-400">{timeAgo}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            type === "available" ? "bg-amber-50 text-amber-600" :
            type === "active" ? "bg-blue-50 text-blue-600" :
            "bg-emerald-50 text-emerald-600"
          }`}>
            {order.status}
          </div>
        </div>

        {/* Items summary */}
        <div className="flex items-center gap-3 mb-3 bg-gray-50/80 rounded-xl p-3">
          <div className="flex -space-x-2">
            {order.items?.slice(0, 3).map((item: any, i: number) => (
              <div key={i} className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-white flex items-center justify-center">
                <span className="text-xs">🍔</span>
              </div>
            ))}
            {order.items?.length > 3 && (
              <div className="w-8 h-8 rounded-lg bg-gray-200 border-2 border-white flex items-center justify-center">
                <span className="text-[10px] font-bold text-gray-500">+{order.items.length - 3}</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-700">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </p>
            <p className="text-[10px] text-gray-400 line-clamp-1">
              {order.items?.map((i: any) => i.name).join(", ")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-0.5">
              <IndianRupee className="w-3.5 h-3.5 text-gray-900" />
              <span className="text-sm font-black text-gray-900">{order.totalAmount}</span>
            </div>
            {order.paymentMethod === 'cod' ? (
              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">COD</span>
            ) : (
              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">PREPAID</span>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Deliver to</p>
            <p className="text-xs font-bold text-gray-700 line-clamp-2 mt-0.5">{order.address || "No address provided"}</p>
          </div>
        </div>

        {/* Action buttons */}
        {type === "available" && onAccept && (
          <button
            onClick={() => onAccept(order._id)}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-orange-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Accept Order
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}

        {type === "active" && (
          <div className="flex gap-2">
            {!order.pickedUpAt && onPickup && (
              <button
                onClick={() => onPickup(order._id)}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Confirm Pickup"
                )}
              </button>
            )}
            {order.pickedUpAt && onComplete && (
              <button
                onClick={() => onComplete(order._id)}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Mark Delivered ✓"
                )}
              </button>
            )}
          </div>
        )}

        {type === "history" && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-400">
                {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                }) : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-emerald-500">
              <IndianRupee className="w-3 h-3" />
              <span className="text-xs font-black">+{Math.round(order.totalAmount * 0.15)}</span>
              <span className="text-[10px] font-bold text-gray-400 ml-1">earned</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

function getTimeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default DeliveryOrderCard;
