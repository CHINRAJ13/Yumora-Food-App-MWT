import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UnifiedOrderDetailPanel } from "@/components/UnifiedOrderDetailPanel";
import { ReviewModal } from "@/components/ReviewModal";
import { useCartStore } from "@/store/useCartStore";
import * as api from "@/api";
import { socketService } from "@/services/socket";
import { toast } from "sonner";
import { ArrowLeft, Package, RefreshCw } from "lucide-react";

const OrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { addItem, clearCart } = useCartStore();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reviewOrder, setReviewOrder] = useState<any>(null);

  const fetchOrder = useCallback(
    async (showLoader = true) => {
      if (!orderId) return;
      if (showLoader) setLoading(true);
      try {
        const res: any = await api.getOrderById(orderId);
        if (res.status === "success" && res.data) {
          setOrder(res.data);
        } else {
          setOrder(null);
        }
      } catch (err: any) {
        toast.error(err?.message || "Could not load order details");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [orderId]
  );

  useEffect(() => {
    fetchOrder();
    window.scrollTo(0, 0);
  }, [fetchOrder]);

  // Real-time Socket.IO sync for this specific order
  useEffect(() => {
    if (!orderId) return;
    socketService.connect();
    socketService.joinOrder(orderId);

    const handleStatusUpdate = ({ status, data }: { status: string; data: any }) => {
      if (!data || data._id === orderId || data.id === orderId) {
        setOrder((prev: any) => (prev ? { ...prev, ...data, status } : data));
        toast.info(`Order status updated: ${status}`);
      }
    };

    const handleOrderAccepted = ({ orderId: eventOrderId, deliveryPerson }: any) => {
      if (eventOrderId === orderId && deliveryPerson) {
        setOrder((prev: any) =>
          prev
            ? {
                ...prev,
                deliveryPersonName: deliveryPerson.name,
                status: "Out for Delivery",
              }
            : prev
        );
      }
    };

    socketService.onOrderStatusUpdate(handleStatusUpdate);
    socketService.onOrderAccepted(handleOrderAccepted);

    return () => {
      socketService.offOrderStatusUpdate();
    };
  }, [orderId]);

  const handleCancelOrder = async (targetId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this order? A 100% full refund will be automatically issued to your payment method."
      )
    ) {
      return;
    }

    setCancellingId(targetId);
    try {
      const res: any = await api.cancelOrder(targetId, "Customer requested cancellation");
      if (res.status === "success") {
        toast.success("Order cancelled. Full refund has been initiated! 🎉");
        fetchOrder(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel order");
    } finally {
      setCancellingId(null);
    }
  };

  const handleReorder = (targetOrder: any) => {
    clearCart();
    (targetOrder.items || []).forEach((item: any) => {
      addItem(item, targetOrder.restaurantId, targetOrder.restaurantName);
    });
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-secondary/30 pb-20 lg:pb-0 flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-3xl flex-1">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-gray-100 text-xs font-black text-gray-700 hover:text-primary hover:shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Orders
          </Link>

          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchOrder(false);
            }}
            disabled={loading || isRefreshing}
            className="p-2.5 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-primary hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
            title="Refresh Order"
          >
            <RefreshCw className={`w-4 h-4 ${loading || isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading && !order ? (
          <div className="bg-white rounded-[2rem] p-20 border border-gray-100 text-center shadow-sm">
            <RefreshCw className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-sm font-bold text-gray-500">Loading order details & live tracking...</p>
          </div>
        ) : !order ? (
          <div className="bg-white rounded-[2rem] p-16 border border-gray-100 text-center shadow-sm">
            <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-black text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-xs font-medium text-gray-500 mb-6">
              We couldn't find an order with that ID.
            </p>
            <Link
              to="/orders"
              className="gradient-primary text-white font-black text-sm px-7 py-3 rounded-2xl shadow-lg inline-block"
            >
              Go to My Orders
            </Link>
          </div>
        ) : (
          <UnifiedOrderDetailPanel
            order={order}
            onCancel={handleCancelOrder}
            cancellingId={cancellingId}
            onReorder={handleReorder}
            onReview={(o) => setReviewOrder(o)}
          />
        )}
      </div>

      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSuccess={() => {
            fetchOrder(false);
          }}
        />
      )}

      <Footer />
    </div>
  );
};

export default OrderDetails;
