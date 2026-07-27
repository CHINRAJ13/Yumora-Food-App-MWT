import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  ChevronRight, 
  ShieldCheck, 
  Package, 
  LogOut,
  Loader2,
  Save,
  ArrowLeft,
  Lock,
  BadgeCheck,
  Calendar,
  Bike,
  CreditCard,
  FileText,
  AlertTriangle,
  Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/store/useAuthStore";
import * as api from "@/api";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  reviewing: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  rejected: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  suspended: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });
  const [profileData, setProfileData] = useState<any>(null);

  // Delivery details form (only for delivery role)
  const [deliveryForm, setDeliveryForm] = useState({
    vehicleNumber: "",
    licenseNumber: "",
    vehicleType: "Bike",
  });
  const [deliveryEdited, setDeliveryEdited] = useState(false);
  const [showReverifyWarning, setShowReverifyWarning] = useState(false);

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res: any = await api.getUserProfile();
        if (res.status === 'success') {
          setUser(res.data);
          setProfileData(res.data);
          setForm({
            name: res.data.name,
            phone: res.data.phone || "",
            email: res.data.email || "",
          });
          // Set delivery form if delivery role
          if (res.data.type === 'delivery' && res.data.deliveryDetails) {
            setDeliveryForm({
              vehicleNumber: res.data.deliveryDetails.vehicleNumber || "",
              licenseNumber: res.data.deliveryDetails.licenseNumber || "",
              vehicleType: res.data.deliveryDetails.vehicleType || "Bike",
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [setUser]);

  // Track if delivery details changed
  useEffect(() => {
    if (profileData?.type === 'delivery' && profileData?.deliveryDetails) {
      const original = profileData.deliveryDetails;
      const changed = 
        deliveryForm.vehicleNumber !== (original.vehicleNumber || "") ||
        deliveryForm.licenseNumber !== (original.licenseNumber || "") ||
        deliveryForm.vehicleType !== (original.vehicleType || "Bike");
      setDeliveryEdited(changed);
      setShowReverifyWarning(changed);
    }
  }, [deliveryForm, profileData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updateData: any = { name: form.name };
      if (!profileData?.email && form.email) updateData.email = form.email;
      if (!profileData?.phone && form.phone) updateData.phone = form.phone;

      // Include delivery details if edited
      if (profileData?.type === 'delivery' && deliveryEdited) {
        updateData.deliveryDetails = deliveryForm;
      }

      const res: any = await api.updateUserProfile(updateData);
      if (res.status === 'success') {
        setUser(res.data);
        setProfileData(res.data);
        setDeliveryEdited(false);
        setShowReverifyWarning(false);
        toast.success(res.message || "Profile updated successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setPasswordLoading(true);
    try {
      await api.updatePassword({ 
        currentPassword: passwordForm.currentPassword, 
        password: passwordForm.newPassword 
      });
      toast.success("Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };


  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (err) {
      toast.error("Failed to logout");
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const memberSince = profileData?.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 lg:pb-0">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
           <button 
             onClick={() => navigate(-1)}
             className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
           >
             <ArrowLeft className="w-5 h-5 text-gray-600" />
           </button>
           <h1 className="text-3xl font-black text-gray-900 tracking-tight">Account Settings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
             <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/50 text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center text-white text-3xl font-black shadow-lg">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-1">{user?.name}</h2>
                <p className="text-sm text-gray-400 font-medium">
                  {profileData?.type?.toUpperCase()} • Coimbatore
                </p>
                
                <div className="mt-8 flex flex-col gap-2">
                   <button 
                     onClick={() => navigate("/orders")}
                     className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                   >
                     <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-bold text-gray-700">My Orders</span>
                     </div>
                     <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                   </button>
                   
                   <button 
                     onClick={handleLogout}
                     className="flex items-center justify-between p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition-colors group"
                   >
                     <div className="flex items-center gap-3">
                        <LogOut className="w-5 h-5 text-red-500" />
                        <span className="text-sm font-bold text-red-600">Logout</span>
                     </div>
                   </button>
                </div>
             </div>

             {/* Account Details Card */}
             <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg shadow-gray-200/30 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account Details</h4>
                
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2.5">
                      <BadgeCheck className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-bold text-gray-500">Role</span>
                   </div>
                   <span className="text-xs font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                     {profileData?.type ? profileData.type.charAt(0).toUpperCase() + profileData.type.slice(1) : ''}
                   </span>
                </div>

                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-bold text-gray-500">Status</span>
                   </div>
                   <StatusBadge status={profileData?.status || "active"} />
                </div>

                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-bold text-gray-500">Member Since</span>
                   </div>
                   <span className="text-xs font-bold text-gray-700">{memberSince}</span>
                </div>

                {/* Delivery-specific status */}
                {/* {profileData?.type === 'delivery' && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                     <div className="flex items-center gap-2.5">
                        <Bike className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-500">Delivery Status</span>
                     </div>
                     <StatusBadge status={profileData?.deliveryStatus || "pending"} />
                  </div>
                )} */}

                {/* Restaurant-specific status */}
                {/* {profileData?.type === 'restaurant' && (
                  <>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                       <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-gray-400" />
                          <span className="text-xs font-bold text-gray-500">Restaurant Status</span>
                       </div>
                       <StatusBadge status={profileData?.restaurantStatus || "pending"} />
                    </div>
                    {profileData?.restaurantId && (
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2.5">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-bold text-gray-500">Restaurant ID</span>
                         </div>
                         <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded">
                           {profileData.restaurantId}
                         </span>
                      </div>
                    )}
                  </>
                )} */}
             </div>

             <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                   <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Account Status</p>
                   <p className="text-sm font-bold text-emerald-900">Verified & Secure</p>
                </div>
             </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 lg:p-12 border border-gray-100 shadow-xl shadow-gray-200/50"
            >
              <h3 className="text-xl font-black text-gray-900 mb-8">Personal Information</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {/* Name — Editable */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">
                      Full Name
                    </label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary/20 outline-none transition-all text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Email — Conditionally Editable */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 flex items-center gap-1.5">
                      Email Address
                      {!!profileData?.email && (
                        <span className="inline-flex items-center gap-1 bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full text-[9px] font-bold normal-case tracking-normal">
                          <Lock className="w-2.5 h-2.5" />
                          Cannot be changed
                        </span>
                      )}
                    </label>
                    <div className="relative group" title={!!profileData?.email ? "Email is already set and cannot be changed" : ""}>
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                      <input 
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        disabled={!!profileData?.email}
                        placeholder="Your email address"
                        className={`w-full pl-12 pr-12 py-4 border rounded-2xl text-sm font-bold outline-none transition-all ${!!profileData?.email ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed select-none' : 'bg-gray-50 border-gray-100 focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary/20 text-gray-900'}`}
                      />
                      {!!profileData?.email && <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />}
                    </div>
                  </div>

                  {/* Phone — Conditionally Editable */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 flex items-center gap-1.5">
                      Phone Number
                      {!!profileData?.phone && (
                        <span className="inline-flex items-center gap-1 bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full text-[9px] font-bold normal-case tracking-normal">
                          <Lock className="w-2.5 h-2.5" />
                          Cannot be changed
                        </span>
                      )}
                    </label>
                    <div className="relative group" title={!!profileData?.phone ? "Phone is already set and cannot be changed" : ""}>
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                      <input 
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        disabled={!!profileData?.phone}
                        placeholder="+91 00000 00000"
                        className={`w-full pl-12 pr-12 py-4 border rounded-2xl text-sm font-bold outline-none transition-all ${!!profileData?.phone ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed select-none' : 'bg-gray-50 border-gray-100 focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary/20 text-gray-900'}`}
                      />
                      {!!profileData?.phone && <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />}
                    </div>
                  </div>
                </div>

                {/* Delivery Details — Editable with re-verification */}
                {/* {profileData?.type === 'delivery' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-6 border-t border-gray-100"
                  >
                    <div className="flex items-center gap-2 mb-6">
                      <Bike className="w-5 h-5 text-primary" />
                      <h4 className="text-base font-black text-gray-900">Delivery Details</h4>
                    </div>

                    <AnimatePresence>
                      {showReverifyWarning && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3"
                        >
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-amber-800">Admin Re-verification Required</p>
                            <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                              Changing your delivery details (vehicle number, license, or vehicle type) will require admin re-verification. Your account will be set to <strong>pending</strong> status until approved.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">
                          Vehicle Type
                        </label>
                        <select
                          value={deliveryForm.vehicleType}
                          onChange={(e) => setDeliveryForm({ ...deliveryForm, vehicleType: e.target.value })}
                          className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary/20 outline-none transition-all text-gray-900 appearance-none cursor-pointer"
                        >
                          <option value="Bike">🏍️ Bike</option>
                          <option value="Scooter">🛵 Scooter</option>
                          <option value="Cycle">🚲 Cycle</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">
                          Vehicle Number
                        </label>
                        <div className="relative group">
                          <Bike className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                          <input 
                            type="text"
                            value={deliveryForm.vehicleNumber}
                            onChange={(e) => setDeliveryForm({ ...deliveryForm, vehicleNumber: e.target.value })}
                            placeholder="TN 01 AB 1234"
                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary/20 outline-none transition-all text-gray-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">
                          License Number
                        </label>
                        <div className="relative group">
                          <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                          <input 
                            type="text"
                            value={deliveryForm.licenseNumber}
                            onChange={(e) => setDeliveryForm({ ...deliveryForm, licenseNumber: e.target.value })}
                            placeholder="DL-1234567890"
                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary/20 outline-none transition-all text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )} */}

                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                   <div className="flex items-center gap-2 max-w-[220px]">
                     <Info className="w-4 h-4 text-gray-300 shrink-0" />
                     <p className="text-xs text-gray-400 font-medium">
                       Email cannot be changed. Other fields will be saved immediately.
                     </p>
                   </div>
                   <button 
                     disabled={loading}
                     className="gradient-primary text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all"
                   >
                     {loading ? (
                       <Loader2 className="w-4 h-4 animate-spin" />
                     ) : (
                       <Save className="w-4 h-4" />
                     )}
                     {deliveryEdited ? "Save & Request Reverification" : "Save Profile"}
                   </button>
                </div>
              </form>
            </motion.div>

            {/* Security Tip & Change Password */}
            <div className="mt-8 bg-white/50 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
               <div className="flex items-center justify-between mb-4">
                 <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Security & Password</h4>
                 <button 
                   onClick={() => setShowPasswordSection(!showPasswordSection)}
                   className="text-xs font-bold text-primary flex items-center gap-1"
                 >
                   <Lock className="w-3 h-3" />
                   {showPasswordSection ? "Hide" : "Change Password"}
                 </button>
               </div>
               
               <AnimatePresence>
                 {showPasswordSection && (
                   <motion.div
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: "auto" }}
                     exit={{ opacity: 0, height: 0 }}
                     className="mb-6 overflow-hidden"
                   >
                     <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4 border-t border-gray-100">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-1">Current Password</label>
                         <input 
                           type="password" 
                           required 
                           value={passwordForm.currentPassword}
                           onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                           className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                         />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-1">New Password</label>
                           <input 
                             type="password" 
                             required 
                             value={passwordForm.newPassword}
                             onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                             className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-1">Confirm New</label>
                           <input 
                             type="password" 
                             required 
                             value={passwordForm.confirmPassword}
                             onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                             className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                           />
                         </div>
                       </div>
                       <button 
                         type="submit" 
                         disabled={passwordLoading}
                         className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                       >
                         {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                         Update Password
                       </button>
                     </form>
                   </motion.div>
                 )}
               </AnimatePresence>

               <p className="text-sm text-gray-500 leading-relaxed font-medium">
                 Keep your login credentials private. If you notice any suspicious activity, please change your password immediately or contact our support team.
               </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
