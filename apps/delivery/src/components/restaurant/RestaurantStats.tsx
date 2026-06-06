import { motion } from "framer-motion";
import { IndianRupee, ShoppingBag, Clock, TrendingUp, Power } from "lucide-react";

interface RestaurantStatsProps {
  stats: any;
  loading: boolean;
  isOnline: boolean;
  onToggleStatus: () => void;
}

const RestaurantStats = ({ stats, loading, isOnline, onToggleStatus }: RestaurantStatsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl animate-pulse h-28" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Today's Revenue",
      value: `₹${stats?.todayRevenue?.toLocaleString() || 0}`,
      sub: `${stats?.todayOrders || 0} orders`,
      icon: IndianRupee,
      gradient: "from-emerald-500 to-green-500",
      bg: "bg-emerald-50",
      text: "text-emerald-600"
    },
    {
      label: "Active Orders",
      value: stats?.activeOrders || 0,
      sub: "In progress",
      icon: Clock,
      gradient: "from-orange-500 to-amber-500",
      bg: "bg-orange-50",
      text: "text-orange-600"
    },
    {
      label: "Total Orders",
      value: stats?.totalOrders || 0,
      sub: `${stats?.deliveredOrders || 0} delivered`,
      icon: ShoppingBag,
      gradient: "from-blue-500 to-indigo-500",
      bg: "bg-blue-50",
      text: "text-blue-600"
    },
    {
      label: "This Month",
      value: `₹${stats?.monthlyRevenue?.toLocaleString() || 0}`,
      sub: `${stats?.monthlyOrders || 0} orders`,
      icon: TrendingUp,
      gradient: "from-violet-500 to-purple-500",
      bg: "bg-violet-50",
      text: "text-violet-600"
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${card.text}`} />
              </div>
            </div>
            <p className="text-xl font-black text-gray-900">{card.value}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{card.label}</p>
            <p className="text-[10px] font-medium text-gray-300 mt-0.5">{card.sub}</p>
          </motion.div>
        );
      })}

      {/* Online/Offline Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className={`rounded-2xl p-4 shadow-sm border cursor-pointer transition-all hover:shadow-md ${
          isOnline 
            ? "bg-emerald-50 border-emerald-200" 
            : "bg-red-50 border-red-200"
        }`}
        onClick={onToggleStatus}
      >
        <div className="flex items-center justify-between mb-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isOnline ? "bg-emerald-100" : "bg-red-100"
          }`}>
            <Power className={`w-4 h-4 ${isOnline ? "text-emerald-600" : "text-red-600"}`} />
          </div>
          <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
        </div>
        <p className={`text-lg font-black ${isOnline ? "text-emerald-700" : "text-red-700"}`}>
          {isOnline ? "Online" : "Offline"}
        </p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Tap to toggle</p>
      </motion.div>
    </div>
  );
};

export default RestaurantStats;
