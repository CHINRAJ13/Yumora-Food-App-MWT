import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import * as api from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, Phone } from "lucide-react";
import OTPInput from "@/components/OTPInput";
import { motion } from "framer-motion";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, setAuth, logout, isAuthenticated, user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState("user");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Role-specific fields
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantImage, setRestaurantImage] = useState<File | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Bike");

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.type === 'admin') {
        navigate('/');
      } else {
        setError("Access denied. Admin privileges required.");
        logout();
      }
    }
  }, [isAuthenticated, user, navigate, logout]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      toast({ title: "Login successful", description: "Welcome back!" });
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const signupData: any = {
        name: fullName,
        email,
        password,
        phone: phoneNumber,
        role,
        restaurantName: role === 'restaurant' ? restaurantName : undefined,
        vehicleNumber: role === 'delivery' ? vehicleNumber : undefined,
        licenseNumber: role === 'delivery' ? licenseNumber : undefined,
        vehicleType: role === 'delivery' ? vehicleType : undefined
      };

      let finalData;
      if (role === 'restaurant' && restaurantImage) {
        const formData = new FormData();
        Object.keys(signupData).forEach(key => {
          if (signupData[key] !== undefined) {
            formData.append(key, signupData[key]);
          }
        });
        formData.append('image', restaurantImage);
        finalData = formData;
      } else {
        finalData = signupData;
      }

      const res: any = await register(finalData);
      if (res.status === 'success' && !res.token) {
        setSuccessMessage(res.message);
        toast({ title: "Registration Received", description: res.message });
      } else {
        toast({ title: "Signup successful", description: "Welcome to Yumora!" });
      }
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setOtpLoading(true);
    try {
      await api.sendOtp(phoneNumber);
      setIsOtpSent(true);
      toast({ title: "OTP Sent", description: "Please check your messages." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (finalOtp?: string) => {
    const code = finalOtp || otp;
    if (code.length < 6) return;
    setOtpLoading(true);
    try {
      const res: any = await api.verifyOtp(phoneNumber, code);
      if (res.status === 'success') {
        setAuth(res.data.user);
        toast({ title: "Authentication successful", description: `Welcome back!` });
      }
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070')] bg-cover bg-center py-12 px-4 relative">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-4 relative z-10"
      >
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary shadow-2xl">
            <span className="text-white font-black text-2xl">Y</span>
          </div>
          <h1 className="text-4xl font-black text-white drop-shadow-lg">Yumora</h1>
          <p className="text-white/80 text-sm font-medium">Coimbatore's Premium Food Delivery</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-black text-center text-gray-900">Welcome</CardTitle>
            <CardDescription className="text-center font-medium text-gray-600">
              Pick your preferred login method
            </CardDescription>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                {error}
              </motion.div>
            )}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="w-full bg-gray-100/50 p-1 rounded-2xl h-12">
                <TabsTrigger value="login" className="w-full rounded-xl font-bold">Admin Login</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-gray-500">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 pl-12 bg-white/50 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-gray-500">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 pl-12 pr-12 bg-white/50 rounded-xl"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <Link
                        to="/forgot-password"
                        className="text-xs font-bold text-primary hover:underline transition-all"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl gradient-primary font-bold shadow-lg" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;