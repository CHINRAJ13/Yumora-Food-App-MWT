import { motion } from "framer-motion";
import { MapPin, Package, IndianRupee, Phone, ChefHat, Truck, CheckCircle2, Navigation } from "lucide-react";

interface DeliveryActiveOrderProps {
  order: any;
  onPickup: (orderId: string) => void;
  onComplete: (orderId: string) => void;
  isProcessing: boolean;
}

const DELIVERY_STEPS = [
  { id: "accepted", label: "Order Accepted", icon: CheckCircle2, desc: "You accepted this order" },
  { id: "pickup", label: "Pick Up", icon: ChefHat, desc: "Head to the restaurant" },
  { id: "delivering", label: "Delivering", icon: Truck, desc: "On the way to customer" },
  { id: "delivered", label: "Delivered", icon: CheckCircle2, desc: "Order completed" },
];

const DeliveryActiveOrder = ({ order, onPickup, onComplete, isProcessing }: DeliveryActiveOrderProps) => {
  const getCurrentStep = () => {
    if (order.status === "Delivered") return 3;
    if (order.pickedUpAt) return 2;
    if (order.assignedAt) return 1;
    return 0;
  };

  const currentStep = getCurrentStep();
  const itemCount = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/30 shadow-2xl overflow-hidden"
    >
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-blue-500 via-violet-500 to-purple-600 p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Active Delivery</p>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase">
              #{order._id?.toString().substring(order._id.toString().length - 6)}
            </div>
          </div>
          <h2 className="text-2xl font-black">{order.restaurantName || "Yumora Kitchen"}</h2>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1 bg-white/15 backdrop-blur-md rounded-lg px-2.5 py-1.5">
              <Package className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{itemCount} items</span>
            </div>
            <div className="flex items-center gap-1 bg-white/15 backdrop-blur-md rounded-lg px-2.5 py-1.5">
              <IndianRupee className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{order.totalAmount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stepper */}
        <div className="relative mb-8 px-2">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100 rounded-full" />
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(0, (currentStep / (DELIVERY_STEPS.length - 1)) * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute left-5 top-0 w-0.5 bg-gradient-to-b from-blue-500 to-violet-500 rounded-full z-10"
          />

          <div className="space-y-8 relative z-20">
            {DELIVERY_STEPS.map((step, index) => {
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center gap-5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4 border-white shadow-lg ${
                    isCompleted
                      ? "bg-gradient-to-br from-blue-500 to-violet-500 text-white"
                      : "bg-gray-100 text-gray-300"
                  }`}>
                    <Icon className={`w-4 h-4 ${isCurrent ? "animate-pulse" : ""}`} />
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

        {/* Customer Address */}
        <div className="bg-gray-50/80 rounded-2xl p-4 mb-4 border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Customer Address</p>
                {order.location?.lat && (
                  <span className="bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">GPS Fixed</span>
                )}
              </div>
              <p className="text-xs font-bold text-gray-700 mt-0.5">{order.address || "N/A"}</p>
            </div>
            <button 
              onClick={() => {
                const url = order.location?.lat 
                  ? `https://www.google.com/maps/search/?api=1&query=${order.location.lat},${order.location.lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`;
                window.open(url, "_blank");
              }}
              className="bg-blue-50 p-2.5 rounded-xl hover:bg-blue-100 transition-colors shadow-sm active:scale-90"
              title="Navigate to Customer"
            >
              <Navigation className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        </div>

        {/* Customer Contact */}
        {order.phone && (
          <div className="bg-gray-50/80 rounded-2xl p-4 mb-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl shadow-sm">
                <Phone className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Customer Phone</p>
                <p className="text-xs font-bold text-gray-700 mt-0.5">{order.phone}</p>
              </div>
              <a
                href={`tel:${order.phone}`}
                className="bg-emerald-50 px-4 py-2 rounded-xl text-emerald-600 text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                Call
              </a>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!order.pickedUpAt && order.status !== "Delivered" && (
            <button
              onClick={() => onPickup(order._id)}
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-black text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ChefHat className="w-4 h-4" />
                  Confirm Pickup from Restaurant
                </>
              )}
            </button>
          )}

          {order.pickedUpAt && order.status !== "Delivered" && (
            <button
              onClick={() => onComplete(order._id)}
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-black text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Delivered
                </>
              )}
            </button>
          )}
        </div>

        {/* Order Items Accordion */}
        <details className="mt-4 group">
          <summary className="cursor-pointer text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
            <span>View order items ({itemCount})</span>
          </summary>
          <div className="mt-3 space-y-2 pl-2">
            {order.items?.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs font-bold text-gray-700">{item.name}</span>
                <span className="text-xs text-gray-400">x{item.quantity || 1}</span>
              </div>
            ))}
          </div>
        </details>
      </div>
    </motion.div>
  );
};

export default DeliveryActiveOrder;
