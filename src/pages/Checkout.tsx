import { useState, useMemo } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Banknote, CheckCircle, Timer, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { toast as hotToast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, CheckoutFormData } from "@/validators/checkoutValidator";
import * as api from "@/api";

const Checkout = () => {
  const { items, totalPrice: getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      paymentMethod: "cod",
      line1: "",
      line2: "",
      pincode: ""
    }
  });

  const paymentMethod = watch("paymentMethod");

  const totalPrice = getTotalPrice();
  const coupon = useCartStore(state => state.coupon);
  
  const discount = useMemo(() => {
    if (!coupon) return 0;
    const COUPONS: any = {
      YUMORA100: { type: "flat", value: 100 },
      FLAT50: { type: "percent", value: 50 },
      SAVE20: { type: "percent", value: 20 },
    };
    const c = COUPONS[coupon];
    if (c.type === "percent") return Math.round(totalPrice * c.value / 100);
    return Math.min(c.value, totalPrice);
  }, [coupon, totalPrice]);

  const deliveryFee = totalPrice > 199 ? 0 : 30;
  const taxes = Math.round(totalPrice * 0.05);
  const grandTotal = Math.round(totalPrice - discount + deliveryFee + taxes);

  const playSuccessSound = () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioContent = new AudioCtx();
      const oscillator = audioContent.createOscillator();
      const gainNode = audioContent.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContent.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(1760, audioContent.currentTime + 0.1); 
      gainNode.gain.setValueAtTime(0.5, audioContent.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContent.currentTime + 0.3);
      oscillator.connect(gainNode);
      gainNode.connect(audioContent.destination);
      oscillator.start();
      oscillator.stop(audioContent.currentTime + 0.3);
    } catch (e) {
      console.error('Audio play failed', e);
    }
  };

  const showSuccessToast = (id: string, estimatedTime: string = "25-35 mins") => {
    hotToast.custom((t) => (
      <div className={`${t.visible ? "animate-in fade-in slide-in-from-top-4" : "animate-out fade-out slide-out-to-top-4"} bg-white border-2 border-green-500 shadow-2xl rounded-2xl p-5 w-full max-w-sm pointer-events-auto transform transition-all duration-300`}>
        <div className="flex items-start gap-4">
          <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
            <span className="text-2xl block animate-bounce">🎉</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-green-700 text-lg mb-1">Order placed!</h3>
            <p className="text-sm text-gray-500 mb-3">Your cravings are on the way.</p>
            <div className="bg-green-50 rounded-xl p-3 space-y-2 border border-green-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-700 font-medium">Order ID</span>
                <span className="font-bold font-mono text-green-900 bg-white px-2 py-1 rounded-md border border-green-200">#{id.substring(id.length - 6)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ), { duration: 3000, position: "top-center" });
    playSuccessSound();
  };

  const handleRazorpay = async (data: CheckoutFormData) => {
    setProcessingPayment(true);
    const loadScript = (src: string) => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const resScript = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!resScript) {
      toast.error("Razorpay SDK failed to load");
      setProcessingPayment(false);
      return;
    }

    try {
      const fullAddress = `${data.line1}${data.line2 ? `, ${data.line2}` : ""}, ${data.pincode}`;
      const createRes: any = await api.placeOrder({
        items,
        totalAmount: grandTotal,
        address: fullAddress,
        phone: data.phone,
        email: data.email,
        paymentMethod: "online"
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_xxxx",
        amount: grandTotal * 100,
        currency: "INR",
        name: "Yumora",
        description: "Food Delivery Payment",
        handler: async (response: any) => {
          try {
            await api.default.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment Successful 🎉");
            setOrderId(createRes.data._id);
            setOrderPlaced(true);
            clearCart();
            showSuccessToast(createRes.data._id);
            setTimeout(() => navigate("/orders"), 2000);
          } catch (err) {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: data.name,
          email: data.email,
          contact: data.phone,
        },
        theme: { color: "#f97316" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(`Order failed: ${error.message}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (data.paymentMethod === "card") {
      await handleRazorpay(data);
      return;
    }

    setProcessingPayment(true);
    try {
      const fullAddress = `${data.line1}${data.line2 ? `, ${data.line2}` : ""}, ${data.pincode}`;
      const res: any = await api.placeOrder({
        items,
        totalAmount: grandTotal,
        address: fullAddress,
        phone: data.phone,
        email: data.email,
        paymentMethod: "cod"
      });

      if (res.status === 'success') {
        setOrderId(res.data._id);
        setOrderPlaced(true);
        clearCart();
        showSuccessToast(res.data._id);
        setTimeout(() => navigate("/orders"), 2000);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (items.length === 0 && !orderPlaced) {
    navigate("/cart");
    return null;
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="container mx-auto px-4 py-20 text-center max-w-md">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
            <CheckCircle className="w-24 h-24 text-success mx-auto mb-6" />
          </motion.div>
          <h2 className="text-3xl font-black text-foreground mb-2">Order Placed! 🎉</h2>
          <p className="text-muted-foreground mb-2">Your food is being prepared.</p>
          <p className="text-sm font-mono bg-secondary px-4 py-2 rounded-xl inline-block text-foreground font-bold mb-8">Order #{orderId.substring(orderId.length - 8)}</p>
          <div className="flex flex-col gap-3">
            <Link to="/orders" className="gradient-primary text-primary-foreground font-bold px-8 py-3.5 rounded-2xl shadow-elevated">Track Order</Link>
            <Link to="/" className="bg-secondary text-secondary-foreground font-bold px-8 py-3.5 rounded-2xl">Back to Home</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/cart" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to cart
        </Link>
        <h1 className="text-3xl font-black text-foreground mb-8">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Address */}
          <div className="bg-card rounded-[2.5rem] shadow-card p-8 border border-gray-100">
            <h3 className="text-lg font-black text-card-foreground mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Delivery Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">Full Name</label>
                <input {...register("name")} placeholder="Your name" className={`w-full px-5 py-3.5 bg-secondary rounded-2xl text-sm outline-none focus:ring-2 ${errors.name ? "ring-red-500" : "focus:ring-primary/20"} transition-all`} />
                {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">Phone Number</label>
                <input {...register("phone")} placeholder="9876543210" className={`w-full px-5 py-3.5 bg-secondary rounded-2xl text-sm outline-none focus:ring-2 ${errors.phone ? "ring-red-500" : "focus:ring-primary/20"} transition-all`} />
                {errors.phone && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">Email Address</label>
                <input {...register("email")} placeholder="your@email.com" className={`w-full px-5 py-3.5 bg-secondary rounded-2xl text-sm outline-none focus:ring-2 ${errors.email ? "ring-red-500" : "focus:ring-primary/20"} transition-all`} />
                {errors.email && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.email.message}</p>}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">Street / Area</label>
                <input {...register("line1")} placeholder="House/Flat, Street, Area" className={`w-full px-5 py-3.5 bg-secondary rounded-2xl text-sm outline-none focus:ring-2 ${errors.line1 ? "ring-red-500" : "focus:ring-primary/20"} transition-all`} />
                {errors.line1 && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.line1.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">Landmark (Optional)</label>
                <input {...register("line2")} placeholder="Near..." className="w-full px-5 py-3.5 bg-secondary rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">Pincode</label>
                <input {...register("pincode")} placeholder="641001" className={`w-full px-5 py-3.5 bg-secondary rounded-2xl text-sm outline-none focus:ring-2 ${errors.pincode ? "ring-red-500" : "focus:ring-primary/20"} transition-all`} />
                {errors.pincode && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.pincode.message}</p>}
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-card rounded-[2.5rem] shadow-card p-8 border border-gray-100">
            <h3 className="text-lg font-black text-card-foreground mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Payment Method
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button type="button" onClick={() => setValue("paymentMethod", "cod")} className={`flex items-center gap-4 p-5 rounded-3xl transition-all text-left ${paymentMethod === "cod" ? "bg-primary/5 ring-2 ring-primary" : "bg-gray-50 border border-transparent"}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paymentMethod === "cod" ? "bg-primary text-white" : "bg-white text-gray-400 shadow-sm"}`}><Banknote className="w-6 h-6" /></div>
                <div><p className="text-sm font-black text-gray-900">Cash on Delivery</p><p className="text-[10px] font-bold text-gray-400">Pay at your doorstep</p></div>
              </button>
              <button type="button" onClick={() => setValue("paymentMethod", "card")} className={`flex items-center gap-4 p-5 rounded-3xl transition-all text-left ${paymentMethod === "card" ? "bg-primary/5 ring-2 ring-primary" : "bg-gray-50 border border-transparent"}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paymentMethod === "card" ? "bg-primary text-white" : "bg-white text-gray-400 shadow-sm"}`}><CreditCard className="w-6 h-6" /></div>
                <div><p className="text-sm font-black text-gray-900">Online Payment</p><p className="text-[10px] font-bold text-gray-400">Cards, UPI, Banking</p></div>
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-card rounded-[2.5rem] shadow-card p-8 border border-gray-100">
            <h3 className="text-lg font-black text-card-foreground mb-6 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-primary" /> Order Summary</h3>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <span className={item.isVeg ? "veg-dot" : "nonveg-dot"} />
                    <span className="font-bold text-gray-700">{item.name} <span className="text-gray-300 ml-1">×{item.quantity}</span></span>
                  </div>
                  <span className="font-black text-gray-900">₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="pt-4 border-t border-gray-50 space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider"><span>Item Total</span><span>₹{totalPrice}</span></div>
                {discount > 0 && <div className="flex justify-between text-xs font-bold text-emerald-500 uppercase tracking-wider"><span>Discount</span><span>-₹{discount}</span></div>}
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider"><span>Taxes & Charges</span><span>₹{taxes + deliveryFee}</span></div>
              </div>
              <div className="pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-center">
                <span className="text-lg font-black text-gray-900">Grand Total</span>
                <span className="text-2xl font-black text-primary">₹{grandTotal}</span>
              </div>
            </div>
          </div>

          <button type="submit" disabled={processingPayment} className="w-full h-16 gradient-primary text-white font-black rounded-3xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-lg disabled:opacity-50">
            {processingPayment ? "Processing..." : `Complete Order — ₹${grandTotal}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
