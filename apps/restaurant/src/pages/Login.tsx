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
  const [role, setRole] = useState("restaurant");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Role-specific fields
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantImage, setRestaurantImage] = useState<File | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Bike");
  const [aadharNumber, setAadharNumber] = useState("");
  const [aadharImage, setAadharImage] = useState<File | null>(null);
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [fssaiCertificate, setFssaiCertificate] = useState<File | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.type === 'restaurant') {
        navigate('/');
      } else {
        setError("Access denied. Restaurant account required.");
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
        vehicleType: role === 'delivery' ? vehicleType : undefined,
        aadharNumber: aadharNumber,
        fssaiNumber: role === 'restaurant' ? fssaiNumber : undefined
      };

      let finalData;
      if (role === 'restaurant') {
        const formData = new FormData();
        Object.keys(signupData).forEach(key => {
          if (signupData[key] !== undefined) {
            formData.append(key, signupData[key]);
          }
        });
        if (restaurantImage) formData.append('image', restaurantImage);
        if (aadharImage) formData.append('aadharImage', aadharImage);
        if (fssaiCertificate) formData.append('fssaiCertificate', fssaiCertificate);
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
      await api.sendOtp(phoneNumber, role);
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
            <Tabs defaultValue="otp" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100/50 p-1 rounded-2xl h-12">
                <TabsTrigger value="otp" className="rounded-xl font-bold">Phone</TabsTrigger>
                <TabsTrigger value="login" className="rounded-xl font-bold">Email</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-xl font-bold">Join</TabsTrigger>
              </TabsList>

              <TabsContent value="otp" className="space-y-6 mt-6">
                {!isOtpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-500">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="tel"
                          placeholder="Enter 10-digit number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                          className="h-12 pl-12 bg-white/50 rounded-xl"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl gradient-primary font-bold shadow-lg" disabled={otpLoading}>
                      {otpLoading ? "Sending Code..." : "Send Verification Code"}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-6 text-center">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-500">Enter 6-Digit Code</Label>
                      <OTPInput onComplete={handleVerifyOtp} disabled={otpLoading} />
                      <p className="text-xs text-gray-500 mt-4">Code sent to <span className="font-bold">{phoneNumber}</span></p>
                    </div>
                    <Button
                      onClick={() => handleVerifyOtp()}
                      className="w-full h-12 rounded-xl gradient-primary font-bold shadow-lg"
                      disabled={otpLoading || otp.length < 6}
                    >
                      {otpLoading ? "Verifying..." : "Verify & Sign In"}
                    </Button>
                  </div>
                )}
              </TabsContent>

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

              <TabsContent value="signup" className="space-y-4 mt-6">
                {successMessage ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 text-center py-8"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">⏳</span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900">Application Received</h3>
                    <p className="text-gray-600 font-medium px-4">{successMessage}</p>
                    <Button
                      variant="outline"
                      onClick={() => setSuccessMessage(null)}
                      className="mt-6 rounded-xl font-bold"
                    >
                      Back to Registration
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Full Name</Label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your Name" required className="h-10 bg-white/50 rounded-xl" />
                    </div>

                    <motion.div initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Restaurant Name</Label>
                        <Input
                          value={restaurantName}
                          onChange={(e) => setRestaurantName(e.target.value)}
                          placeholder="e.g. Royal Cafe"
                          required
                          className="h-10 bg-orange-50/50 border-orange-200 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Hotel Card / Business Proof</Label>
                        <div className="flex gap-4 items-start">
                          <div className="flex-1">
                            <Input
                              type="file"
                              onChange={(e) => setRestaurantImage(e.target.files?.[0] || null)}
                              accept="image/*"
                              required
                              className="h-10 bg-orange-50/50 border-orange-200 rounded-xl pt-2 file:mr-4 file:py-0 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200"
                            />
                            <p className="text-[9px] text-gray-500 italic ml-1 mt-1">* Required for verification</p>
                          </div>
                          {restaurantImage && (
                            <div className="w-16 h-16 rounded-xl border-2 border-orange-200 overflow-hidden bg-white shrink-0 shadow-sm">
                              <img
                                src={URL.createObjectURL(restaurantImage)}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Aadhar Number</Label>
                      <Input value={aadharNumber} onChange={(e) => setAadharNumber(e.target.value)} placeholder="12 Digit Aadhar Number" required maxLength={12} minLength={12} className="h-10 bg-white/50 rounded-xl" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Phone Number</Label>
                      <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Phone Number" required className="h-10 bg-white/50 rounded-xl" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Aadhar Image</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setAadharImage(e.target.files?.[0] || null)} required className="h-10 bg-white/50 rounded-xl pt-2 file:mr-4 file:py-0 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white" />
                    </div>

                    <motion.div initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      {role === 'restaurant' && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">FSSAI Number</Label>
                            <Input value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} placeholder="14 Digit FSSAI Number" required maxLength={14} minLength={14} className="h-10 bg-white/50 rounded-xl" />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">FSSAI Certificate Image</Label>
                            <Input type="file" accept="image/*" onChange={(e) => setFssaiCertificate(e.target.files?.[0] || null)} required className="h-10 bg-white/50 rounded-xl pt-2 file:mr-4 file:py-0 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white" />
                          </div>
                        </>
                      )}
                    </motion.div>


                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Email</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="h-10 bg-white/50 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Password</Label>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required className="h-10 bg-white/50 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Confirm</Label>
                        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" required className="h-10 bg-white/50 rounded-xl" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-11 rounded-xl gradient-primary font-bold shadow-md" disabled={loading}>
                      {loading ? "Creating..." : role === 'user' ? "Create Account" : "Apply for Account"}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;