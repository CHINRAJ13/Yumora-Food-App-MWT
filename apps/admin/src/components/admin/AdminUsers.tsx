import { useState, useEffect } from "react";
import * as api from "@/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  ShieldCheck,
  Truck,
  LayoutDashboard,
  User as UserIcon,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Clock,
  Car,
  BadgeCheck,
  ChefHat
} from "lucide-react";

type RoleTab = "user" | "restaurant" | "delivery" | "admin";

const roleTabs: { id: RoleTab; label: string; icon: any }[] = [
  { id: "user", label: "Customers", icon: UserIcon },
  { id: "restaurant", label: "Restaurants", icon: ChefHat },
  { id: "delivery", label: "Delivery Riders", icon: Truck },
  { id: "admin", label: "Admins", icon: ShieldCheck },
];

const statusBadge: Record<string, { bg: string; text: string; icon: any }> = {
  active: { bg: "bg-green-50", text: "text-green-600", icon: UserCheck },
  pending: { bg: "bg-orange-50", text: "text-orange-600", icon: Clock },
  suspended: { bg: "bg-red-50", text: "text-red-600", icon: UserX },
};

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<RoleTab>("user");

  useEffect(() => {
    fetchUsers();
    fetchRestaurants();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers();
      setUsers(res.data);
      // console.log(users)
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const res = await api.getAdminRestaurants();
      setRestaurants(res.data);
    } catch (err) {
      console.error("Failed to fetch restaurants", err);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await api.updateAdminUserStatus(userId, newStatus);
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.roles?.includes(activeTab) &&
      (u.name?.toLowerCase().includes(search.toLowerCase()) ||
       u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}s...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-80 outline-none"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <Users className="w-4 h-4" />
            {filtered.length} filtered
          </div>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex items-center gap-2 p-1 bg-gray-100/50 rounded-2xl w-fit border border-gray-200/50">
        {roleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = users.filter(u => u.roles?.includes(tab.id)).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 ${
                isActive
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
              {tab.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${
                isActive ? 'bg-primary/10 text-primary' : 'bg-gray-200/50 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 text-left">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  User Info
                </th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Contact
                </th>
                {activeTab === 'delivery' && (
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Vehicle Details
                  </th>
                )}
                {activeTab === 'restaurant' && (
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Linked Restaurant
                  </th>
                )}
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Status
                </th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Manage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {filtered.map((user) => {
                  return (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50/30 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-black text-primary text-sm">
                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">
                              {user.name || "Unnamed"}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              ID: {user._id.substring(user._id.length - 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {user.email}
                          </p>
                          {user.phone && (
                            <p className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      
                      {activeTab === 'delivery' && (
                        <td className="px-8 py-5">
                          <div className="space-y-1 bg-blue-50/50 p-2 rounded-xl border border-blue-100/50">
                            <p className="flex items-center gap-1.5 text-[10px] font-black text-blue-600">
                              <Car className="w-3 h-3" />
                              {user.deliveryDetails?.vehicleNumber || 'No Data'}
                            </p>
                            <p className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                              <BadgeCheck className="w-3 h-3" />
                              {user.deliveryDetails?.licenseNumber || 'No Data'}
                            </p>
                          </div>
                        </td>
                      )}

                      {activeTab === 'restaurant' && (
                        <td className="px-8 py-5">
                          <div className="space-y-1">
                            <p className="flex items-center gap-1.5 text-xs font-bold text-purple-600">
                              <LayoutDashboard className="w-3 h-3" />
                              {user.restaurantDetails?.name || 'Not Linked'}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium italic">
                              ID: {user.restaurantDetails?.id || 'None'}
                            </p>
                          </div>
                        </td>
                      )}

                      <td className="px-8 py-5">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${statusBadge[user.status || 'active'].bg} ${statusBadge[user.status || 'active'].text}`}
                        >
                          {(() => {
                            const StatusIcon = statusBadge[user.status || 'active'].icon;
                            return <StatusIcon className="w-3 h-3" />;
                          })()}
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {user.status || 'active'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-2">

                          <select
                            value={user.status || 'active'}
                            onChange={(e) => handleStatusChange(user._id, e.target.value)}
                            className={`text-[10px] font-bold border-none rounded-xl px-3 py-2 focus:ring-2 cursor-pointer outline-none transition-all ${
                              user.status === 'suspended' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                            }`}
                          >
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {filtered.length === 0 && !loading && (
            <div className="text-center py-20">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold">No {activeTab}s found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
