import { useState, useEffect } from "react";
import * as api from "@/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  Shield,
  ShieldCheck,
  Truck,
  LayoutDashboard,
  User as UserIcon,
  Mail,
  Phone,
} from "lucide-react";

const roleBadge: Record<string, { bg: string; text: string; icon: any }> = {
  admin: { bg: "bg-red-50", text: "text-red-600", icon: ShieldCheck },
  restaurant: { bg: "bg-purple-50", text: "text-purple-600", icon: LayoutDashboard },
  delivery: { bg: "bg-blue-50", text: "text-blue-600", icon: Truck },
  user: { bg: "bg-gray-50", text: "text-gray-600", icon: UserIcon },
};

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchRestaurants();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers();
      setUsers(res.data);
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

  const handleRoleChange = async (userId: string, newRole: string, restaurantId?: string) => {
    try {
      await api.updateAdminUserRole(userId, { role: newRole, restaurantId });
      toast.success(`User updated successfully`);
      fetchUsers();
    } catch {
      toast.error("Failed to update user");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-80 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
          <Users className="w-4 h-4" />
          {filtered.length} users
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 text-left">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  User
                </th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Contact
                </th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Current Role
                </th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Change Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence>
                {filtered.map((user) => {
                  const badge =
                    roleBadge[user.role] || roleBadge.user;
                  const RoleIcon = badge.icon;
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
                      <td className="px-8 py-5">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${badge.bg} ${badge.text}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-2">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user._id, e.target.value, user.restaurantId)
                            }
                            className="text-xs font-bold bg-gray-100 border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary/20 cursor-pointer outline-none transition-all"
                          >
                            <option value="user">User</option>
                            <option value="restaurant">Restaurant</option>
                            <option value="delivery">Delivery</option>
                            <option value="admin">Admin</option>
                          </select>
                          
                          {user.role === 'restaurant' && (
                            <select
                              value={user.restaurantId || ""}
                              onChange={(e) =>
                                handleRoleChange(user._id, user.role, e.target.value)
                              }
                              className="text-[10px] font-bold bg-purple-50 text-purple-600 border-none rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-purple-200 cursor-pointer outline-none transition-all"
                            >
                              <option value="">Select Restaurant</option>
                              {restaurants.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          )}
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
              <p className="text-gray-400 font-bold">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
