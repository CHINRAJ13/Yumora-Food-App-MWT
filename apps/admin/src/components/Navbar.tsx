import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, MapPin, User as UserIcon, ClipboardList, Tag, Home, Menu, X, LogOut, Bike, LayoutDashboard } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const { totalItems: getTotalItems } = useCartStore();
  const { user, logout, isAuthenticated } = useAuthStore();
  const totalItems = getTotalItems();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const baseLinks = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/profile", label: "Account", icon: UserIcon },
  ];

  const navLinks = [...baseLinks];

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg shadow-xl border border-white/20">
        <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-4">

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-1.5 -ml-1 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-black text-base md:text-lg">Y</span>
            </div>
            <div className="block">
              <span className="font-extrabold text-lg md:text-lg gradient-text tracking-tight">Yumora</span>
              <span className="hidden sm:inline-block text-[9px] md:text-[10px] font-bold text-orange-600 ml-1 bg-orange-100 px-1.5 py-0.5 rounded-full animate-pulse">PRO</span>
            </div>
          </Link>

          {/* Location */}
          <div className="hidden md:flex items-center gap-1.5 text-sm cursor-pointer group bg-gray-50 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <MapPin className="w-3.5 h-3.5 text-orange-500" />
            <span className="font-semibold text-gray-800 group-hover:text-orange-500 transition-colors">Coimbatore</span>
          </div>

          {/* Nav Links - Desktop Only */}
          <div className="hidden md:flex items-center gap-1 mx-auto">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all ${location.pathname === link.to
                  ? "text-orange-500 bg-orange-50"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
                {location.pathname === link.to && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-[1px] left-2 right-2 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block"><ThemeToggle /></div>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                  <UserIcon className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-bold text-gray-700">{user?.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 transition-all hover:bg-gray-50"
              >
                <UserIcon className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}

            {/* Cart removed from Admin app */}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-0 bottom-0 left-0 w-[280px] bg-white shadow-2xl z-50 flex flex-col md:hidden"
            >
              <div className="p-5 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md">
                    <span className="text-white font-black">Y</span>
                  </div>
                  <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Yumora</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col gap-2 overflow-y-auto">
                <div className="mb-4 p-3 bg-orange-50 rounded-xl flex items-center gap-3">
                  <UserIcon className="w-8 h-8 text-orange-600 bg-white p-1.5 rounded-full shadow-sm" />
                  <div>
                    <p className="font-bold text-gray-900">{isAuthenticated ? user?.name : "Guest User"}</p>
                    {isAuthenticated ? (
                      <button onClick={handleLogout} className="text-destructive text-xs font-bold hover:underline">Logout</button>
                    ) : (
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-orange-600 text-xs font-bold hover:underline">Login to account</Link>
                    )}
                  </div>
                </div>

                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-colors ${location.pathname === link.to
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                  >
                    <link.icon className={`w-5 h-5 ${location.pathname === link.to ? "text-orange-500" : "text-gray-400"}`} />
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="p-5 border-t border-gray-100 flex items-center justify-between">
                <span className="font-bold text-sm text-gray-500">Toggle Theme</span>
                <ThemeToggle />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
