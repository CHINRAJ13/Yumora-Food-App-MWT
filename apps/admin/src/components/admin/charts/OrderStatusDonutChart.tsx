import { useState } from "react";
import { motion } from "framer-motion";
import { PieChart } from "lucide-react";

interface StatusPoint {
  status: string;
  count: number;
}

interface OrderStatusDonutChartProps {
  data: StatusPoint[];
}

export const OrderStatusDonutChart = ({ data = [] }: OrderStatusDonutChartProps) => {
  const [hoveredBucket, setHoveredBucket] = useState<string | null>(null);

  const delivered = data.find((d) => d.status === "Delivered")?.count || 0;
  const cancelled = data.find((d) => d.status === "Cancelled")?.count || 0;
  const inProgress = data
    .filter((d) => !["Delivered", "Cancelled"].includes(d.status))
    .reduce((sum, d) => sum + d.count, 0);

  const total = delivered + inProgress + cancelled;
  const completionRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  const segments = [
    { key: "Delivered", label: "Delivered", count: delivered, color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-700" },
    { key: "Active", label: "In Progress", count: inProgress, color: "#f97316", bg: "bg-orange-50", text: "text-orange-700" },
    { key: "Cancelled", label: "Cancelled", count: cancelled, color: "#ef4444", bg: "bg-red-50", text: "text-red-700" },
  ];

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col justify-between h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
          <PieChart className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-black text-gray-900">Order Fulfillment Split</h3>
          <p className="text-[11px] font-semibold text-gray-400">
            {total} total orders in timeframe
          </p>
        </div>
      </div>

      {/* Donut SVG */}
      <div className="flex items-center justify-center my-3 relative">
        <svg viewBox="0 0 160 160" className="w-44 h-44 -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="18"
          />
          {total > 0 &&
            segments.map((seg) => {
              if (seg.count === 0) return null;
              const segLen = (seg.count / total) * circumference;
              const offset = cumulativeOffset;
              cumulativeOffset += segLen;
              const isHighlighted = hoveredBucket === seg.key;

              return (
                <motion.circle
                  key={seg.key}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isHighlighted ? "22" : "18"}
                  strokeDasharray={`${segLen} ${circumference - segLen}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  onMouseEnter={() => setHoveredBucket(seg.key)}
                  onMouseLeave={() => setHoveredBucket(null)}
                  className="cursor-pointer transition-all"
                />
              );
            })}
        </svg>

        {/* Center Metric */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-gray-900">{completionRate}%</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
            Fulfilled
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 mt-2">
        {segments.map((seg) => {
          const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
          return (
            <div
              key={seg.key}
              onMouseEnter={() => setHoveredBucket(seg.key)}
              onMouseLeave={() => setHoveredBucket(null)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                hoveredBucket === seg.key ? seg.bg : "bg-gray-50/70"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-xs font-bold text-gray-700">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-gray-900">{seg.count}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${seg.bg} ${seg.text}`}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
