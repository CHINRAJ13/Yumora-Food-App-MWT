import { Star, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useCartStore } from "@/store/useCartStore";

interface TrendingItemProps {
  item: any;
  restaurantId: string;
  restaurantName: string;
  index: number;
}

const TrendingItem = ({ item, restaurantId, restaurantName, index }: TrendingItemProps) => {
  const { addItem } = useCartStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 flex flex-col gap-3 min-w-[180px] snap-start hover:shadow-xl transition-all group"
    >
      <div className="relative h-24 rounded-2xl overflow-hidden bg-gray-100">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
          <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
          <span className="text-[10px] font-black">4.5</span>
        </div>
      </div>
      
      <div className="space-y-1">
        <h4 className="font-bold text-sm text-gray-900 truncate leading-tight">{item.name}</h4>
        <p className="text-[10px] text-gray-400 font-medium truncate italic">{restaurantName}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-black text-gray-900 text-sm">₹{item.price}</span>
          <button 
            onClick={() => addItem(item, restaurantId, restaurantName)}
            className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TrendingItem;
