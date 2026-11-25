import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  ChefHat,
  MapPin,
  Package,
  ReceiptText,
  RotateCcw,
  Star,
  Timer,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LiveTrackingMap from "@/components/LiveTrackingMap";
import { DeliveryCountdownTimer } from "@/components/DeliveryCountdownTimer";
import { socketService } from "@/services/socket";

const STEPS = [
  { id: "Placed", label: "Confirmed", icon: CheckCircle2, desc: "Order received" },
  { id: "Preparing", label: "Preparing", icon: ChefHat, desc: "Chef is cooking" },
  { id: "Ready for Pickup", label: "Ready", icon: Package, desc: "Waiting for rider" },
  { id: "Out for Delivery", label: "On the Way", icon: Truck, desc: "Rider is nearby" },
  { id: "Delivered", label: "Delivered", icon: CheckCircle2, desc: "Enjoy your meal" },
];

interface UnifiedOrderDetailPanelProps {
  order: any;
  onCancel: (orderId: string) => void;
  cancellingId: string | null;
  onReorder: (order: any) => void;
  onReview: (order: any) => void;
  onMobileBack?: () => void;
}

export const UnifiedOrderDetailPanel = ({
  order,
  onCancel,
  cancellingId,
  onReorder,
  onReview,
  onMobileBack,
}: UnifiedOrderDetailPanelProps) => {
  const [liveETA, setLiveETA] = useState<string | null>(null);
  const [liveDistance, setLiveDistance] = useState<string | null>(null);

  useEffect(() => {
    setLiveETA(null);
    setLiveDistance(null);
    if (!order?._id || order.status !== "Out for Delivery") return;

    const socket = socketService.connect();
    const handleLocation = (data: any) => {
      if (data.orderId === order._id) {
        if (data.eta) setLiveETA(data.eta);
        if (data.distance) setLiveDistance(data.distance);
      }
    };

    socket.on("location-updated", handleLocation);
    return () => {
      socket.off("location-updated", handleLocation);
    };
  }, [order?._id, order?.status]);

  if (!order) return null;

  const isCancelled = order.status === "Cancelled";
  const isDelivered = order.status === "Delivered";
  const currentStepIndex = STEPS.findIndex((s) => s.id === order.status);

  const foodSubtotal =
    order.pricing?.foodSubtotal !== undefined
      ? order.pricing.foodSubtotal
      : (order.items || []).reduce(
          (sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
          0
        );
  const packagingFee = order.pricing?.packagingFee !== undefined ? order.pricing.packagingFee : 20;
  const deliveryFee = order.pricing?.deliveryFee !== undefined ? order.pricing.deliveryFee : 30;
  const platformFee = order.pricing?.platformFee !== undefined ? order.pricing.platformFee : 5;
  const tax =
    order.pricing?.tax !== undefined
      ? order.pricing.tax
      : Math.round((foodSubtotal + packagingFee) * 0.05);

  return (
    <motion.div
      key={order._id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden"
    >
      {/* Mobile Back Bar */}
      {onMobileBack && (
        <div className="lg:hidden px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          <button
            type="button"
            onClick={onMobileBack}
            className="flex items-center gap-1.5 text-xs font-black text-gray-700 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            All Orders
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="p-6 pb-5 border-b border-gray-100 bg-gradient-to-r from-orange-50/60 via-white to-white flex flex-wrap justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-black text-gray-900">{order.restaurantName || "Yumora Kitchen"}</h2>
          </div>
          <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mt-1">
            Order #{order._id?.toString().slice(-8).toUpperCase()} •{" "}
            {new Date(order.createdAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              isDelivered
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isCancelled
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-orange-50 text-orange-700 border-orange-200"
            }`}
          >
            {order.status}
          </span>
          {!isCancelled && !isDelivered && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
              <Timer className="w-3 h-3" />
              Est. ~{order.estimatedDeliveryMinutes || 35} mins
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 1. Live Countdown Timer / Completion Duration */}
        <DeliveryCountdownTimer order={order} liveETA={liveETA} liveDistance={liveDistance} />

        {/* 2. 5-Stage Progress Stepper (Active & Delivered) */}
        {!isCancelled && (
          <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
              Live Order Progress
            </p>
            <div className="grid grid-cols-5 gap-2 relative">
              {STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const Icon = step.icon;

                return (
                  <div key={step.id} className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border-2 border-white shadow-md ${
                        isCurrent
                          ? "bg-primary text-white ring-4 ring-primary/15"
                          : isCompleted
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isCurrent && !isDelivered ? "animate-pulse" : ""}`} />
                    </div>
                    <p
                      className={`text-[11px] font-black mt-2 leading-tight ${
                        isCompleted ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[9px] font-semibold text-gray-400 hidden sm:block mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Assigned Rider Info + Interactive Live Tracking Map */}
        {order.deliveryPersonName && (
          <div className="bg-violet-50/60 rounded-2xl p-4 border border-violet-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2.5 rounded-xl shadow-sm">
                <Bike className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Delivery Partner
                </p>
                <p className="text-sm font-black text-violet-800">{order.deliveryPersonName}</p>
              </div>
            </div>
            {order.status === "Out for Delivery" && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-violet-600 text-white animate-pulse">
                On Route
              </span>
            )}
          </div>
        )}

        {order.status === "Out for Delivery" && (
          <LiveTrackingMap key={order._id} orderId={order._id} orderLocation={order.location} />
        )}

        {/* 4. Cancellation & Refund Card */}
        {isCancelled && (
          <div className="bg-red-50/70 p-4 rounded-2xl border border-red-100 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-red-600 uppercase tracking-wider">Order Cancelled</p>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  order.refund?.status === "processed"
                    ? "bg-emerald-100 text-emerald-700"
                    : order.refund?.status === "failed"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {order.refund?.status === "processed"
                  ? "✓ Refund Completed"
                  : order.refund?.status === "failed"
                  ? "Refund Failed"
                  : "Refund Processing"}
              </span>
            </div>
            <p className="text-xs text-gray-600 font-medium">
              Reason:{" "}
              <span className="font-semibold text-gray-900">
                {order.cancellation?.reason || "Cancelled by customer"}
              </span>
            </p>
            <div className="pt-2 border-t border-red-100/60 flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Refund Amount:</span>
                <span className="font-black text-gray-900">
                  ₹{order.refund?.amount || order.totalAmount} (100%)
                </span>
              </div>
              {order.refund?.refundId && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">Gateway Refund ID:</span>
                  <span className="font-mono text-gray-700 font-semibold">{order.refund.refundId}</span>
                </div>
              )}
              <p className="text-[10px] text-gray-500 mt-1">
                Credited back directly to your original payment method (UPI / Card / Netbanking).
              </p>
            </div>
          </div>
        )}

        {/* 5. Itemized Bill Summary & Payment Verification */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">
            Items & Bill Summary
          </h4>
          <div className="space-y-2">
            {(order.items || []).map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center font-bold">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-xs">×{item.quantity}</span>
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm text-gray-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 space-y-2 text-xs font-bold text-gray-500">
            <div className="flex justify-between">
              <span>Item Total</span>
              <span>₹{foodSubtotal}</span>
            </div>
            {order.pricing?.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Coupon Discount</span>
                <span>-₹{order.pricing.discount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Restaurant Packaging</span>
              <span>₹{packagingFee}</span>
            </div>
            <div className="flex justify-between">
              <span>
                Delivery Partner Fee
                {order.deliveryDistanceKm ? ` (${order.deliveryDistanceKm} km)` : ""}
              </span>
              <span>
                {deliveryFee === 0 ? (
                  <span className="text-emerald-600">FREE</span>
                ) : (
                  `₹${deliveryFee}`
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee</span>
              <span>₹{platformFee}</span>
            </div>
            <div className="flex justify-between">
              <span>Govt. Taxes (5%)</span>
              <span>₹{tax}</span>
            </div>
          </div>

          <div className="pt-3 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
            <span className="text-base font-black text-gray-900">Paid Amount</span>
            <span className="text-xl font-black text-primary">₹{order.totalAmount}</span>
          </div>

          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                Payment Method
              </p>
              <p className="text-xs font-black text-gray-900 mt-0.5">
                Online Payment{" "}
                {order.paymentId ? `(Ref: ${order.paymentId.substring(0, 14)}...)` : "(Razorpay)"}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm">
              {order.paymentStatus || "PAID"}
            </span>
          </div>
        </div>

        {/* 6. Order Milestone Timestamps & Delivery Address */}
        {(order.createdAt || order.preparingAt || order.readyForPickupAt || order.pickedUpAt || order.deliveredAt) && (
          <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 space-y-2.5">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Order Timeline
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {[
                { label: "Placed", time: order.createdAt },
                { label: "Cooking Started", time: order.preparingAt },
                { label: "Ready for Pickup", time: order.readyForPickupAt },
                { label: "Rider Assigned", time: order.assignedAt },
                { label: "Picked Up", time: order.pickedUpAt },
                { label: "Delivered", time: order.deliveredAt },
              ]
                .filter((m) => !!m.time)
                .map((m) => (
                  <div key={m.label} className="bg-white rounded-xl p-2.5 border border-gray-100">
                    <p className="text-[9px] font-black uppercase text-gray-400">{m.label}</p>
                    <p className="text-xs font-bold text-gray-800 mt-0.5">
                      {new Date(m.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 space-y-1.5">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
            Delivery Address
          </h4>
          <div className="flex items-start gap-2 text-gray-700 font-medium text-xs">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p>{order.address}</p>
          </div>
        </div>

        {/* 7. Stage-Gated Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          {order.status === "Placed" && (
            <Button
              onClick={() => onCancel(order._id)}
              disabled={cancellingId === order._id}
              variant="outline"
              className="flex-1 h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold"
            >
              {cancellingId === order._id
                ? "Cancelling & Refunding..."
                : "Cancel Order (100% Refund)"}
            </Button>
          )}
          {order.status !== "Placed" && (
            <Button
              onClick={() => onReorder(order)}
              className="flex-1 h-12 rounded-xl gradient-primary font-bold shadow-lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reorder These Items
            </Button>
          )}
          {isDelivered && (
            <Button
              onClick={() => onReview(order)}
              variant="outline"
              className="h-12 px-5 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200 font-bold"
            >
              <Star
                className={`w-4 h-4 mr-1.5 ${
                  order.restaurantReview?.rating ? "fill-orange-500 text-orange-500" : ""
                }`}
              />
              {order.restaurantReview?.rating ? "View Rating" : "Rate Order"}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
