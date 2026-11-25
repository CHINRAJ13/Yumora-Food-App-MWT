import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, BarChart2, Activity } from "lucide-react";

export interface DailyTrendPoint {
  date: string;
  gmv: number;
  profit: number;
  orders: number;
  deliveredOrders: number;
}

interface RevenueTrendChartProps {
  data: DailyTrendPoint[];
  range: string;
}

const formatShortDate = (isoDate: string) => {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

export const RevenueTrendChart = ({ data = [], range }: RevenueTrendChartProps) => {
  const [chartMode, setChartMode] = useState<"area" | "bar">("area");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const totalGmv = data.reduce((s, d) => s + d.gmv, 0);
  const totalProfit = data.reduce((s, d) => s + d.profit, 0);
  const maxVal = Math.max(...data.map((d) => d.gmv), 100);

  const width = 640;
  const height = 210;
  const padX = 18;
  const padY = 18;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const getX = (idx: number) =>
    data.length <= 1 ? width / 2 : padX + (idx / (data.length - 1)) * plotW;
  const getY = (val: number) => padY + plotH - (val / maxVal) * plotH;

  const gmvPoints = data.map((d, i) => `${getX(i)},${getY(d.gmv)}`).join(" ");
  const profitPoints = data.map((d, i) => `${getX(i)},${getY(d.profit)}`).join(" ");
  const areaPolygon =
    data.length > 0
      ? `${getX(0)},${padY + plotH} ${gmvPoints} ${getX(data.length - 1)},${padY + plotH}`
      : "";

  const activePoint = hoveredIdx !== null ? data[hoveredIdx] : null;
  const labelStride = data.length > 15 ? Math.ceil(data.length / 7) : data.length > 8 ? 2 : 1;

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">Revenue & Platform Profit</h3>
            <p className="text-[11px] font-semibold text-gray-400">
              GMV: <span className="text-gray-800 font-black">₹{totalGmv.toLocaleString()}</span> • Net Profit:{" "}
              <span className="text-orange-600 font-black">₹{totalProfit.toLocaleString()}</span> ({range.toUpperCase()})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-3 mr-2 text-[10px] font-black uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> GMV
            </span>
            <span className="flex items-center gap-1.5 text-orange-600">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Profit
            </span>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setChartMode("area")}
              className={`p-1.5 rounded-lg transition-all ${
                chartMode === "area" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
              }`}
              title="Area Trend"
            >
              <Activity className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setChartMode("bar")}
              className={`p-1.5 rounded-lg transition-all ${
                chartMode === "bar" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
              }`}
              title="Daily Bars"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Chart Canvas */}
      <div className="relative">
        {/* Hover Tooltip */}
        {activePoint && hoveredIdx !== null && (
          <div
            className="absolute top-0 z-20 pointer-events-none bg-gray-900 text-white px-3.5 py-2 rounded-2xl shadow-xl text-xs space-y-0.5 transition-all"
            style={{
              left: `${Math.min(72, Math.max(4, (hoveredIdx / Math.max(1, data.length - 1)) * 75))}%`,
            }}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              {formatShortDate(activePoint.date)}
            </p>
            <p className="font-black text-emerald-400">GMV: ₹{activePoint.gmv.toLocaleString()}</p>
            <p className="font-bold text-orange-300">Profit: ₹{activePoint.profit.toLocaleString()}</p>
            <p className="text-[10px] text-gray-300">{activePoint.orders} orders placed</p>
          </div>
        )}

        {data.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-gray-300 text-sm font-bold">
            No order data in selected timeframe
          </div>
        ) : chartMode === "area" ? (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-56 overflow-visible"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <defs>
              <linearGradient id="gmvAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.5, 1].map((pct) => {
              const y = padY + plotH * pct;
              const val = Math.round(maxVal * (1 - pct));
              return (
                <g key={pct}>
                  <line
                    x1={padX}
                    y1={y}
                    x2={width - padX}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padX}
                    y={y - 4}
                    fontSize="9"
                    fontWeight="700"
                    fill="#94a3b8"
                  >
                    ₹{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                  </text>
                </g>
              );
            })}

            {/* GMV Area Fill */}
            <motion.polygon
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              points={areaPolygon}
              fill="url(#gmvAreaGrad)"
            />

            {/* GMV Line */}
            <motion.polyline
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.7 }}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={gmvPoints}
            />

            {/* Profit Line */}
            <motion.polyline
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8 }}
              fill="none"
              stroke="#f97316"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={profitPoints}
            />

            {/* Hover vertical guide & dots */}
            {data.map((d, i) => {
              const cx = getX(i);
              const cyGmv = getY(d.gmv);
              const cyProfit = getY(d.profit);
              const isHovered = hoveredIdx === i;
              return (
                <g key={d.date}>
                  {isHovered && (
                    <line
                      x1={cx}
                      y1={padY}
                      x2={cx}
                      y2={padY + plotH}
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cyGmv}
                    r={isHovered ? 5.5 : data.length <= 14 ? 3.5 : 0}
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <circle
                    cx={cx}
                    cy={cyProfit}
                    r={isHovered ? 4.5 : 0}
                    fill="#f97316"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {/* Invisible wide hit zone */}
                  <rect
                    x={cx - plotW / Math.max(1, data.length * 2)}
                    y={0}
                    width={plotW / Math.max(1, data.length)}
                    height={height}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(i)}
                  />
                </g>
              );
            })}
          </svg>
        ) : (
          <div
            className="flex items-end gap-1.5 h-56 pt-8 pb-2 px-2"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {data.map((d, i) => {
              const gmvPct = Math.max(4, Math.round((d.gmv / maxVal) * 100));
              const profitPct = Math.max(2, Math.round((d.profit / maxVal) * 100));
              return (
                <div
                  key={d.date}
                  onMouseEnter={() => setHoveredIdx(i)}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-1 cursor-pointer group"
                >
                  <div className="w-full h-full flex items-end justify-center gap-0.5">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${d.gmv > 0 ? gmvPct : 3}%` }}
                      transition={{ duration: 0.4, delay: Math.min(i * 0.02, 0.3) }}
                      className={`flex-1 rounded-t-md transition-opacity ${
                        d.gmv > 0
                          ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                          : "bg-gray-100"
                      } ${hoveredIdx === i ? "opacity-100 ring-2 ring-emerald-300" : "opacity-90"}`}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${d.profit > 0 ? profitPct : 0}%` }}
                      transition={{ duration: 0.4, delay: Math.min(i * 0.02, 0.3) }}
                      className="w-1.5 rounded-t-md bg-orange-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* X-Axis Labels */}
        <div className="flex justify-between px-3 mt-1">
          {data.map((d, i) =>
            i % labelStride === 0 || i === data.length - 1 ? (
              <span key={d.date} className="text-[9px] font-bold text-gray-400">
                {formatShortDate(d.date)}
              </span>
            ) : (
              <span key={d.date} />
            )
          )}
        </div>
      </div>
    </div>
  );
};
