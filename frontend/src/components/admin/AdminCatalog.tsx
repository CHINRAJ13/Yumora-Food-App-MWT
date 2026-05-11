import { useState, useEffect } from "react";
import {
  getAdminCategories,
  createAdminCategory,
  deleteAdminCategory,
  getAdminBanners,
  createAdminBanner,
  deleteAdminBanner,
} from "@/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X, Tag, Image, Sparkles } from "lucide-react";

const AdminCatalog = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Category form
  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", emoji: "🍕" });

  // Banner form
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    code: "",
    gradient: "from-orange-500 to-pink-500",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [catRes, banRes] = await Promise.all([
        getAdminCategories(),
        getAdminBanners(),
      ]);
      setCategories(catRes.data);
      setBanners(banRes.data);
    } catch {
      toast.error("Failed to fetch catalog data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAdminCategory(catForm);
      toast.success("Category created");
      setShowCatModal(false);
      setCatForm({ name: "", emoji: "🍕" });
      fetchAll();
    } catch {
      toast.error("Failed to create category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteAdminCategory(id);
      toast.success("Category deleted");
      fetchAll();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAdminBanner(bannerForm);
      toast.success("Banner created");
      setShowBannerModal(false);
      setBannerForm({
        title: "",
        subtitle: "",
        code: "",
        gradient: "from-orange-500 to-pink-500",
      });
      fetchAll();
    } catch {
      toast.error("Failed to create banner");
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await deleteAdminBanner(id);
      toast.success("Banner deleted");
      fetchAll();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const gradientPresets = [
    "from-orange-500 to-pink-500",
    "from-emerald-500 to-teal-500",
    "from-blue-500 to-indigo-500",
    "from-purple-500 to-pink-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-red-500",
  ];

  return (
    <div className="space-y-10">
      {/* ── Categories Section ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Tag className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Categories</h2>
              <p className="text-xs text-gray-400 font-medium">
                {categories.length} categories
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCatModal(true)}
            className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-2xl font-bold text-sm hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <AnimatePresence>
            {categories.map((cat) => (
              <motion.div
                key={cat.id || cat._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl border border-gray-100 p-4 text-center group relative shadow-md shadow-gray-100/50"
              >
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <span className="text-3xl block mb-2">{cat.emoji}</span>
                <p className="text-xs font-black text-gray-700 truncate">
                  {cat.name}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Banners Section ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center">
              <Image className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Banners</h2>
              <p className="text-xs text-gray-400 font-medium">
                {banners.length} banners
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBannerModal(true)}
            className="inline-flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-2xl font-bold text-sm hover:bg-purple-600 transition-colors shadow-lg shadow-purple-500/25"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {banners.map((banner) => (
              <motion.div
                key={banner.id || banner._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative bg-gradient-to-r ${banner.gradient} rounded-[2rem] p-6 text-white shadow-xl group overflow-hidden`}
              >
                <Sparkles className="absolute top-4 right-4 w-8 h-8 text-white/20" />
                <button
                  onClick={() => handleDeleteBanner(banner.id)}
                  className="absolute top-3 right-3 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <h3 className="font-black text-xl mb-1">{banner.title}</h3>
                <p className="text-white/80 text-sm font-medium mb-3">
                  {banner.subtitle}
                </p>
                <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black tracking-wider">
                  {banner.code}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Category Modal ── */}
      <AnimatePresence>
        {showCatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCatModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900">
                  Add Category
                </h3>
                <button
                  onClick={() => setShowCatModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                    Name
                  </label>
                  <input
                    required
                    value={catForm.name}
                    onChange={(e) =>
                      setCatForm({ ...catForm, name: e.target.value })
                    }
                    placeholder="e.g. Pizza"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                    Emoji
                  </label>
                  <input
                    required
                    value={catForm.emoji}
                    onChange={(e) =>
                      setCatForm({ ...catForm, emoji: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-500 text-white py-3 rounded-2xl font-black text-sm hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25"
                >
                  Create Category
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Banner Modal ── */}
      <AnimatePresence>
        {showBannerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBannerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900">
                  Add Banner
                </h3>
                <button
                  onClick={() => setShowBannerModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleCreateBanner} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                    Title
                  </label>
                  <input
                    required
                    value={bannerForm.title}
                    onChange={(e) =>
                      setBannerForm({ ...bannerForm, title: e.target.value })
                    }
                    placeholder="50% OFF on all Burgers"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                    Subtitle
                  </label>
                  <input
                    required
                    value={bannerForm.subtitle}
                    onChange={(e) =>
                      setBannerForm({ ...bannerForm, subtitle: e.target.value })
                    }
                    placeholder="Use code to get discount"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                    Promo Code
                  </label>
                  <input
                    required
                    value={bannerForm.code}
                    onChange={(e) =>
                      setBannerForm({ ...bannerForm, code: e.target.value })
                    }
                    placeholder="BURGER50"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                    Gradient
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {gradientPresets.map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() =>
                          setBannerForm({ ...bannerForm, gradient: g })
                        }
                        className={`w-10 h-10 rounded-xl bg-gradient-to-r ${g} transition-all ${
                          bannerForm.gradient === g
                            ? "ring-2 ring-offset-2 ring-gray-900 scale-110"
                            : "hover:scale-105"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-purple-500 text-white py-3 rounded-2xl font-black text-sm hover:bg-purple-600 transition-colors shadow-lg shadow-purple-500/25 mt-2"
                >
                  Create Banner
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCatalog;
