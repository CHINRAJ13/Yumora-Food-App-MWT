import { Link } from "react-router-dom";
import { Star, MapPin, IndianRupee, Zap } from "lucide-react";
import { Restaurant } from "@/data/mockData";
import { motion } from "framer-motion";

interface RestaurantCardProps {
  restaurant: Restaurant;
  index?: number;
}

const RestaurantCard = ({ restaurant, index = 0 }: RestaurantCardProps) => {
  const isOnline = restaurant.acceptsOrders !== false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="h-full"
    >
      <Link
        to={`/restaurant/${restaurant.id}`}
        className={`group flex flex-col h-full transition-all duration-300 ${
          isOnline
            ? "hover:scale-[1.02]"
            : "filter grayscale contrast-[0.95] opacity-80 hover:opacity-95"
        }`}
      >
        {/* strictly applied Image Container */}
        <div className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden shadow-card bg-muted mb-4 shrink-0 relative group-hover:shadow-card-hover transition-all duration-500 bg-cover bg-center">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className={`w-full h-full object-cover transition-all duration-500 ${
              isOnline ? "group-hover:scale-105" : "brightness-95"
            }`}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          {/* Status / Pro Badge */}
          {!isOnline ? (
            <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 shadow-lg flex items-center gap-1.5 z-10">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-white tracking-wider leading-none">Offline</span>
            </div>
          ) : restaurant.rating >= 4.5 ? (
            <div className="absolute top-3 left-3 bg-white/90 px-2 py-0.5 rounded-lg border border-white/50 shadow-lg flex items-center gap-1 z-10">
              <Zap className="w-3 h-3 text-orange-600 fill-current" />
              <span className="text-[10px] font-black uppercase text-gray-900 leading-none">Pro Selection</span>
            </div>
          ) : null}

          {/* Offer badge */}
          {restaurant.offer && isOnline && (
            <div className="absolute bottom-3 left-3 text-white">
              <div className="text-xl sm:text-2xl font-black tracking-tighter drop-shadow-lg">
                {restaurant.offer}
              </div>
            </div>
          )}
          
          {/* Delivery time / Offline overlay */}
          <div className={`absolute bottom-3 right-3 backdrop-blur-sm text-[10px] font-black px-2 py-1 rounded-lg shadow-elevated border whitespace-nowrap ${
            isOnline
              ? "bg-white/95 text-gray-900 border-white/50"
              : "bg-black/80 text-gray-200 border-white/20"
          }`}>
            {isOnline ? restaurant.deliveryTime : "Closed For Orders"}
          </div>
        </div>

        {/* Content */}
        <div className="px-1 flex flex-col flex-grow group-hover:translate-x-1 transition-transform duration-300">
          <div className="flex justify-between items-start gap-2">
            <h3 className={`font-black text-lg leading-tight line-clamp-1 tracking-tight ${
              isOnline ? "text-gray-900" : "text-gray-600"
            }`}>
              {restaurant.name}
            </h3>
            {/* Rating badge */}
            <div className={`flex items-center gap-1 text-white text-xs font-black px-3 py-1 rounded-full shadow-md shrink-0 ${
              isOnline ? "bg-green-500" : "bg-gray-500"
            }`}>
              <Star className="w-3 h-3 fill-current" />
              {restaurant.rating}
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400 mt-1 line-clamp-1 uppercase tracking-wider">
            {restaurant.cuisines.join(" • ")}
          </p>
          <div className="flex items-center gap-3 mt-auto pt-4">
            <span className="flex items-center gap-0.5 text-xs text-gray-500 font-bold">
              <IndianRupee className="w-3.5 h-3.5" />
              {restaurant.priceForTwo} for two
            </span>
            <div className="w-1 h-1 rounded-full bg-gray-200 shrink-0" />
            <span className="flex items-center gap-1 text-xs text-gray-500 font-bold">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              {restaurant.distance}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default RestaurantCard;
