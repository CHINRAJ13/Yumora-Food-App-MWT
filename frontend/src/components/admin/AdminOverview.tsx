import { useState, useEffect } from "react";
import { getAdminStats } from "@/api";
import { IndianRupee, ShoppingBag, ChefHat, Users } from "lucide-react";

export const StatsCard = ({ title, value, icon: Icon, color, bgColor }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center gap-6">
    <div className={`w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-black text-gray-900 mt-0.5">{value}</h3>
    </div>
  </div>
);

const AdminOverview = () => {
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
    getAdminStats().then((res: any) => setStats(res.data)).catch(console.error);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard 
        title="Total Revenue" 
        value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`} 
        icon={IndianRupee} 
        color="text-emerald-600"
        bgColor="bg-emerald-50"
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
  );
};

export default AdminOverview;
