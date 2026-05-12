import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Save, X, Pencil, Search, Camera, Loader2 } from "lucide-react";
import * as api from "@/api";
import { toast } from "sonner";

interface MenuEditorProps {
  menu: any[];
  onSave: (menu: any[]) => void;
  saving: boolean;
}

const RestaurantMenuEditor = ({ menu, onSave, saving }: MenuEditorProps) => {
  const [items, setItems] = useState<any[]>(menu || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ id: "", name: "", description: "", price: 0, image: "", category: "", isVeg: true, isBestseller: false });
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const handleImageUpload = async (file: File, itemId: string | "new") => {
    const formData = new FormData();
    formData.append("image", file);
    setUploadingImage(itemId);
    try {
      const res: any = await api.uploadMenuImage(formData);
      if (res.status === "success") {
        if (itemId === "new") {
          setNewItem({ ...newItem, image: res.data.url });
        } else {
          handleUpdateItem(itemId, "image", res.data.url);
        }
        toast.success("Image uploaded!");
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingImage(null);
    }
  };

  const hasChanges = JSON.stringify(items) !== JSON.stringify(menu);

  const handleUpdateItem = (id: string, field: string, value: any) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
    toast.success("Item removed (save to apply)");
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price) { toast.error("Name and price required"); return; }
    setItems([...items, { ...newItem, id: Date.now().toString(), price: Number(newItem.price) }]);
    setNewItem({ id: "", name: "", description: "", price: 0, image: "", category: "", isVeg: true, isBestseller: false });
    setShowAddForm(false);
    toast.success("Item added (save to apply)");
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search menu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? "Cancel" : "Add Item"}
          </button>
          {hasChanges && (
            <motion.button initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={() => onSave(items)} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl text-sm font-black shadow-lg disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
            </motion.button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-dashed border-emerald-300 p-5 space-y-3">
              <h4 className="text-sm font-black text-gray-900">Add New Item</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Name *" className="px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-200 font-medium" />
                <input type="number" value={newItem.price || ""} onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })} placeholder="Price *" className="px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-200 font-medium" />
                <input value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} placeholder="Category" className="px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-200 font-medium" />
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "new")} 
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <div className="px-3 py-2 bg-gray-50 rounded-xl text-sm border border-transparent group-hover:border-emerald-200 flex items-center justify-between transition-all">
                    <span className="text-gray-400 truncate max-w-[120px]">{newItem.image ? "Image Selected" : "Upload Image"}</span>
                    {uploadingImage === "new" ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> : <Camera className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Description" className="flex-1 px-3 py-2 bg-gray-50 rounded-xl text-sm outline-none font-medium" />
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={newItem.isVeg} onChange={(e) => setNewItem({ ...newItem, isVeg: e.target.checked })} className="rounded" /> Veg
                </label>
                <button onClick={handleAddItem} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600">Add</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {categories.map((category) => {
        const catItems = filteredItems.filter((i) => i.category === category);
        if (!catItems.length) return null;
        return (
          <div key={category} className="space-y-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">{category}</h3>
            {catItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm group">
                <div className={`w-3 h-3 rounded-sm border-2 ${item.isVeg ? "border-green-500" : "border-red-500"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full m-[1px] ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                </div>
                {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  {editingId === item.id ? (
                    <input value={item.name} onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)} className="text-sm font-bold bg-blue-50 px-2 py-1 rounded-lg outline-none w-full" />
                  ) : (
                    <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                  )}
                  <p className="text-[10px] text-gray-400 truncate">{item.description}</p>
                </div>
                {editingId === item.id ? (
                  <input type="number" value={item.price} onChange={(e) => handleUpdateItem(item.id, "price", Number(e.target.value))} className="w-20 text-sm font-black bg-blue-50 px-2 py-1 rounded-lg outline-none text-right" />
                ) : (
                  <span className="text-sm font-black text-gray-900">₹{item.price}</span>
                )}
                
                {editingId === item.id && (
                  <div className="relative group">
                    <input 
                      type="file" 
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], item.id)} 
                      accept="image/*"
                      className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer z-10" 
                    />
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                      {uploadingImage === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                )}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingId(editingId === item.id ? null : item.id)} className={`p-2 rounded-lg ${editingId === item.id ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-400"}`}>
                    {editingId === item.id ? <Save className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => handleDeleteItem(item.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {filteredItems.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400 font-bold">No menu items found</p>
        </div>
      )}
    </div>
  );
};

export default RestaurantMenuEditor;
