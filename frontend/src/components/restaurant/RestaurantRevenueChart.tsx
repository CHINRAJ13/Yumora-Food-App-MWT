import { motion } from "framer-motion";
import { TrendingUp, Award } from "lucide-react";

interface RevenueChartProps {
  dailyRevenue: any[];
  topItems: any[];
  stats: any;
}

const RestaurantRevenueChart = ({ dailyRevenue, topItems, stats }: RevenueChartProps) => {
  const maxRevenue = Math.max(...(dailyRevenue || []).map((d: any) => d.revenue), 1);

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Revenue (7 Days)</h3>
              <p className="text-[10px] text-gray-400 font-medium">Daily earnings</p>
            </div>
          </div>
          <span className="text-lg font-black text-emerald-600">₹{stats?.weeklyRevenue?.toLocaleString() || 0}</span>
        </div>

        {dailyRevenue && dailyRevenue.length > 0 ? (
          <div className="flex items-end gap-2 h-40">
            {dailyRevenue.map((day: any, i: number) => {
              const height = (day.revenue / maxRevenue) * 100;
              return (
                <motion.div
                  key={day._id}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="flex-1 flex flex-col items-center justify-end gap-1"
                >
                  <span className="text-[8px] font-black text-gray-400">₹{day.revenue}</span>
                  <div className="w-full bg-gradient-to-t from-emerald-500 to-green-400 rounded-t-lg min-h-[4px]" style={{ height: `${Math.max(height, 5)}%` }} />
                  <span className="text-[9px] font-bold text-gray-400 mt-1">{getDayLabel(day._id)}</span>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-300 font-bold text-sm">
            No revenue data yet
          </div>
        )}
      </div>

      {/* Top Selling Items */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900">Top Sellers</h3>
            <p className="text-[10px] text-gray-400 font-medium">Most ordered items</p>
          </div>
        </div>

        {topItems && topItems.length > 0 ? (
          <div className="space-y-3">
            {topItems.map((item: any, i: number) => {
              const maxQty = topItems[0]?.totalQuantity || 1;
              const pct = (item.totalQuantity / maxQty) * 100;
              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-400"}`}>
                        {i + 1}
                      </span>
                      <span className="text-xs font-bold text-gray-700 truncate max-w-[140px]">{item._id}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-gray-900">×{item.totalQuantity}</span>
                      <span className="text-[10px] text-gray-400 font-bold ml-2">₹{item.totalRevenue}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                      className={`h-full rounded-full ${i === 0 ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gray-300"}`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-300 font-bold text-sm">
            No sales data yet
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="md:col-span-2 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-black text-gray-900">₹{stats?.totalRevenue?.toLocaleString() || 0}</p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-1">Lifetime Revenue</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{stats?.deliveredOrders || 0}</p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-1">Orders Delivered</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-black text-red-500">{stats?.cancelledOrders || 0}</p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-1">Cancelled</p>
        </div>
      </div>
    </div>
  );
};

export default RestaurantRevenueChart;
