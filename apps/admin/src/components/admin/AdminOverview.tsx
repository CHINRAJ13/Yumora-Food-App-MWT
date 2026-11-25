import { useState, useEffect } from "react";
import { getAdminStats } from "@/api";
import {
  IndianRupee,
  ShoppingBag,
  ChefHat,
  Users,
  Loader2,
} from "lucide-react";
import { RevenueTrendChart } from "./charts/RevenueTrendChart";
import { OrderStatusDonutChart } from "./charts/OrderStatusDonutChart";
import { HourlyDemandChart } from "./charts/HourlyDemandChart";
import { TopRestaurantsCard } from "./charts/TopRestaurantsCard";

export const StatsCard = ({ title, value, icon: Icon, color, bgColor }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center gap-6">
    <div className={`w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center shrink-0`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-black text-gray-900 mt-0.5">{value}</h3>
    </div>
  </div>
);

const AdminOverview = () => {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "all">("all");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAdminStats(range)
      .then((res: any) => {
        if (active && res?.data) {
          setStats(res.data);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range]);

  return (
    <div className="space-y-6">
      {/* Top Toolbar: Range Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-gray-400">
            Analytics Window
          </span>
          {loading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
        </div>

        <div className="inline-flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
          {(
            [
              { id: "7d", label: "Last 7 Days" },
              { id: "30d", label: "Last 30 Days" },
              { id: "90d", label: "Last 90 Days" },
              { id: "all", label: "All Time" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRange(opt.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                range === opt.id
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Headline KPI Cards (Original 5-Card Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCard
          title="Platform Profit"
          value={`₹${stats?.platformNetRevenue?.toLocaleString() || 0}`}
          icon={IndianRupee}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatsCard
          title="Gross Order Value"
          value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`}
          icon={IndianRupee}
          color="text-teal-600"
          bgColor="bg-teal-50"
        />
        <StatsCard
          title="Total Orders"
          value={stats?.orderCount || 0}
          icon={ShoppingBag}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatsCard
          title="Restaurants"
          value={stats?.restaurantCount || 0}
          icon={ChefHat}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="Total Users"
          value={stats?.userCount || 0}
          icon={Users}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Row 1 Charts: Revenue & Profit Trend (8 cols) + Order Status Donut (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <RevenueTrendChart data={stats?.dailyTrend || []} range={range} />
        </div>
        <div className="lg:col-span-4">
          <OrderStatusDonutChart data={stats?.statusBreakdown || []} />
        </div>
      </div>

      {/* Row 2 Charts: Peak Ordering Hours (6 cols) + Top Kitchens & Settlement Split (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <HourlyDemandChart data={stats?.hourlyDemand || []} />
        </div>
        <div className="lg:col-span-6">
          <TopRestaurantsCard
            restaurants={stats?.topRestaurants || []}
            financialSplit={stats?.financialSplit}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
