import { useEffect, useState, useRef } from "react";
import { Timer, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

interface DeliveryCountdownTimerProps {
  order: any;
  liveETA?: string | null;
  liveDistance?: string | null;
}

const parseEtaMinutes = (eta?: string | null): number | null => {
  if (!eta) return null;
  const match = eta.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

export const DeliveryCountdownTimer = ({ order, liveETA, liveDistance }: DeliveryCountdownTimerProps) => {
  const [now, setNow] = useState(() => Date.now());
  const socketTargetRef = useRef<number | null>(null);

  // Sync dynamic socket target when rider is Out for Delivery and emits live ETA
  useEffect(() => {
    const mins = parseEtaMinutes(liveETA);
    if (order?.status === "Out for Delivery" && mins !== null && mins > 0) {
      socketTargetRef.current = Date.now() + mins * 60000;
    }
  }, [liveETA, order?.status]);

  const isActive = !["Delivered", "Cancelled"].includes(order?.status);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  if (!order || order.status === "Cancelled") return null;

  const estMinutes = order.estimatedDeliveryMinutes || 35;
  const createdMs = order.createdAt ? new Date(order.createdAt).getTime() : now;

  if (order.status === "Delivered") {
    const deliveredMs = order.deliveredAt
      ? new Date(order.deliveredAt).getTime()
      : order.updatedAt
      ? new Date(order.updatedAt).getTime()
      : now;
    const actualMins =
      order.actualDeliveryMinutes ||
      Math.max(1, Math.round((deliveredMs - createdMs) / 60000));
    const onTime = actualMins <= estMinutes;

    return (
      <div className="mb-6 rounded-2xl p-4 bg-emerald-50 border border-emerald-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
              Order Fulfilled
            </p>
            <p className="text-sm font-black text-gray-900">
              Delivered in {actualMins} {actualMins === 1 ? "min" : "mins"} 🎉
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            onTime
              ? "bg-emerald-200/80 text-emerald-900"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {onTime ? "⚡ On Time" : "Completed"}
        </span>
      </div>
    );
  }

  const baseTargetMs = order.targetDeliveryTime
    ? new Date(order.targetDeliveryTime).getTime()
    : createdMs + estMinutes * 60000;

  const targetMs =
    order.status === "Out for Delivery" && socketTargetRef.current
      ? socketTargetRef.current
      : baseTargetMs;

  const remainingSec = Math.floor((targetMs - now) / 1000);
  const totalWindowMs = Math.max(60000, targetMs - createdMs);
  const elapsedMs = Math.max(0, now - createdMs);
  const progressPct = Math.min(100, Math.round((elapsedMs / totalWindowMs) * 100));

  const arrivalTimeFormatted = new Date(targetMs).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (remainingSec <= 0) {
    const lateMins = Math.max(1, Math.ceil(Math.abs(remainingSec) / 60));
    return (
      <div className="mb-6 rounded-2xl p-4 bg-amber-50 border border-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                Arriving Shortly
              </p>
              <p className="text-sm font-black text-gray-900">
                Running slightly behind (+{lateMins} {lateMins === 1 ? "min" : "mins"})
              </p>
            </div>
          </div>
          {liveDistance && (
            <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
              {liveDistance} away
            </span>
          )}
        </div>
      </div>
    );
  }

  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const formattedCountdown = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div className="mb-6 rounded-2xl p-4 bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-200/80">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-orange-700 flex items-center gap-1">
              <span>Estimated Delivery Countdown</span>
              {liveDistance && <span className="text-gray-500">• {liveDistance} away</span>}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-gray-900 tracking-tight">
                {formattedCountdown}
              </span>
              <span className="text-xs font-bold text-gray-500">mins left</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Arriving By</p>
          <p className="text-xs font-black text-gray-800 flex items-center justify-end gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-primary" />
            {arrivalTimeFormatted}
          </p>
        </div>
      </div>

      {/* Live Countdown Progress Bar */}
      <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-1000"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
};
