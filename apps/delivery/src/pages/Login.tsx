import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import * as api from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, Phone, Camera, Check, RefreshCw } from "lucide-react";
import OTPInput from "@/components/OTPInput";
import { motion } from "framer-motion";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "otp";
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
  const [role, setRole] = useState("delivery");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Role-specific fields
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantImage, setRestaurantImage] = useState<File | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Bike");
  const [aadharNumber, setAadharNumber] = useState("");
  const [aadharImage, setAadharImage] = useState<File | null>(null);
  const [licenseImage, setLicenseImage] = useState<File | null>(null);
  const [rcImage, setRcImage] = useState<File | null>(null);
  const [panNumber, setPanNumber] = useState("");
  const [panImage, setPanImage] = useState<File | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [selfieImage, setSelfieImage] = useState<File | null>(null);

  // Camera specific state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stop camera stream helper
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
    } catch (err: any) {
      setCameraError("Camera permission denied or camera not available.");
      toast({ title: "Camera Error", description: err.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  }, [stream, isCameraOpen]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
            setSelfieImage(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera(); // Cleanup on unmount
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.type === 'delivery') {
        navigate('/');
      } else {
        setError("Access denied. Delivery account required.");
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
        panNumber: role === 'delivery' ? panNumber : undefined,
        accountNumber: role === 'delivery' ? accountNumber : undefined,
        ifscCode: role === 'delivery' ? ifscCode : undefined
      };

      let finalData;
      if (role === 'restaurant' || role === 'delivery') {
        const formData = new FormData();
        Object.keys(signupData).forEach(key => {
          if (signupData[key] !== undefined) {
            formData.append(key, signupData[key]);
          }
        });
        if (restaurantImage) formData.append('image', restaurantImage);
        if (aadharImage) formData.append('aadharImage', aadharImage);
        if (licenseImage) formData.append('licenseImage', licenseImage);
        if (rcImage) formData.append('rcImage', rcImage);
        if (panImage) formData.append('panImage', panImage);
        if (selfieImage) formData.append('selfieImage', selfieImage);
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
            <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })} className="w-full">
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
                    {role === 'delivery' && (
                      <div className="space-y-2 mb-4">
                        <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Live Profile Photo (Selfie)</Label>
                        
                        {!isCameraOpen && !selfieImage && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={startCamera}
                            className="w-full h-12 border-dashed border-2 border-primary/20 hover:border-primary/50 text-primary font-bold bg-primary/5 rounded-2xl"
                          >
                            <Camera className="w-5 h-5 mr-2" /> Take Profile Photo
                          </Button>
                        )}

                        {isCameraOpen && !selfieImage && (
                          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center shadow-inner">
                            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" playsInline muted />
                            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-3 z-10">
                              <Button type="button" onClick={capturePhoto} className="bg-white text-black hover:bg-gray-100 rounded-full font-bold shadow-xl px-6">
                                <Camera className="w-4 h-4 mr-2" /> Capture
                              </Button>
                              <Button type="button" onClick={stopCamera} variant="destructive" className="rounded-full font-bold shadow-xl px-6">
                                Cancel
                              </Button>
                            </div>
                            {cameraError && <p className="text-red-500 text-xs font-bold z-10 bg-black/50 p-2 rounded-lg">{cameraError}</p>}
                          </div>
                        )}

                        {selfieImage && (
                          <div className="relative rounded-2xl overflow-hidden aspect-video border-2 border-green-500 shadow-sm mx-auto w-3/4">
                            <img src={URL.createObjectURL(selfieImage)} alt="Selfie preview" className="w-full h-full object-cover transform scale-x-[-1]" />
                            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                              <Check className="w-4 h-4" />
                            </div>
                            <div className="absolute inset-x-0 bottom-3 flex justify-center z-10">
                              <Button 
                                type="button" 
                                onClick={() => {
                                  setSelfieImage(null);
                                  startCamera();
                                }} 
                                size="sm" 
                                className="bg-white text-black hover:bg-gray-100 rounded-full font-bold shadow-xl px-6"
                              >
                                <RefreshCw className="w-4 h-4 mr-2" /> Retake
                              </Button>
                            </div>
                          </div>
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Full Name</Label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your Name" required className="h-10 bg-white/50 rounded-xl" />
                    </div>


                    <motion.div initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Vehicle Number</Label>
                        <Input
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value)}
                          placeholder="TN 37 AB 1234"
                          required
                          className="h-10 bg-blue-50/50 border-blue-200 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">License No.</Label>
                        <Input
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          placeholder="DL-12345678"
                          required
                          className="h-10 bg-blue-50/50 border-blue-200 rounded-xl text-xs"
                        />
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

                    {role === 'delivery' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">PAN Number</Label>
                            <Input value={panNumber} onChange={(e) => setPanNumber(e.target.value)} placeholder="ABCDE1234F" required className="h-10 bg-white/50 rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">PAN Image</Label>
                            <Input type="file" accept="image/*" onChange={(e) => setPanImage(e.target.files?.[0] || null)} required className="text-xs" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Account Number</Label>
                            <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Bank Account Number" required className="h-10 bg-white/50 rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">IFSC Code</Label>
                            <Input value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} placeholder="SBIN0001234" required className="h-10 bg-white/50 rounded-xl" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <motion.div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Aadhar Image</Label>
                        <Input type="file" accept="image/*" onChange={(e) => setAadharImage(e.target.files?.[0] || null)} required className="text-xs" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">License Image</Label>
                        <Input type="file" accept="image/*" onChange={(e) => setLicenseImage(e.target.files?.[0] || null)} required className="text-xs" />
                      </div>
                      {role === 'delivery' && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Vehicle RC Image</Label>
                            <Input type="file" accept="image/*" onChange={(e) => setRcImage(e.target.files?.[0] || null)} required className="text-xs" />
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