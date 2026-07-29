import { useState, useEffect } from "react";
import * as api from "@/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Plus, Search, Mail, UserCheck, UserX, Clock, ShieldAlert } from "lucide-react";

const PERMISSIONS = [
  { id: 'monitor_orders', label: 'Monitor Orders' },
  { id: 'manage_restaurants', label: 'Manage Restaurants' },
  { id: 'manage_users', label: 'Manage Users' },
  { id: 'manage_approvals', label: 'Manage Approvals' },
  { id: 'manage_catalog', label: 'Manage Catalog' },
  { id: 'view_analytics', label: 'View Analytics' },
  { id: 'super_admin', label: 'Super Admin (Full Access)' }
];

const statusBadge: Record<string, { bg: string; text: string; icon: any }> = {
  active: { bg: "bg-green-50", text: "text-green-600", icon: UserCheck },
  pending: { bg: "bg-orange-50", text: "text-orange-600", icon: Clock },
  suspended: { bg: "bg-red-50", text: "text-red-600", icon: UserX },
};

const AdminManagement = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    permissions: [] as string[],
    status: 'active'
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.getAdmins();
      setAdmins(res.data);
    } catch {
      toast.error("Failed to fetch admin users");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => {
      const perms = prev.permissions;
      if (perms.includes(permissionId)) {
        return { ...prev, permissions: perms.filter(p => p !== permissionId) };
      } else {
        return { ...prev, permissions: [...perms, permissionId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAdmin) {
        await api.updateAdminPermissions(editingAdmin._id, {
          permissions: formData.permissions,
          status: formData.status
        });
        toast.success("Admin permissions updated successfully");
      } else {
        if (!formData.name || !formData.email || !formData.password) {
          return toast.error("Please fill all required fields");
        }
        await api.createAdmin(formData);
        toast.success("Admin created successfully");
      }
      setShowModal(false);
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save admin");
    }
  };

  const openCreateModal = () => {
    setEditingAdmin(null);
    setFormData({ name: '', email: '', password: '', permissions: [], status: 'active' });
    setShowModal(true);
  };

  const openEditModal = (admin: any) => {
    setEditingAdmin(admin);
    setFormData({ 
      name: admin.name, 
      email: admin.email, 
      password: '', // Don't allow password editing here for simplicity
      permissions: admin.permissions || [],
      status: admin.status || 'active'
    });
    setShowModal(true);
  };

  const filtered = admins.filter(
    (u) =>
       u.name?.toLowerCase().includes(search.toLowerCase()) ||
       u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search admins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-80 outline-none"
          />
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Admin
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 text-left">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Admin Info</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Contact</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Permissions</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {filtered.map((admin) => (
                  <motion.tr
                    key={admin._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50/30 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-black text-primary text-sm">
                          {admin.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{admin.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">ID: {admin._id.substring(admin._id.length - 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {admin.email}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {admin.permissions?.includes('super_admin') ? (
                          <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-purple-50 text-purple-600 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Full Access
                          </span>
                        ) : admin.permissions?.length > 0 ? (
                          admin.permissions.map((p: string) => (
                            <span key={p} className="px-2 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600">
                              {p.replace('manage_', '').replace('monitor_', '').replace('view_', '')}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No specific permissions</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${(statusBadge[admin.status] || statusBadge['active']).bg} ${(statusBadge[admin.status] || statusBadge['active']).text}`}>
                        {(() => {
                          const StatusIcon = (statusBadge[admin.status] || statusBadge['active']).icon;
                          return <StatusIcon className="w-3 h-3" />;
                        })()}
                        <span className="text-[10px] font-black uppercase tracking-wider">{admin.status || 'active'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <button
                        onClick={() => openEditModal(admin)}
                        className="text-xs font-bold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl transition-colors"
                      >
                        Edit Access
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {filtered.length === 0 && !loading && (
            <div className="text-center py-20">
              <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold">No admin users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900">
                {editingAdmin ? 'Edit Admin Access' : 'Create New Admin'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 font-black text-xl px-2">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="adminForm" onSubmit={handleSubmit} className="space-y-5">
                {!editingAdmin && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="Admin Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="admin@yumora.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="Secure password"
                      />
                    </div>
                  </>
                )}

                {editingAdmin && (
                  <div className="bg-gray-50 p-4 rounded-2xl mb-4">
                    <p className="text-sm font-bold text-gray-900">{formData.name}</p>
                    <p className="text-xs text-gray-500">{formData.email}</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Permissions</label>
                  <div className="space-y-2">
                    {PERMISSIONS.map(perm => (
                      <label key={perm.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm.id)}
                          onChange={() => handlePermissionToggle(perm.id)}
                          className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary"
                        />
                        <span className={`text-sm font-medium ${perm.id === 'super_admin' ? 'text-purple-600 font-bold' : 'text-gray-700'}`}>
                          {perm.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {editingAdmin && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none text-gray-700"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                )}
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-2xl text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="adminForm"
                className="bg-primary text-white px-6 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
              >
                {editingAdmin ? 'Save Changes' : 'Create Admin'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
