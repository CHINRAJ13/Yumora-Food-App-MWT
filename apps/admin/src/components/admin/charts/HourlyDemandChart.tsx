import { useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface HourlyPoint {
  hour: number;
  label: string;
  orders: number;
}

interface HourlyDemandChartProps {
  data: HourlyPoint[];
}

export const HourlyDemandChart = ({ data = [] }: HourlyDemandChartProps) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const maxOrders = Math.max(...data.map((d) => d.orders), 1);
  const peakPoint = data.reduce(
    (best, cur) => (cur.orders > best.orders ? cur : best),
    { hour: 19, label: "7p", orders: 0 }
  );

  const activePoint = hoveredHour !== null ? data.find((d) => d.hour === hoveredHour) : null;

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-primary flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">Peak Ordering Hours (IST)</h3>
            <p className="text-[11px] font-semibold text-gray-400">
              {activePoint
                ? `${activePoint.label.toUpperCase()} Window: ${activePoint.orders} orders`
                : peakPoint.orders > 0
                ? `Busiest hour: ${peakPoint.label.toUpperCase()} (${peakPoint.orders} orders)`
                : "Order distribution across 24 hours"}
            </p>
          </div>
        </div>

        {peakPoint.orders > 0 && (
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
            🔥 Peak @ {peakPoint.label.toUpperCase()}
          </span>
        )}
      </div>

      <div
        className="flex items-end gap-1 h-44 pt-4 pb-1"
        onMouseLeave={() => setHoveredHour(null)}
      >
        {data.map((point) => {
          const pct = point.orders > 0 ? Math.max(8, Math.round((point.orders / maxOrders) * 100)) : 4;
          const isPeak = peakPoint.orders > 0 && point.orders >= peakPoint.orders * 0.75;
          const isHovered = hoveredHour === point.hour;

          return (
            <div
              key={point.hour}
              onMouseEnter={() => setHoveredHour(point.hour)}
              className="flex-1 h-full flex flex-col items-center justify-end cursor-pointer group"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.4 }}
                className={`w-full rounded-t-md transition-all ${
                  point.orders === 0
                    ? "bg-gray-100"
                    : isPeak
                    ? "bg-gradient-to-t from-orange-600 to-amber-400"
                    : "bg-gradient-to-t from-indigo-500 to-sky-400"
                } ${isHovered ? "ring-2 ring-gray-900 scale-x-110" : ""}`}
              />
              {point.hour % 3 === 0 ? (
                <span className="text-[8px] font-bold text-gray-400 mt-1.5">{point.label}</span>
              ) : (
                <span className="text-[8px] opacity-0 mt-1.5">.</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
