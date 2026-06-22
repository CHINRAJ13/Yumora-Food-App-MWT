import { useState, useEffect } from "react";
import * as api from "@/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChefHat,
  Truck,
  ShieldAlert,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const AdminApprovals = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers();
      // Filter for pending users on the frontend for now
      const pending = res.data.filter((u: any) => u.status === 'pending');
      setUsers(pending);
    } catch {
      toast.error("Failed to fetch pending users");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId: string, status: 'active' | 'suspended') => {
    try {
      await api.updateAdminUserStatus(userId, status);
      toast.success(`User account ${status === 'active' ? 'approved' : 'rejected'}`);
      fetchPendingUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">Pending Approvals</h2>
            <p className="text-xs text-gray-400 font-medium">Review and verify new business partners</p>
          </div>
        </div>
        <Badge variant="outline" className="h-7 px-3 rounded-full font-bold text-orange-600 bg-orange-50 border-orange-200 uppercase tracking-wider text-[10px]">
          {users.length} Applications
        </Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {users.map((user) => (
            <motion.div
              key={user._id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              {/* Role Indicator Strip */}
              <div className={`absolute top-0 left-0 w-1.5 h-full ${
                user.roles?.includes('restaurant') ? 'bg-purple-500' : 'bg-blue-500'
              }`} />

              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${
                      user.roles?.includes('restaurant') ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {user.roles?.includes('restaurant') ? <ChefHat /> : <Truck />}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900">{user.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          user.roles?.includes('restaurant') ? 'text-purple-500' : 'text-blue-500'
                        }`}>
                          {user.roles?.includes('restaurant') ? 'restaurant' : 'delivery'} Applicant
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-200" />
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-full">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase">Pending</span>
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="bg-gray-50/50 rounded-2xl p-4 mb-6 border border-gray-100/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Email Address</p>
                      <p className="text-xs font-bold text-gray-700 truncate">{user.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Phone Number</p>
                      <p className="text-xs font-bold text-gray-700">{user.phone || 'N/A'}</p>
                    </div>

                    {user.roles?.includes('restaurant') && (
                      <div className="col-span-2 pt-2 border-t border-gray-100 mt-2">
                         <p className="text-[10px] font-black text-purple-500 uppercase tracking-wider flex items-center gap-1">
                          <Info className="w-3 h-3" /> Verification Needed
                        </p>
                        <p className="text-xs font-medium text-gray-600 mt-1">
                          Applicant wants to register as a restaurant partner. Please verify their business license and location before approval.
                        </p>
                      </div>
                    )}

                    {user.roles?.includes('delivery') && (
                      <>
                        <div className="space-y-1 pt-2 border-t border-gray-100">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Vehicle No.</p>
                          <p className="text-xs font-black text-gray-800">{user.deliveryDetails?.vehicleNumber || 'Pending Info'}</p>
                        </div>
                        <div className="space-y-1 pt-2 border-t border-gray-100">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider">License No.</p>
                          <p className="text-xs font-black text-gray-800">{user.deliveryDetails?.licenseNumber || 'Pending Info'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex gap-3">
                  <Button 
                    onClick={() => handleStatusUpdate(user._id, 'active')}
                    className="flex-1 h-12 rounded-2xl bg-green-500 hover:bg-green-600 font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-green-200 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleStatusUpdate(user._id, 'suspended')}
                    className="flex-1 h-12 rounded-2xl border-gray-200 font-black text-xs uppercase tracking-widest gap-2 text-red-500 hover:bg-red-50 hover:border-red-100 transition-all active:scale-95"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {users.length === 0 && (
          <div className="col-span-full py-24 bg-white rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-gray-900">All caught up!</h3>
            <p className="text-gray-400 font-medium max-w-xs mx-auto mt-2">
              There are no pending applications at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApprovals;
