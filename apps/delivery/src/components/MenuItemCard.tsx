import { useCartStore } from "@/store/useCartStore";
import { Plus, Minus, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MenuItemCardProps {
  item: any;
  restaurantId: string;
  restaurantName: string;
}

const MenuItemCard = ({ item, restaurantId, restaurantName }: MenuItemCardProps) => {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.id === item.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-row items-stretch overflow-visible hover:shadow-md transition-shadow duration-200"
    >
      {/* LEFT: Text content */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        {/* Veg/NonVeg + Bestseller */}
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className={`w-4 h-4 flex items-center justify-center rounded-sm border-2 shrink-0 ${
              item.isVeg ? "border-green-600" : "border-red-600"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                item.isVeg ? "bg-green-600" : "bg-red-600"
              }`}
            />
          </span>
          {item.isBestseller && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-600">
              <Star className="w-2 h-2 fill-current" /> Bestseller
            </span>
          )}
        </div>

        {/* Name */}
        <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight line-clamp-1">
          {item.name}
        </h4>

        {/* Description */}
        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Price */}
        <p className="font-extrabold text-gray-900 text-xs sm:text-sm mt-1.5">
          ₹{item.price}
        </p>
      </div>

      {/* RIGHT: Image + ADD button */}
      <div className="relative shrink-0 w-[76px] sm:w-[90px] m-2 flex flex-col items-center">
        {/* Image */}
        <div className="w-full h-[70px] sm:h-[80px] rounded-xl overflow-hidden bg-gray-100">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover object-center"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop";
            }}
          />
        </div>

        {/* ADD / Qty button */}
        <div className="absolute -bottom-3 w-[64px] sm:w-[76px]">
          <AnimatePresence mode="wait">
            {cartItem ? (
              <motion.div
                key="qty"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-center justify-between bg-white border border-green-500 rounded-lg shadow-md h-7 w-full overflow-hidden"
              >
                <button
                  onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
                  className="w-1/3 h-full flex items-center justify-center text-green-600 hover:bg-green-50"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-xs font-extrabold text-green-600 w-1/3 text-center">
                  {cartItem.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                  className="w-1/3 h-full flex items-center justify-center text-green-600 hover:bg-green-50"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="add"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addItem(item, restaurantId, restaurantName)}
                className="w-full h-7 bg-white text-green-600 font-extrabold text-[11px] rounded-lg shadow-md border border-gray-200 hover:border-green-400 hover:shadow-lg transition-all uppercase tracking-wide"
              >
                + ADD
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default MenuItemCard;
