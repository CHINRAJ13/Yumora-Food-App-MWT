import { useState } from "react";
import { Link } from "react-router-dom";
import * as api from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Mail, Phone, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = method === "email" ? { email } : { phone };
      await api.forgotPassword(data);
      setSubmitted(true);
      toast({ 
        title: "Link Sent", 
        description: `A reset link has been sent to your ${method}.` 
      });
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

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070')] bg-cover bg-center py-12 px-4 relative">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="bg-white/90 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl overflow-hidden text-center p-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-gray-900 mb-2">Check Your {method === 'email' ? 'Email' : 'Messages'}</CardTitle>
            <CardDescription className="text-gray-600 font-medium mb-8">
              We've sent a password reset link to <br/>
              <span className="font-bold text-gray-900">{method === 'email' ? email : phone}</span>
            </CardDescription>
            <Link to="/login">
              <Button className="w-full h-12 rounded-xl gradient-primary font-bold shadow-lg">
                Back to Login
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070')] bg-cover bg-center py-12 px-4 relative">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-4 relative z-10"
      >
        <div className="text-center space-y-2 mb-6">
          <Link to="/login" className="inline-flex items-center text-white/80 hover:text-white transition-colors text-sm font-bold mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Link>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary shadow-2xl">
            <span className="text-white font-black text-2xl">Y</span>
          </div>
          <h1 className="text-4xl font-black text-white drop-shadow-lg">Forgot Password?</h1>
          <p className="text-white/80 text-sm font-medium">No worries, we'll help you get back in</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setMethod("email")}
                className={`flex-1 h-10 rounded-xl font-bold text-xs transition-all ${method === 'email' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
              >
                Email
              </button>
              <button 
                onClick={() => setMethod("phone")}
                className={`flex-1 h-10 rounded-xl font-bold text-xs transition-all ${method === 'phone' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
              >
                SMS
              </button>
            </div>
            <CardDescription className="text-center font-medium text-gray-600">
              Enter your registered {method} to receive a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500">{method === 'email' ? 'Email Address' : 'Phone Number'}</Label>
                <div className="relative">
                  {method === 'email' ? (
                    <>
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 pl-12 bg-white/50 rounded-xl"
                      />
                    </>
                  ) : (
                    <>
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="tel"
                        placeholder="Enter 10-digit number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="h-12 pl-12 bg-white/50 rounded-xl"
                      />
                    </>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl gradient-primary font-bold shadow-lg" disabled={loading}>
                {loading ? "Sending Link..." : "Send Reset Link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
