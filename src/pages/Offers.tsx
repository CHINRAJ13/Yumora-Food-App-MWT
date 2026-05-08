import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/api";
import { Skeleton } from "@/components/ui/skeleton";

const Offers = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/banners");
      setBanners(data);
    } catch (err) {
      console.error("Error fetching banners:", err);
      setError("Failed to load offers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon ${code} copied!`);
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">Offers & Coupons</h1>
        <p className="text-muted-foreground text-sm mb-6">Use these coupon codes at checkout</p>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-[140px] rounded-2xl" />
              ))
            ) : banners.length > 0 ? (
              banners.map((banner, i) => (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-gradient-to-r ${banner.gradient} rounded-2xl p-6 text-primary-foreground`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Tag className="w-5 h-5 mb-2 opacity-80" />
                      <h3 className="text-2xl font-black">{banner.title}</h3>
                      <p className="text-primary-foreground/80 mt-1">{banner.subtitle}</p>
                    </div>
                    <button
                      onClick={() => copyCoupon(banner.code)}
                      className="flex items-center gap-1.5 bg-primary-foreground/20 backdrop-blur-sm text-sm font-bold px-4 py-2 rounded-xl hover:bg-primary-foreground/30 transition-colors"
                    >
                      <span className="font-mono">{banner.code}</span>
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : error ? (
              <div className="text-center py-20 bg-red-50/50 rounded-3xl border border-red-100 flex flex-col items-center">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Could not load offers</h3>
                <p className="text-sm text-gray-500 mb-6">{error}</p>
                <button 
                  onClick={fetchBanners}
                  className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all text-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-2xl">
                <Tag className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>No offers available at the moment.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Extra coupons */}
        <div className="mt-8 bg-card rounded-2xl shadow-card p-5">
          <h3 className="font-bold text-card-foreground mb-4">More Codes</h3>
          {[
            { code: "SAVE20", desc: "20% OFF on orders above ₹200" },
          ].map((c) => (
            <div key={c.code} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
              <div>
                <span className="font-mono font-bold text-primary">{c.code}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
              </div>
              <button
                onClick={() => copyCoupon(c.code)}
                className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Offers;
