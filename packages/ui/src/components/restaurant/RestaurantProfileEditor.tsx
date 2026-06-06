import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Save, MapPin, Clock, IndianRupee, Utensils, CheckCircle2, Loader2 } from "lucide-react";
import * as api from "@/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileEditorProps {
  restaurant: any;
  onUpdate: (updated: any) => void;
}

const RestaurantProfileEditor = ({ restaurant, onUpdate }: ProfileEditorProps) => {
  const [formData, setFormData] = useState({
    name: restaurant.name || "",
    cuisines: restaurant.cuisines?.join(", ") || "",
    deliveryTime: restaurant.deliveryTime || "",
    priceForTwo: restaurant.priceForTwo || "",
    distance: restaurant.distance || "",
    isVeg: restaurant.isVeg || false,
  });
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(restaurant.image || null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value.toString());
    });
    if (image) {
      data.append("image", image);
    }

    try {
      const res: any = await api.updateRestaurantProfile(data);
      if (res.status === "success") {
        toast.success("Profile updated successfully!");
        onUpdate(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Banner Image Section */}
        <div className="relative">
          <div className="h-48 md:h-64 rounded-3xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 group relative">
            {preview ? (
              <img src={preview} alt="Banner" className="w-full h-full object-cover transition-all group-hover:brightness-90" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                <Camera className="w-10 h-10" />
                <span className="font-bold text-sm">Upload Restaurant Banner</span>
              </div>
            )}
            
            <label className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                <span className="text-xs font-black text-gray-900 uppercase">Change Banner</span>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
          
          {/* Status Badge */}
          <div className="absolute -bottom-4 left-8 bg-white px-4 py-2 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${restaurant.acceptsOrders ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
            <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
              {restaurant.acceptsOrders ? "Live & Accepting Orders" : "Currently Offline"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Restaurant Name</Label>
              <div className="relative">
                <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="The Gourmet Kitchen" 
                  className="pl-10 h-12 bg-white border-gray-200 rounded-2xl text-sm font-bold focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Cuisines (Comma Separated)</Label>
              <Input 
                value={formData.cuisines} 
                onChange={(e) => setFormData({ ...formData, cuisines: e.target.value })}
                placeholder="Italian, Mexican, Continental" 
                className="h-12 bg-white border-gray-200 rounded-2xl text-sm font-bold focus:ring-primary/20"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Price for Two</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    type="number"
                    value={formData.priceForTwo} 
                    onChange={(e) => setFormData({ ...formData, priceForTwo: e.target.value })}
                    className="pl-10 h-12 bg-white border-gray-200 rounded-2xl text-sm font-bold focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Delivery Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    value={formData.deliveryTime} 
                    onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                    placeholder="30-40 mins"
                    className="pl-10 h-12 bg-white border-gray-200 rounded-2xl text-sm font-bold focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Distance (km)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  type="number"
                  step="0.1"
                  value={formData.distance} 
                  onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                  className="pl-10 h-12 bg-white border-gray-200 rounded-2xl text-sm font-bold focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={formData.isVeg} 
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-12 h-6 rounded-full transition-colors ${formData.isVeg ? "bg-green-500" : "bg-gray-200"}`} />
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.isVeg ? "translate-x-6" : ""}`} />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 group-hover:text-green-600 transition-colors">Pure Vegetarian Restaurant</p>
                  <p className="text-[10px] font-bold text-gray-400">Enable this if your restaurant only serves veg food</p>
                </div>
              </label>
            </div>

            <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm h-fit">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-gray-900 uppercase">Verification Tip</p>
                <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
                  Make sure your banner image is high quality (min 1200x400px). Clear branding helps customers find you easily!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
          <button 
            type="button" 
            className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-black text-gray-400 hover:bg-gray-50 transition-colors"
          >
            Reset Changes
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-orange-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? "Updating Profile..." : "Save Profile Details"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RestaurantProfileEditor;
