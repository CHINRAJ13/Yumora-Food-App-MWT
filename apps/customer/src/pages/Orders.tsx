import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCartStore } from "@/store/useCartStore";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, RotateCcw, ReceiptText, Package, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Footer from "@/components/Footer";
import * as api from "@/api";
import { toast } from "sonner";
import { ReviewModal } from "@/components/ReviewModal";
import { Star } from "lucide-react";

const Orders = () => {
  const { addItem, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "past" ? "past" : "active";
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [reviewOrder, setReviewOrder] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res: any = await api.getMyOrders();
      if (res.status === 'success') {
        setOrders(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch orders");
      toast.error("Failed to load your orders");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    window.scrollTo(0, 0);
  }, [fetchOrders]);

  const activeOrders = orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled");
  const pastOrders = orders.filter(o => o.status === "Delivered" || o.status === "Cancelled");

  const handleReorder = (order: any) => {
    clearCart();
    order.items.forEach((item: any) => {
      addItem(item, order.restaurantId, order.restaurantName);
    });
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-secondary/30 pb-20 lg:pb-0">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <header className="mb-8 flex justify-between items-end">
           <div>
             <h1 className="text-3xl font-black text-gray-900">Your Orders</h1>
             <p className="text-gray-500 font-medium mt-1">Manage and track your delicious cravings</p>
           </div>
           <button 
             onClick={() => { setIsRefreshing(true); fetchOrders(false); }}
             disabled={loading || isRefreshing}
             className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-orange-500 hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
             title="Refresh Orders"
           >
             <RefreshCw className={`w-4 h-4 ${(loading || isRefreshing) ? "animate-spin" : ""}`} />
           </button>
        </header>

        <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val }, { replace: true })} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/50 p-1 rounded-2xl h-14 mb-8 backdrop-blur-md border border-white/20 shadow-sm">
            <TabsTrigger value="active" className="rounded-xl font-bold text-base data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="rounded-xl font-bold text-base data-[state=active]:bg-white data-[state=active]:shadow-sm">
              History ({pastOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6 outline-none">
            {loading && !isRefreshing ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                <p className="font-bold text-gray-400">Loading your orders...</p>
              </div>
            ) : activeOrders.length > 0 ? (
              activeOrders.map((order, idx) => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  index={idx} 
                  onView={() => setSelectedOrder(order)} 
                  onReorder={() => handleReorder(order)}
                />
              ))
            ) : (
              <EmptyState title="No Active Orders" desc="Hungry? Let's fix that right now!" />
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-6 outline-none">
            {pastOrders.length > 0 ? (
              pastOrders.map((order, idx) => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  index={idx} 
                  isPast 
                  onView={() => setSelectedOrder(order)}
                  onReorder={() => handleReorder(order)}
                  onReview={() => setReviewOrder(order)}
                />
              ))
            ) : (
              <EmptyState title="No Past Orders" desc="Your history will appear here once you've had a meal." />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedOrder && (
            <div className="bg-white">
              <DialogHeader className="p-6 bg-gray-50 border-b">
                <DialogTitle className="text-xl font-black flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-primary" />
                  Order Details
                </DialogTitle>
                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1">ID: #{selectedOrder._id?.substring(0, 8)}</p>
              </DialogHeader>
              
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="flex justify-between items-center bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <div>
                    <h3 className="font-black text-gray-900">{selectedOrder.restaurantName}</h3>
                    <p className="text-xs text-gray-500 font-bold">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-white text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-primary/20">
                    {selectedOrder.status}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Bill Details</h4>
                  {selectedOrder.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center font-bold">
                      <div className="flex items-center gap-2">
                         <span className="text-primary text-xs">x{item.quantity}</span>
                         <span className="text-sm text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-sm text-gray-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-dashed flex justify-between items-center">
                    <span className="text-base font-black text-gray-900">Grand Total</span>
                    <span className="text-xl font-black text-primary">₹{selectedOrder.totalAmount}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Delivery To</h4>
                  <div className="flex gap-2 text-gray-600 font-medium text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p>{selectedOrder.address}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Button onClick={() => handleReorder(selectedOrder)} className="w-full h-12 rounded-xl gradient-primary font-bold shadow-lg">
                  Reorder These Items
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      {reviewOrder && (
        <ReviewModal 
          order={reviewOrder} 
          onClose={() => setReviewOrder(null)} 
          onSuccess={() => {
            fetchOrders(false);
          }} 
        />
      )}

      <Footer/>
    </div>
  );
};

const OrderCard = ({ order, index, isPast = false, onView, onReorder, onReview }: any) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-white group">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Package className="w-7 h-7" />
          </div>

          <div className="flex-1 space-y-1 w-full">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-gray-900">{order.restaurantName}</h3>
                <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className="mx-1">•</span>
                  <span>₹{order.totalAmount}</span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                order.status === "Delivered" ? "bg-green-50 text-green-600 border-green-100" : "bg-orange-50 text-orange-600 border-orange-100 animate-pulse"
              }`}>
                {order.status}
              </div>
            </div>

            <div className="pt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {order.items.slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="bg-gray-50/80 px-2 py-1 rounded-lg text-[10px] font-bold text-gray-600 border border-gray-100 whitespace-nowrap">
                   {item.quantity} x {item.name}
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-3">
              {!isPast ? (
                <Button 
                  onClick={() => navigate(`/tracking/${order._id}`)}
                  className="bg-primary text-white font-bold h-9 px-5 rounded-xl shadow-lg shadow-primary/20"
                >
                  Track
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={onReorder}
                    variant="outline" 
                    className="border-gray-200 text-gray-600 font-bold h-9 rounded-xl"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reorder
                  </Button>
                  {order.status === "Delivered" && (
                    <Button 
                      onClick={onReview}
                      className="bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold h-9 px-3 rounded-xl border border-orange-200"
                    >
                      <Star className={`w-4 h-4 mr-1.5 ${order.restaurantReview?.rating ? "fill-orange-500 text-orange-500" : ""}`} />
                      {order.restaurantReview?.rating ? "View Rating" : "Rate"}
                    </Button>
                  )}
                </>
              )}
              <Button 
                onClick={onView}
                variant="ghost" 
                className="text-gray-400 font-bold h-9 px-3 hover:text-gray-900"
              >
                Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState = ({ title, desc }: { title: string, desc: string }) => (
  <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-[2rem] border border-white/20">
    <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
      <Package className="w-8 h-8 text-primary/30" />
    </div>
    <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 font-medium mb-8 max-w-[250px] mx-auto text-sm">{desc}</p>
    <Link to="/restaurants" className="gradient-primary text-white font-black px-8 py-3.5 rounded-2xl shadow-xl inline-block">
      Discover Food
    </Link>
  </div>
);

export default Orders;
