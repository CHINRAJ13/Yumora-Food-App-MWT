import { useParams, Link } from "react-router-dom";
import { Star, Clock, MapPin, ArrowLeft, ShoppingCart, Search, Info, Loader2, RefreshCw } from "lucide-react";
import MenuItemCard from "@/components/MenuItemCard";
import Navbar from "@/components/Navbar";
import { useCartStore } from "@/store/useCartStore";
import { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as api from "@/api";

const RestaurantDetail = () => {
  const { id } = useParams();
  const { totalItems: getTotalItems, totalPrice: getTotalPrice } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [menuSearch, setMenuSearch] = useState("");

  const fetchRestaurant = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.getRestaurantById(id);
      if (res.status === 'success') {
        setRestaurant(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Restaurant not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  const categories = useMemo((): string[] => {
    if (!restaurant) return [];
    return [...new Set(restaurant.menu.map((m: any) => m.category))] as string[];
  }, [restaurant]);

  const filteredMenu = useMemo(() => {
    let items = restaurant?.menu || [];
    if (activeCategory) items = items.filter((m: any) => m.category === activeCategory);
    if (vegFilter === 'veg') items = items.filter((m: any) => m.isVeg);
    if (vegFilter === 'nonveg') items = items.filter((m: any) => !m.isVeg);
    if (menuSearch.trim()) {
      const q = menuSearch.toLowerCase();
      items = items.filter((m: any) => 
        m.name.toLowerCase().includes(q) || 
        m.description.toLowerCase().includes(q)
      );
    }
    return items;
  }, [restaurant, activeCategory, vegFilter, menuSearch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">Loading restaurant details...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Restaurant not found</h2>
          <p className="text-gray-500 mb-8 max-w-sm font-medium">{error || "The requested restaurant is currently unavailable."}</p>
          <Link to="/restaurants" className="bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg">
            Back to Restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      {/* Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-36 md:h-48 overflow-hidden"
      >
        <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute top-0 left-0 right-0 p-6 container mx-auto">
          <Link to="/restaurants" className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white mb-3 transition-colors drop-shadow-md">
            <ArrowLeft className="w-4 h-4" /> All Restaurants
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-2xl tracking-tighter">
            {restaurant.name}
          </h1>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 -mt-8 md:-mt-10 relative z-10">
        {/* Info Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-3xl p-6 shadow-xl border border-white/20 mb-8"
        >
          <div className="flex justify-between items-start gap-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-gray-500 text-sm font-medium">{restaurant.cuisines?.join(", ")}</p>
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
              </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-full font-bold shadow-md">
                {restaurant.rating} <Star className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-4 border-t border-dashed border-gray-200 text-sm font-bold text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{restaurant.deliveryTime} mins</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{restaurant.location?.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">₹</span>
              <span>{restaurant.priceForTwo} for two</span>
            </div>
          </div>
        </motion.div>

        {/* Menu Controls */}
        <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-lg py-4 -mx-4 px-4 mb-4 border-b border-white/10 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder={`Search in ${restaurant.name}`}
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl text-sm font-medium border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl self-start md:self-auto">
              <button
                onClick={() => setVegFilter(vegFilter === 'veg' ? 'all' : 'veg')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  vegFilter === 'veg' ? "bg-white text-green-700 shadow-sm border border-green-100" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Veg
              </button>
              <button
                onClick={() => setVegFilter(vegFilter === 'nonveg' ? 'all' : 'nonveg')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  vegFilter === 'nonveg' ? "bg-white text-red-700 shadow-sm border border-red-100" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Non-Veg
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                !activeCategory ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              All
            </button>
            {categories.map((cat: string) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  activeCategory === cat ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-8 pt-2">
          <AnimatePresence mode="popLayout">
            {filteredMenu.map((item: any) => (
              <motion.div
                key={item._id || item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <MenuItemCard item={item} restaurantId={restaurant.id} restaurantName={restaurant.name} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-16 lg:bottom-4 left-0 right-0 z-40 px-4"
          >
            <Link
              to="/cart"
              className="container mx-auto max-w-lg flex items-center justify-between gradient-primary text-primary-foreground rounded-2xl px-6 py-4 shadow-elevated"
            >
              <span className="font-bold">{totalItems} item{totalItems > 1 ? "s" : ""} | ₹{totalPrice}</span>
              <span className="flex items-center gap-2 font-bold">
                View Cart <ShoppingCart className="w-5 h-5" />
              </span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestaurantDetail;
