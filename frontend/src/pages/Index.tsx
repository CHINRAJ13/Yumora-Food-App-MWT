import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, ArrowRight, ChevronLeft, ChevronRight, TrendingUp, Zap, Store, Utensils, Star, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as api from "@/api";
import RestaurantCard from "@/components/RestaurantCard";
import CategoryChip from "@/components/CategoryChip";
import { Skeleton } from "@/components/ui/skeleton";
import TrendingItem from "@/components/TrendingItem";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeCategory, setActiveCategory] = useState<string | null>(searchParams.get("category"));
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [vegOnly, setVegOnly] = useState(false);
  const [nonVegOnly, setNonVegOnly] = useState(false);

  // Sync state to URL
  useEffect(() => {
    const params: any = {};
    if (activeCategory) params.category = activeCategory;
    if (searchQuery) params.search = searchQuery;
    setSearchParams(params, { replace: true });
  }, [activeCategory, searchQuery, setSearchParams]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [restRes, catRes, banRes]: any = await Promise.all([
        api.getRestaurants(),
        api.getCategories(),
        api.getBanners()
      ]);
      
      if (restRes.status === 'success') setRestaurants(restRes.data || []);
      if (catRes.status === 'success') setCategories(catRes.data || []);
      if (banRes.status === 'success') setBanners(banRes.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load content. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setBannerIndex((i) => (i + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const filteredRestaurants = useMemo(() => {
    let list = [...restaurants];
    if (vegOnly) list = list.filter((r) => r.isVeg);
    if (nonVegOnly) list = list.filter((r) => !r.isVeg);
    if (activeCategory) {
      list = list.filter((r) =>
        r.cuisines?.some((c: string) => c.toLowerCase().includes(activeCategory.toLowerCase())) ||
        r.menu?.some((m: any) => m.category.toLowerCase().includes(activeCategory.toLowerCase()))
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisines?.some((c: string) => c.toLowerCase().includes(q)) ||
          r.menu?.some((m: any) => m.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [restaurants, activeCategory, searchQuery, vegOnly, nonVegOnly]);

  const trendingItems = useMemo(() => {
    return restaurants.flatMap((r) =>
      (r.menu || [])
        .filter((m: any) => m.isBestseller)
        .map((m: any) => ({ item: m, restaurantId: r._id || r.id, restaurantName: r.name }))
    ).slice(0, 10);
  }, [restaurants]);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center pt-6 pb-12 sm:pt-10 sm:pb-20 overflow-hidden bg-gradient-to-b from-orange-50/50 to-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-amber-400/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px]" />
        
        <div className="container mx-auto px-4 relative z-10 w-full max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 sm:gap-16 lg:gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left pt-6 sm:pt-10 lg:pt-0 w-full"
            >
              <div className="inline-flex items-center gap-2 bg-white/80 text-gray-800 text-[11px] sm:text-xs font-black px-4 py-2 rounded-full mb-6 border border-white/40 shadow-sm uppercase tracking-[0.2em]">
                <div className="flex bg-orange-100 p-1.5 rounded-full">
                  <Star className="w-3.5 h-3.5 text-orange-500 fill-current animate-pulse" />
                </div>
                Premium Delivery in Coimbatore
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-gray-900 tracking-tight leading-[1.05] mb-6">
                Crave it. <br/>
                <span className="text-orange-600 italic">Pro</span> Mode.
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-lg leading-relaxed font-medium">
                Experience culinary perfection from Coimbatore's finest. Delivered with absolute precision and speed.
              </p>

              <div className="w-full max-w-xl relative group mb-10">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-10 group-focus-within:opacity-25 transition duration-500"></div>
                <div className="relative flex items-center w-full bg-white rounded-2xl shadow-2xl shadow-gray-200/50 overflow-hidden p-2 border border-gray-100">
                  <div className="pl-4">
                    <Search className="w-6 h-6 text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search for restaurants, cuisines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-4 py-4 bg-transparent text-lg outline-none text-gray-900 placeholder:text-gray-400 font-bold"
                  />
                  <button 
                    onClick={() => navigate(`/restaurants?search=${encodeURIComponent(searchQuery)}`)}
                    className="gradient-primary text-white px-8 py-4 rounded-xl text-base font-black shadow-lg active:scale-95 whitespace-nowrap uppercase tracking-widest"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="flex gap-6 items-center">
                <div className="flex -space-x-3">
                  {[10, 11, 12, 13].map((img, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                      <img src={`https://i.pravatar.cc/100?img=${img}`} alt="User" />
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-orange-100 flex items-center justify-center text-[10px] font-black text-orange-600 tracking-tighter">
                    50+
                  </div>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1 text-orange-500 mb-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Coimbatore's Favorite</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:w-1/2 relative flex justify-center mt-10 lg:mt-0 w-full"
            >
              <div className="relative w-full max-w-lg lg:w-[500px]">
                <div className="relative z-10 w-full h-[450px] lg:h-[550px]">
                  <div className="relative w-full h-full rounded-[3.5rem] overflow-hidden shadow-2xl border-8 border-white bg-white group transition-all duration-500 hover:scale-105">
                    <img 
                      src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2000" 
                      alt="Delicious Food" 
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  </div>

                  <motion.div 
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-6 -right-6 lg:-right-10 bg-white/90 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-white flex items-center gap-4 z-20"
                  >
                    <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Zap className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instant</p>
                      <p className="text-lg font-black text-gray-900 leading-tight">Delivery</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Banners */}
      <section className="container mx-auto px-4 mb-12">
        <div className="relative min-h-[160px] md:min-h-[200px]">
          {loading && banners.length === 0 ? (
             <Skeleton className="w-full h-[160px] md:h-[200px] rounded-3xl" />
          ) : banners.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={bannerIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                className={`rounded-3xl p-6 md:p-10 bg-gradient-to-r ${banners[bannerIndex].gradient} text-primary-foreground relative overflow-hidden h-full`}
              >
                <div className="relative">
                  <p className="text-xs font-bold text-primary-foreground/60 tracking-widest uppercase mb-2">Limited Time Offer</p>
                  <p className="text-3xl md:text-4xl font-black">{banners[bannerIndex].title}</p>
                  <p className="text-primary-foreground/80 mt-2 text-sm md:text-base max-w-md">{banners[bannerIndex].subtitle}</p>
                  <p className="mt-4 text-sm font-mono bg-primary-foreground/20 inline-block px-4 py-2 rounded-xl backdrop-blur-sm font-bold tracking-wider">
                    {banners[bannerIndex].code}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* Trending Section */}
      <section className="container mx-auto px-4 mb-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center shadow-lg">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">Trending <span className="gradient-text italic">Now</span></h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Most loved in Coimbatore</p>
            </div>
          </div>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x">
          {trendingItems.map((t: any, i: number) => (
            <TrendingItem key={t.item._id || t.item.id} item={t.item} restaurantId={t.restaurantId} restaurantName={t.restaurantName} index={i} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 mb-20">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-6">
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter">What's on your <span className="text-primary">mind?</span></h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setVegOnly(!vegOnly); setNonVegOnly(false); }}
              className={`px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${vegOnly ? "bg-green-50 border-green-200 text-green-800" : "bg-white border-gray-200 text-gray-600"}`}
            >
              Veg Only
            </button>
            <button
              onClick={() => { setNonVegOnly(!nonVegOnly); setVegOnly(false); }}
              className={`px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${nonVegOnly ? "bg-red-50 border-red-200 text-red-800" : "bg-white border-gray-200 text-gray-600"}`}
            >
              Non Veg
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-8 scrollbar-hide snap-x">
          {loading && categories.length === 0 ? (
             Array.from({ length: 8 }).map((_, i) => (
               <Skeleton key={i} className="h-24 w-24 rounded-2xl shrink-0" />
             ))
          ) : categories.map((cat) => (
            <CategoryChip
              key={cat._id || cat.id}
              category={cat}
              isActive={activeCategory === cat.name}
              onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
            />
          ))}
        </div>
      </section>

      {/* Restaurants */}
      <section className="container mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {activeCategory ? `${activeCategory} in Coimbatore` : searchQuery ? "Search Results" : "Top Picks in Coimbatore"}
          </h2>
          <Link to="/restaurants" className="text-sm font-semibold text-primary flex items-center gap-1">
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loading && restaurants.length === 0 ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : error ? (
            <div className="col-span-full text-center py-20">
               <RefreshCw className="w-12 h-12 text-red-500 mx-auto mb-4" />
               <h3 className="text-xl font-black text-gray-900">Connection Issues</h3>
               <p className="text-gray-500 mb-8">{error}</p>
               <button onClick={fetchData} className="gradient-primary text-white px-8 py-3 rounded-2xl font-black">
                 Try Again
               </button>
            </div>
          ) : (
            filteredRestaurants.map((restaurant, i) => (
              <RestaurantCard key={restaurant._id || restaurant.id} restaurant={restaurant} index={i} />
            ))
          )}
        </div>
      </section>

      {/* App CTA */}
      <section className="container mx-auto px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="gradient-primary rounded-3xl p-8 md:p-12 text-primary-foreground text-center relative overflow-hidden"
        >
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-black mb-2">Get ₹100 OFF Your First Order!</h3>
            <p className="text-primary-foreground/80 mb-6">Use code <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded-lg">YUMORA100</span> at checkout</p>
            <Link
              to="/restaurants"
              className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-3.5 rounded-2xl shadow-lg"
            >
              <Utensils className="w-4 h-4" /> Order Now
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
