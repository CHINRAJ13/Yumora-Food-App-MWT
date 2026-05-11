import { Link, useSearchParams } from "react-router-dom";
import { useCartStore } from "@/store/useCartStore";
import { Plus, Minus, Trash2, ArrowLeft, Tag, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Cart = () => {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    totalPrice: getTotalPrice, 
    coupon, 
    applyCoupon, 
    removeCoupon 
  } = useCartStore();
  
  const [couponInput, setCouponInput] = useState("");
  const [searchParams] = useSearchParams();

  const totalPrice = getTotalPrice();

  const discount = useMemo(() => {
    if (!coupon) return 0;
    // Discount logic matches useCartStore's internal logic
    const COUPONS: any = {
      YUMORA100: { type: "flat", value: 100 },
      FLAT50: { type: "percent", value: 50 },
      SAVE20: { type: "percent", value: 20 },
    };
    const c = COUPONS[coupon];
    if (c.type === "percent") return Math.round(totalPrice * c.value / 100);
    return Math.min(c.value, totalPrice);
  }, [coupon, totalPrice]);

  // Deep link offer code
  useEffect(() => {
    const offer = searchParams.get("offer");
    if (offer && !coupon && items.length > 0) {
      applyCoupon(offer);
    }
  }, [searchParams, coupon, items.length, applyCoupon]);

  const deliveryFee = totalPrice > 199 ? 0 : 30;
  const taxes = Math.round(totalPrice * 0.05);
  const grandTotal = totalPrice - discount + deliveryFee + taxes;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add items from a restaurant to get started</p>
          <Link to="/restaurants" className="inline-flex gradient-primary text-primary-foreground font-bold px-8 py-3.5 rounded-2xl shadow-elevated hover:opacity-90">
            Browse Restaurants
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/restaurants" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Continue shopping
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Your Cart</h1>
          <button onClick={clearCart} className="text-sm text-destructive hover:underline font-medium">Clear all</button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          From <span className="font-bold text-foreground">{items[0].restaurantName}</span>
        </p>

        {/* Items */}
        <div className="bg-card rounded-2xl shadow-card divide-y divide-border/50">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -100 }}
                className="flex items-center gap-4 p-4"
              >
                <span className={item.isVeg ? "veg-dot shrink-0" : "nonveg-dot shrink-0"} />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-card-foreground truncate">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">₹{item.price}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-secondary rounded-xl px-2 py-1">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center text-primary rounded-lg hover:bg-primary/10 transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-primary w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-primary rounded-lg hover:bg-primary/10 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="font-bold text-card-foreground w-16 text-right">₹{item.price * item.quantity}</p>
                <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Coupon */}
        <div className="bg-card rounded-2xl shadow-card p-5 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-card-foreground">Apply Coupon</span>
          </div>
          {coupon ? (
            <div className="flex items-center justify-between bg-success/10 rounded-xl px-4 py-3">
              <div>
                <span className="font-mono font-bold text-success">{coupon}</span>
                <p className="text-xs text-success mt-0.5">Saving ₹{discount}</p>
              </div>
              <button onClick={removeCoupon} className="text-xs text-destructive hover:underline font-medium">Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Enter coupon code (try YUMORA100)"
                className="flex-1 px-4 py-2.5 bg-secondary rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={() => { applyCoupon(couponInput); setCouponInput(""); }}
                className="px-5 py-2.5 gradient-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Bill */}
        <div className="bg-card rounded-2xl shadow-card p-5 mt-4 space-y-3">
          <h3 className="font-bold text-card-foreground">Bill Details</h3>
          <div className="flex justify-between text-sm text-muted-foreground"><span>Item Total</span><span>₹{totalPrice}</span></div>
          {discount > 0 && <div className="flex justify-between text-sm text-success font-semibold"><span>Coupon Discount</span><span>-₹{discount}</span></div>}
          <div className="flex justify-between text-sm text-muted-foreground"><span>Delivery Fee</span><span>{deliveryFee === 0 ? <span className="text-success font-semibold">FREE</span> : `₹${deliveryFee}`}</span></div>
          <div className="flex justify-between text-sm text-muted-foreground"><span>Taxes (5%)</span><span>₹{taxes}</span></div>
          <div className="border-t border-border pt-3 flex justify-between font-bold text-lg text-foreground">
            <span>To Pay</span><span>₹{Math.round(grandTotal)}</span>
          </div>
        </div>

        <Link
          to="/checkout"
          className="block mt-6 w-full gradient-primary text-primary-foreground text-center font-bold py-4 rounded-2xl shadow-elevated hover:opacity-90 transition-opacity text-lg"
        >
          Proceed to Checkout — ₹{Math.round(grandTotal)}
        </Link>
      </div>
    </div>
  );
};

export default Cart;
