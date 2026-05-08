import { FoodCategory } from "@/data/mockData";
import { 
  Utensils, 
  Circle, 
  UtensilsCrossed, 
  Soup, 
  Candy, 
  Pizza, 
  Layers, 
  Drumstick, 
  IceCream, 
  Coffee 
} from "lucide-react";

interface CategoryChipProps {
  category: FoodCategory;
  isActive?: boolean;
  onClick?: () => void;
}

const getCategoryDetails = (name: string) => {
  const mapping: Record<string, { icon: any, gradient: string, shadowGlow: string }> = {
    "Biryani": { icon: Utensils, gradient: "from-orange-400 to-red-500", shadowGlow: "shadow-orange-500/40" },
    "Dosa": { icon: Circle, gradient: "from-yellow-400 to-amber-500", shadowGlow: "shadow-amber-500/40" },
    "Meals": { icon: UtensilsCrossed, gradient: "from-green-400 to-emerald-500", shadowGlow: "shadow-emerald-500/40" },
    "Chinese": { icon: Soup, gradient: "from-red-400 to-rose-500", shadowGlow: "shadow-rose-500/40" },
    "Sweets": { icon: Candy, gradient: "from-pink-400 to-rose-400", shadowGlow: "shadow-pink-500/40" },
    "Snacks": { icon: Pizza, gradient: "from-amber-400 to-orange-500", shadowGlow: "shadow-amber-500/40" },
    "Parotta": { icon: Layers, gradient: "from-orange-500 to-amber-600", shadowGlow: "shadow-orange-500/40" },
    "Chicken": { icon: Drumstick, gradient: "from-red-500 to-orange-600", shadowGlow: "shadow-red-500/40" },
    "Desserts": { icon: IceCream, gradient: "from-purple-400 to-pink-500", shadowGlow: "shadow-purple-500/40" },
    "Beverages": { icon: Coffee, gradient: "from-blue-400 to-cyan-500", shadowGlow: "shadow-blue-500/40" },
  };
  
  return mapping[name] || { icon: Utensils, gradient: "from-gray-400 to-slate-500", shadowGlow: "shadow-gray-500/40" };
};

const CategoryChip = ({ category, isActive, onClick }: CategoryChipProps) => {
  const { icon: Icon, gradient, shadowGlow } = getCategoryDetails(category.name);

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center p-2 sm:p-5 rounded-2xl sm:rounded-[1.2rem]
        transition-all duration-300 outline-none group border snap-center
        min-w-[96px] w-[96px] sm:w-full h-24 sm:h-36 shrink-0
        ${isActive 
          ? `bg-gray-900 border-gray-900 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)]` 
          : `bg-white/60 border-white/60 shadow-md sm:shadow-lg hover:shadow-xl hover:-translate-y-1 sm:hover:-translate-y-2 hover:${shadowGlow}`
        }
      `}
      style={{
        transform: isActive ? 'scale(1.05) translateY(-2px)' : 'none'
      }}
    >
      {/* Background Gradient Layer for active/hover state */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl sm:rounded-[1.2rem] opacity-0 transition-opacity duration-300 ${isActive ? 'opacity-20' : 'group-hover:opacity-15'}`} 
      />

      {/* Glow Effect on Active */}
      {isActive && (
        <div className={`absolute -inset-1 bg-gradient-to-br ${gradient} rounded-2xl blur-lg sm:blur-xl opacity-30 sm:opacity-40 -z-10`} />
      )}

      {/* Icon Wrapper */}
      <div className={`
        flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full mb-1.5 sm:mb-3
        transition-all duration-500 shadow-inner bg-gradient-to-br ${gradient} bg-cover bg-center
        ${isActive ? "scale-105 shadow-md sm:shadow-lg" : "group-hover:scale-105 shadow-sm sm:shadow-md"}
      `}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md" />
      </div>
      
      {/* Category Name */}
      <span className={`text-[11px] sm:text-sm font-bold tracking-wide z-10 transition-colors ${isActive ? "text-white" : "text-gray-800"}`}>
        {category.name}
      </span>
      
      {/* Active Indicator Line */}
      {isActive && (
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 sm:w-12 h-1 rounded-t-full bg-gradient-to-r ${gradient}`} />
      )}
    </button>
  );
};

export default CategoryChip;
