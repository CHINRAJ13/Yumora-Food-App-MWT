import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import RestaurantCard from "@/components/RestaurantCard";
import CategoryChip from "@/components/CategoryChip";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, ChevronDown, RefreshCw } from "lucide-react";
import * as api from "@/api";
import { Skeleton } from "@/components/ui/skeleton";
import Footer from "@/components/Footer";

type SortOption = "rating" | "deliveryTime" | "priceForTwo" | "distance";

const Restaurants = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize state from URL params
  const [activeCategory, setActiveCategory] = useState<string | null>(searchParams.get("category"));
  const [vegOnly, setVegOnly] = useState(searchParams.get("isVeg") === "true");
  const [nonVegOnly, setNonVegOnly] = useState(searchParams.get("isVeg") === "false");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get("sort") as SortOption) || "rating");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));
  
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8;

  // Sync state changes to URL
  useEffect(() => {
    const params: any = { page: currentPage.toString() };
    if (search) params.search = search;
    if (activeCategory) params.category = activeCategory;
    if (vegOnly) params.isVeg = "true";
    if (nonVegOnly) params.isVeg = "false";
    if (sortBy !== "rating") params.sort = sortBy;
    
    setSearchParams(params, { replace: true });
  }, [currentPage, search, activeCategory, vegOnly, nonVegOnly, sortBy, setSearchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build params for backend filtering/pagination
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy === "rating" ? "-rating" : 
              sortBy === "priceForTwo" ? "priceForTwo" :
              sortBy === "deliveryTime" ? "deliveryTime" : "distance"
      };

      if (search) params.search = search;
      if (activeCategory) params.category = activeCategory;
      if (vegOnly) params.isVeg = "true";
      if (nonVegOnly) params.isVeg = "false";
      // minRating is currently handled on frontend or we could add to backend
      
      const [restRes, catRes]: any = await Promise.all([
        api.getRestaurants(params),
        api.getCategories()
      ]);
      
      if (restRes.status === 'success') {
        setRestaurants(restRes.data);
        if (restRes.meta) {
          setTotalPages(restRes.meta.totalPages);
          setTotalItems(restRes.meta.total);
        }
      }
      if (catRes.status === 'success') setCategories(catRes.data);
    } catch (err: any) {
      setError(err.message || "Failed to load restaurants. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, search, activeCategory, vegOnly, nonVegOnly]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeCategory, vegOnly, nonVegOnly, sortBy]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Frontend still handles minRating for now as it's a simple secondary filter
  const filteredRestaurants = useMemo(() => {
    if (minRating === 0) return restaurants;
    return restaurants.filter(r => r.rating >= minRating);
  }, [restaurants, minRating]);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Restos in Coimbatore</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {totalItems} locations currently delivering
            </p>
          </motion.div>

          <div className="relative w-full max-w-md group">
            <div className="relative flex items-center w-full bg-white rounded-2xl border border-gray-100 shadow-sm focus-within:shadow-md transition-all overflow-hidden p-1">
              <div className="pl-3">
                <Search className="w-4 h-4 text-gray-400 group-focus-within:text-primary" />
              </div>
              <input
                type="text"
                placeholder="Search cuisines or restaurants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-3 pr-4 py-3 bg-transparent text-sm outline-none text-gray-900 placeholder:text-gray-400 font-medium"
              />
            </div>
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 overflow-hidden">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-100" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Filter by Cuisine</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-100" />
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x">
            {loading && categories.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
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
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-50">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 w-full">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-xl mr-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Filters</span>
            </div>

            <button
              onClick={() => { setVegOnly(!vegOnly); setNonVegOnly(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${
                vegOnly ? "bg-green-50 border-green-200 text-green-700 shadow-md" : "bg-white border-gray-200 text-gray-600"
              }`}
            >
              Veg Only
            </button>

            <button
              onClick={() => { setNonVegOnly(!nonVegOnly); setVegOnly(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${
                nonVegOnly ? "bg-red-50 border-red-200 text-red-700 shadow-md" : "bg-white border-gray-200 text-gray-600"
              }`}
            >
              Non Veg
            </button>

            <button
              onClick={() => setMinRating(minRating === 4 ? 0 : 4)}
              className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${
                minRating === 4 ? "bg-orange-50 border-orange-200 text-orange-700 shadow-md" : "bg-white border-gray-200 text-gray-600"
              }`}
            >
              ★ 4.0+
            </button>
          </div>

          <div className="relative group w-full lg:w-auto min-w-[200px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 pr-10 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer shadow-sm transition-all"
            >
              <option value="rating">Sort by: Customer Rating</option>
              <option value="deliveryTime">Sort by: Delivery Time</option>
              <option value="priceForTwo">Sort by: Price (Low to High)</option>
              <option value="distance">Sort by: Distance</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : error ? (
            <div className="col-span-full text-center py-20">
              <div className="bg-red-50 px-8 py-10 rounded-[2.5rem] border border-red-100 inline-flex flex-col items-center gap-6 max-w-md shadow-sm">
                <RefreshCw className="w-12 h-12 text-red-500" />
                <h3 className="text-xl font-black text-gray-900">Oops! Failed to load</h3>
                <p className="text-red-500/80 font-medium text-sm">{error}</p>
                <button onClick={loadData} className="gradient-primary text-white px-8 py-3 rounded-2xl font-black">
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="col-span-full text-center py-20">
               <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                 <Search className="w-10 h-10 text-gray-300" />
               </div>
               <h3 className="text-xl font-black text-gray-900">No restaurants found</h3>
               <p className="text-gray-500">Try adjusting your filters or search query</p>
            </div>
          ) : (
            filteredRestaurants.map((r, i) => (
              <RestaurantCard key={r._id || r.id} restaurant={r} index={i} />
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ChevronDown className="w-5 h-5 rotate-90" />
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isActive = currentPage === pageNum;
                // Show at most 5 page buttons for better UI if many pages
                if (totalPages > 5 && (pageNum < currentPage - 2 || pageNum > currentPage + 2)) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[44px] h-11 rounded-xl text-sm font-bold transition-all shadow-sm ${
                      isActive
                        ? "gradient-primary text-white shadow-md scale-105"
                        : "bg-white border border-gray-100 text-gray-500 hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ChevronDown className="w-5 h-5 -rotate-90" />
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Restaurants;
