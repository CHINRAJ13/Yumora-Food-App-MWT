import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import * as api from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({ 
        title: "Error", 
        description: "Passwords do not match", 
        variant: "destructive" 
      });
      return;
    }

    if (password.length < 8) {
      toast({ 
        title: "Error", 
        description: "Password must be at least 8 characters", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      if (!token) throw new Error("Invalid reset link");
      await api.resetPassword(token, { password });
      
      toast({ 
        title: "Success!", 
        description: "Your password has been reset successfully." 
      });
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
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
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-white drop-shadow-lg">Reset Password</h1>
          <p className="text-white/80 text-sm font-medium">Create a new secure password for your account</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-black text-center text-gray-900">New Credentials</CardTitle>
            <CardDescription className="text-center font-medium text-gray-600">
              Ensure your new password is strong
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500">New Password</Label>
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
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 pl-12 bg-white/50 rounded-xl"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl gradient-primary font-bold shadow-lg mt-6" disabled={loading}>
                {loading ? "Updating..." : "Reset Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
