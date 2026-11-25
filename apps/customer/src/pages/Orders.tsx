import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCartStore } from "@/store/useCartStore";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Clock, RotateCcw, Package, RefreshCw, Star, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Footer from "@/components/Footer";
import * as api from "@/api";
import { toast } from "sonner";
import { ReviewModal } from "@/components/ReviewModal";
import { socketService } from "@/services/socket";

const Orders = () => {
  const { addItem, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "past" ? "past" : "active";

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res: any = await api.getMyOrders();
      if (res.status === "success") {
        setOrders(res.data);
      }
    } catch {
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

  // Real-time Socket.IO subscription for active orders list
  useEffect(() => {
    if (orders.length === 0) return;
    socketService.connect();

    orders
      .filter((o) => o.status !== "Delivered" && o.status !== "Cancelled")
      .forEach((o) => socketService.joinOrder(o._id));

    const handleStatusUpdate = ({ status, data }: { status: string; data: any }) => {
      if (!data?._id) return;
      setOrders((prev) =>
        prev.map((o) => (o._id === data._id ? { ...o, ...data, status } : o))
      );
      toast.info(`Order #${data._id.slice(-6).toUpperCase()} is now ${status}`);
    };

    const handleOrderAccepted = ({ orderId, deliveryPerson }: any) => {
      if (!orderId || !deliveryPerson) return;
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? {
                ...o,
                deliveryPersonName: deliveryPerson.name,
                status: "Out for Delivery",
              }
            : o
        )
      );
    };

    socketService.onOrderStatusUpdate(handleStatusUpdate);
    socketService.onOrderAccepted(handleOrderAccepted);

    return () => {
      socketService.offOrderStatusUpdate();
    };
  }, [orders.length]);

  const activeOrders = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");
  const pastOrders = orders.filter((o) => o.status === "Delivered" || o.status === "Cancelled");

  const handleReorder = (order: any) => {
    clearCart();
    (order.items || []).forEach((item: any) => {
      addItem(item, order.restaurantId, order.restaurantName);
    });
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-secondary/30 pb-20 lg:pb-0 flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-2xl flex-1">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Your Orders</h1>
            <p className="text-gray-500 font-medium mt-1">
              Click any order to view full details, live tracking & bill receipt
            </p>
          </div>
          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchOrders(false);
            }}
            disabled={loading || isRefreshing}
            className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-orange-500 hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading || isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </header>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setSearchParams({ tab: val }, { replace: true })}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-white/60 p-1 rounded-2xl h-14 mb-8 backdrop-blur-md border border-white/20 shadow-sm">
            <TabsTrigger
              value="active"
              className="rounded-xl font-bold text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="rounded-xl font-bold text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
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
                  onOpen={() => navigate(`/orders/${order._id}`)}
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
                  onOpen={() => navigate(`/orders/${order._id}`)}
                  onReorder={() => handleReorder(order)}
                  onReview={() => setReviewOrder(order)}
                />
              ))
            ) : (
              <EmptyState
                title="No Past Orders"
                desc="Your history will appear here once you've had a meal."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

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

      <Footer />
    </div>
  );
};

const OrderCard = ({
  order,
  index,
  isPast = false,
  onOpen,
  onReorder,
  onReview,
}: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.3) }}
    >
      <div
        onClick={onOpen}
        className="cursor-pointer bg-white/90 backdrop-blur-xl rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-white hover:border-orange-200 group"
      >
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
            <Package className="w-7 h-7" />
          </div>

          <div className="flex-1 space-y-1 w-full">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h3 className="font-black text-lg text-gray-900">{order.restaurantName}</h3>
                <div className="flex flex-wrap items-center gap-1.5 text-gray-400 font-bold text-[10px] mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className="mx-1">•</span>
                  <span className="text-gray-700">₹{order.totalAmount}</span>
                  {order.status === "Delivered" && (
                    <>
                      <span className="mx-1">•</span>
                      <span className="text-emerald-600 font-black">
                        Delivered in{" "}
                        {order.actualDeliveryMinutes ||
                          Math.max(
                            1,
                            Math.round(
                              (new Date(order.deliveredAt || order.updatedAt).getTime() -
                                new Date(order.createdAt).getTime()) /
                                60000
                            )
                          )}{" "}
                        mins
                      </span>
                    </>
                  )}
                  {!["Delivered", "Cancelled"].includes(order.status) && (
                    <>
                      <span className="mx-1">•</span>
                      <span className="text-orange-600 font-black">
                        ⏱️ Est. {order.estimatedDeliveryMinutes || 35} mins
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {order.status === "Cancelled" && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      order.refund?.status === "processed"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : order.refund?.status === "failed"
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : "bg-amber-50 text-amber-600 border-amber-200"
                    }`}
                  >
                    {order.refund?.status === "processed"
                      ? "✓ Refunded"
                      : order.refund?.status === "failed"
                      ? "Refund Failed"
                      : "Refund Pending"}
                  </span>
                )}
                <div
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    order.status === "Delivered"
                      ? "bg-green-50 text-green-600 border-green-100"
                      : order.status === "Cancelled"
                      ? "bg-red-50 text-red-600 border-red-100"
                      : "bg-orange-50 text-orange-600 border-orange-100 animate-pulse"
                  }`}
                >
                  {order.status}
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {(order.items || []).slice(0, 3).map((item: any, i: number) => (
                <div
                  key={i}
                  className="bg-gray-50/80 px-2 py-1 rounded-lg text-[10px] font-bold text-gray-600 border border-gray-100 whitespace-nowrap"
                >
                  {item.quantity} × {item.name}
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {!isPast ? (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen();
                    }}
                    className="bg-primary text-white font-bold h-9 px-5 rounded-xl shadow-lg shadow-primary/20"
                  >
                    Track & View Details
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen();
                      }}
                      className="bg-gray-900 hover:bg-gray-800 text-white font-bold h-9 px-4 rounded-xl"
                      size="sm"
                    >
                      View Order Details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorder();
                      }}
                      variant="outline"
                      className="border-gray-200 text-gray-600 font-bold h-9 rounded-xl"
                      size="sm"
                    >
                      <RotateCcw className="w-4 h-4 mr-1.5" />
                      Reorder
                    </Button>
                    {order.status === "Delivered" && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReview();
                        }}
                        className="bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold h-9 px-3 rounded-xl border border-orange-200"
                      >
                        <Star
                          className={`w-4 h-4 mr-1.5 ${
                            order.restaurantReview?.rating ? "fill-orange-500 text-orange-500" : ""
                          }`}
                        />
                        {order.restaurantReview?.rating ? "View Rating" : "Rate"}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState = ({ title, desc }: { title: string; desc: string }) => (
  <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-[2rem] border border-white/20">
    <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
      <Package className="w-8 h-8 text-primary/30" />
    </div>
    <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 font-medium mb-8 max-w-[250px] mx-auto text-sm">{desc}</p>
    <Link
      to="/restaurants"
      className="gradient-primary text-white font-black px-8 py-3.5 rounded-2xl shadow-xl inline-block"
    >
      Discover Food
    </Link>
  </div>
);

export default Orders;
