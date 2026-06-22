import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/api";

const StarRating = ({ rating, setRating }: { rating: number; setRating: (r: number) => void }) => {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          className={`transition-all hover:scale-110 active:scale-95 ${
            rating >= star ? "text-orange-500" : "text-gray-200"
          }`}
        >
          <Star className={`w-8 h-8 ${rating >= star ? "fill-orange-500" : "fill-gray-100"}`} />
        </button>
      ))}
    </div>
  );
};

export const ReviewModal = ({ 
  order, 
  onClose, 
  onSuccess 
}: { 
  order: any; 
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  
  // States
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [restaurantReviewText, setRestaurantReviewText] = useState("");
  
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [deliveryReviewText, setDeliveryReviewText] = useState("");

  const hasRestaurantReview = !!order.restaurantReview?.rating;
  const hasDeliveryReview = !!order.deliveryReview?.rating;
  const showDelivery = !!order.deliveryPersonId;

  const handleSubmit = async () => {
    if (!restaurantRating && !deliveryRating) {
      toast.error("Please provide at least one rating.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {};
      if (restaurantRating && !hasRestaurantReview) {
        payload.restaurantRating = restaurantRating;
        payload.restaurantReviewText = restaurantReviewText;
      }
      if (deliveryRating && !hasDeliveryReview) {
        payload.deliveryRating = deliveryRating;
        payload.deliveryReviewText = deliveryReviewText;
      }

      const res: any = await api.addOrderReview(order._id, payload);
      if (res.status === 'success') {
        toast.success("Review submitted successfully!");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-white">
          <DialogHeader className="p-6 bg-gray-50 border-b">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
              Rate Your Order
            </DialogTitle>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1">
              Order #{order._id?.substring(0, 8)} • {order.restaurantName}
            </p>
          </DialogHeader>
          
          <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
            
            {/* Restaurant Section */}
            <div className="space-y-4">
              <h3 className="font-black text-gray-900 text-lg border-b pb-2">Food Quality</h3>
              {hasRestaurantReview ? (
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${order.restaurantReview.rating >= s ? "text-orange-500 fill-orange-500" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-gray-700 italic">"{order.restaurantReview.review || "No written review"}"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <StarRating rating={restaurantRating} setRating={setRestaurantRating} />
                  <textarea 
                    value={restaurantReviewText}
                    onChange={(e) => setRestaurantReviewText(e.target.value)}
                    placeholder="How was the food? (Optional)"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none min-h-[80px]"
                  />
                </div>
              )}
            </div>

            {/* Delivery Section */}
            {showDelivery && (
              <div className="space-y-4">
                <h3 className="font-black text-gray-900 text-lg border-b pb-2">Delivery Service</h3>
                <p className="text-xs font-bold text-gray-500">Delivered by {order.deliveryPersonName || "our partner"}</p>
                {hasDeliveryReview ? (
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <div className="flex gap-1 mb-2">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${order.deliveryReview.rating >= s ? "text-blue-500 fill-blue-500" : "text-gray-300"}`} />
                      ))}
                    </div>
                    <p className="text-sm font-medium text-gray-700 italic">"{order.deliveryReview.review || "No written review"}"</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <StarRating rating={deliveryRating} setRating={setDeliveryRating} />
                    <textarea 
                      value={deliveryReviewText}
                      onChange={(e) => setDeliveryReviewText(e.target.value)}
                      placeholder="How was the delivery experience? (Optional)"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none min-h-[80px]"
                    />
                  </div>
                )}
              </div>
            )}

          </div>

          <div className="p-6 pt-0">
            {(!hasRestaurantReview || (!hasDeliveryReview && showDelivery)) ? (
              <Button 
                onClick={handleSubmit} 
                disabled={loading || (!restaurantRating && !deliveryRating)}
                className="w-full h-12 rounded-xl gradient-primary font-bold shadow-lg"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Review"}
              </Button>
            ) : (
              <Button 
                onClick={onClose}
                variant="outline"
                className="w-full h-12 rounded-xl font-bold"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
