import { useState, useEffect } from "react";
import {
  getAdminRestaurants,
  createAdminRestaurant,
  updateAdminRestaurant,
  deleteAdminRestaurant,
} from "@/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Star,
  Clock,
  Search,
  ChefHat,
  Leaf,
} from "lucide-react";

const emptyForm = {
  name: "",
  image: "",
  rating: 4.0,
  deliveryTime: "25-35 min",
  cuisines: "",
  isVeg: false,
  priceForTwo: 300,
  distance: "2 km",
};

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await getAdminRestaurants();
      setRestaurants(res.data);
    } catch {
      toast.error("Failed to fetch restaurants");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (r: any) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      image: r.image,
      rating: r.rating,
      deliveryTime: r.deliveryTime,
      cuisines: (r.cuisines || []).join(", "),
      isVeg: r.isVeg,
      priceForTwo: r.priceForTwo,
      distance: r.distance || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      cuisines: form.cuisines
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      rating: Number(form.rating),
      priceForTwo: Number(form.priceForTwo),
    };

    try {
      if (editingId) {
        await updateAdminRestaurant(editingId, payload);
        toast.success("Restaurant updated");
      } else {
        await createAdminRestaurant(payload);
        toast.success("Restaurant created");
      }
      setShowModal(false);
      fetchRestaurants();
    } catch {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this restaurant?")) return;
    try {
      await deleteAdminRestaurant(id);
      toast.success("Restaurant deleted");
      fetchRestaurants();
    } catch {
      toast.error("Delete failed");
    }
  };

  const filtered = restaurants.filter((r) =>
    r.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search restaurants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all w-72 outline-none"
          />
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
        >
          <Plus className="w-4 h-4" />
          Add Restaurant
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-[2rem] h-72 animate-pulse border border-gray-100"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-16 text-center">
          <ChefHat className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-bold">No restaurants found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((r) => (
              <motion.div
                key={r.id || r._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden group"
              >
                <div className="relative h-40 bg-gray-100 overflow-hidden">
                  <img
                    src={r.image}
                    alt={r.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e: any) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400";
                    }}
                  />
                  {r.isVeg && (
                    <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Leaf className="w-3 h-3" /> Veg
                    </span>
                  )}
                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(r)}
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-black text-gray-900 text-lg truncate">
                    {r.name}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mt-1 truncate">
                    {(r.cuisines || []).join(", ")}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs font-bold text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {r.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {r.deliveryTime}
                    </span>
                    <span>₹{r.priceForTwo} for two</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900">
                  {editingId ? "Edit Restaurant" : "Add Restaurant"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                    Name
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                    Image URL
                  </label>
                  <input
                    required
                    value={form.image}
                    onChange={(e) =>
                      setForm({ ...form, image: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                      Rating
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={form.rating}
                      onChange={(e) =>
                        setForm({ ...form, rating: +e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                      Price for Two (₹)
                    </label>
                    <input
                      type="number"
                      value={form.priceForTwo}
                      onChange={(e) =>
                        setForm({ ...form, priceForTwo: +e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                      Delivery Time
                    </label>
                    <input
                      value={form.deliveryTime}
                      onChange={(e) =>
                        setForm({ ...form, deliveryTime: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                      Distance
                    </label>
                    <input
                      value={form.distance}
                      onChange={(e) =>
                        setForm({ ...form, distance: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                    Cuisines (comma-separated)
                  </label>
                  <input
                    value={form.cuisines}
                    onChange={(e) =>
                      setForm({ ...form, cuisines: e.target.value })
                    }
                    placeholder="Indian, Chinese, Italian"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isVeg}
                    onChange={(e) =>
                      setForm({ ...form, isVeg: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500/25"
                  />
                  <span className="text-sm font-bold text-gray-700">
                    Pure Veg Restaurant
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full bg-primary text-white py-3 rounded-2xl font-black text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 mt-2"
                >
                  {editingId ? "Update Restaurant" : "Create Restaurant"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminRestaurants;
