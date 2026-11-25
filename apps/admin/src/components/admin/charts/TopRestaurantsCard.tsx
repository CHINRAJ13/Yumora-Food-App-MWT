import { motion } from "framer-motion";
import { Award, Wallet } from "lucide-react";

interface TopRestaurantPoint {
  name: string;
  revenue: number;
  orders: number;
}

interface FinancialSplit {
  restaurantShare: number;
  riderPayouts: number;
  platformProfit: number;
}

interface TopRestaurantsCardProps {
  restaurants: TopRestaurantPoint[];
  financialSplit?: FinancialSplit;
}

export const TopRestaurantsCard = ({
  restaurants = [],
  financialSplit,
}: TopRestaurantsCardProps) => {
  const maxRev = Math.max(...restaurants.map((r) => r.revenue), 1);

  const restShare = financialSplit?.restaurantShare || 0;
  const riderPay = financialSplit?.riderPayouts || 0;
  const platProfit = financialSplit?.platformProfit || 0;
  const splitTotal = restShare + riderPay + platProfit;

  const pctRest = splitTotal > 0 ? Math.round((restShare / splitTotal) * 100) : 0;
  const pctRider = splitTotal > 0 ? Math.round((riderPay / splitTotal) * 100) : 0;
  const pctPlatform = splitTotal > 0 ? Math.max(0, 100 - pctRest - pctRider) : 0;

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col justify-between space-y-6">
      {/* Top Restaurants Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">Top Performing Kitchens</h3>
            <p className="text-[11px] font-semibold text-gray-400">
              Ranked by Gross Order Value
            </p>
          </div>
        </div>

        {restaurants.length === 0 ? (
          <div className="py-10 text-center text-gray-300 text-sm font-bold">
            No kitchen revenue recorded yet
          </div>
        ) : (
          <div className="space-y-3">
            {restaurants.map((r, idx) => {
              const pct = Math.max(6, Math.round((r.revenue / maxRev) * 100));
              return (
                <div key={r.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-gray-800 truncate max-w-[60%]">
                      #{idx + 1} {r.name}
                    </span>
                    <span className="font-black text-gray-900">
                      ₹{r.revenue.toLocaleString()}{" "}
                      <span className="text-[10px] font-bold text-gray-400">({r.orders})</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.08 }}
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3-Way Settlement Split Bar */}
      <div className="pt-4 border-t border-gray-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            Revenue Settlement Split
          </span>
          <span className="text-[10px] font-black text-gray-500">
            Total ₹{splitTotal.toLocaleString()}
          </span>
        </div>

        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
          {splitTotal > 0 && (
            <>
              <div style={{ width: `${pctRest}%` }} className="bg-blue-500 h-full" />
              <div style={{ width: `${pctRider}%` }} className="bg-purple-500 h-full" />
              <div style={{ width: `${pctPlatform}%` }} className="bg-emerald-500 h-full" />
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
          <div className="flex items-center gap-1.5 text-gray-600">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <span className="truncate">Kitchen {pctRest}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
            <span className="truncate">Riders {pctRider}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">Platform {pctPlatform}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
