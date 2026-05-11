import { motion } from "framer-motion";
import { Package, TrendingUp, Clock, IndianRupee, Bike } from "lucide-react";

interface StatsData {
  totalDeliveries: number;
  totalEarnings: number;
  avgDeliveryTime: number;
  todayDeliveries: number;
  todayEarnings: number;
}

const DeliveryStats = ({ stats, loading }: { stats: StatsData | null; loading: boolean }) => {
  const statCards = [
    {
      label: "Today's Deliveries",
      value: stats?.todayDeliveries || 0,
      icon: Bike,
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600"
    },
    {
      label: "Today's Earnings",
      value: `₹${stats?.todayEarnings || 0}`,
      icon: IndianRupee,
      color: "from-emerald-500 to-green-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600"
    },
    {
      label: "Total Deliveries",
      value: stats?.totalDeliveries || 0,
      icon: Package,
      color: "from-violet-500 to-purple-500",
      bgColor: "bg-violet-50",
      textColor: "text-violet-600"
    },
    {
      label: "Avg. Time",
      value: `${stats?.avgDeliveryTime || 0} min`,
      icon: Clock,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      label: "Total Earnings",
      value: `₹${stats?.totalEarnings || 0}`,
      icon: TrendingUp,
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-50",
      textColor: "text-pink-600"
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white/70 rounded-2xl p-5 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className={`w-10 h-10 ${card.bgColor} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <Icon className={`w-5 h-5 ${card.textColor}`} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{card.label}</p>
            <p className="text-xl font-black text-gray-900">{card.value}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DeliveryStats;
