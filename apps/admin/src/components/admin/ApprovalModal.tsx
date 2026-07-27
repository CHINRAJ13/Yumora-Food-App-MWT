import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, FileText, User, Phone, Mail, Truck, ChefHat } from "lucide-react";
import { useState } from "react";

interface ApprovalModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, comment?: string) => void;
  onReject: (id: string, comment?: string) => void;
}

const ApprovalModal = ({ user, isOpen, onClose, onApprove, onReject }: ApprovalModalProps) => {
  const [comment, setComment] = useState("");

  if (!user) return null;

  const isRestaurant = user.type === 'restaurant';
  const isDelivery = user.type === 'delivery';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden bg-white rounded-3xl">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isRestaurant ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {isRestaurant ? <ChefHat size={28} /> : <Truck size={28} />}
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-gray-900 flex items-center gap-2">
                {user.name}
                <Badge variant="outline" className="text-[10px] uppercase font-bold bg-white">
                  {isRestaurant ? 'Restaurant' : 'Delivery'}
                </Badge>
              </DialogTitle>
              <p className="text-sm font-medium text-gray-500 mt-1">Review applicant details and KYC documents</p>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] p-6 overflow-y-auto">
          <div className="space-y-8">
            {/* Basic Info */}
            <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                <User size={14} /> Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1"><Mail size={12}/> Email</p>
                  <p className="text-sm font-bold text-gray-900">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1"><Phone size={12}/> Phone</p>
                  <p className="text-sm font-bold text-gray-900">{user.phone || 'N/A'}</p>
                </div>
              </div>
            </section>

            {/* KYC Details */}
            <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                <FileText size={14} /> Verification Documents
              </h3>
              <div className="space-y-6">
                
                {/* Aadhar Details - For both */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Aadhar Number</p>
                  <p className="text-sm font-bold text-gray-900 mb-4 tracking-widest">
                    {isRestaurant ? user.restaurantDetails?.aadharNumber : user.deliveryDetails?.aadharNumber || 'Not provided'}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">Aadhar Image</p>
                  <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group relative">
                    {isRestaurant && user.restaurantDetails?.aadharImage || isDelivery && user.deliveryDetails?.aadharImage ? (
                      <img 
                        src={isRestaurant ? user.restaurantDetails.aadharImage : user.deliveryDetails.aadharImage} 
                        alt="Aadhar" 
                        className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(isRestaurant ? user.restaurantDetails.aadharImage : user.deliveryDetails.aadharImage, '_blank')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold uppercase">No Image Provided</div>
                    )}
                  </div>
                </div>

                {/* Delivery Specific: License & RC */}
                {isDelivery && (
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-gray-500">License Number</p>
                        <p className="text-sm font-bold text-gray-900 uppercase">{user.deliveryDetails?.licenseNumber || 'Not provided'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-gray-500">Vehicle Number</p>
                        <p className="text-sm font-bold text-gray-900 uppercase">{user.deliveryDetails?.vehicleNumber || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">License Image</p>
                        <div className="w-full h-32 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                          {user.deliveryDetails?.licenseImage ? (
                            <img 
                              src={user.deliveryDetails.licenseImage} 
                              alt="License" 
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(user.deliveryDetails.licenseImage, '_blank')}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold uppercase text-center p-2">No Image</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">RC Book Image</p>
                        <div className="w-full h-32 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                          {user.deliveryDetails?.rcImage ? (
                            <img 
                              src={user.deliveryDetails.rcImage} 
                              alt="RC Book" 
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(user.deliveryDetails.rcImage, '_blank')}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold uppercase text-center p-2">No Image</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Specific: PAN & Bank Details */}
                {isDelivery && (
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-gray-500">PAN Number</p>
                        <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">{user.deliveryDetails?.panNumber || 'Not provided'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">PAN Image</p>
                        <div className="w-full h-32 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                          {user.deliveryDetails?.panImage ? (
                            <img 
                              src={user.deliveryDetails.panImage} 
                              alt="PAN Card" 
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(user.deliveryDetails.panImage, '_blank')}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold uppercase text-center p-2">No Image</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-gray-500">Account Number</p>
                        <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">{user.deliveryDetails?.accountNumber || 'Not provided'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-gray-500">IFSC Code</p>
                        <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">{user.deliveryDetails?.ifscCode || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Specific: Selfie */}
                {isDelivery && (
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6">
                    <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200 shrink-0">
                      {user.deliveryDetails?.selfieImage ? (
                        <img 
                          src={user.deliveryDetails.selfieImage} 
                          alt="Selfie" 
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(user.deliveryDetails.selfieImage, '_blank')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold uppercase text-center">No Image</div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Live Selfie Verification</p>
                      <p className="text-sm font-medium text-gray-700">Used for facial recognition and delivery identity verification.</p>
                    </div>
                  </div>
                )}

                {/* Restaurant Specific: Restaurant Image */}
                {isRestaurant && (
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Restaurant Name</p>
                    <p className="text-sm font-bold text-gray-900 mb-4">{user.restaurantDetails?.name || 'Not provided'}</p>
                    <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">Restaurant / Business Proof</p>
                    <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 mb-4">
                      {user.restaurantDetails?.image ? (
                        <img 
                          src={user.restaurantDetails.image} 
                          alt="Restaurant" 
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(user.restaurantDetails.image, '_blank')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold uppercase">No Image Provided</div>
                      )}
                    </div>
                    <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">FSSAI Number</p>
                    <p className="text-sm font-bold text-gray-900 mb-4 tracking-widest">{user.restaurantDetails?.fssaiNumber || 'Not provided'}</p>
                    <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">FSSAI Certificate Image</p>
                    <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                      {user.restaurantDetails?.fssaiCertificate ? (
                        <img 
                          src={user.restaurantDetails.fssaiCertificate} 
                          alt="FSSAI Certificate" 
                          className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(user.restaurantDetails.fssaiCertificate, '_blank')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold uppercase">No Image Provided</div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </section>

            {/* Admin Comments */}
            <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                Admin Comments
              </h3>
              <textarea 
                placeholder="Optional notes or reason for rejection..." 
                className="flex w-full p-3 text-sm bg-white resize-none h-24 rounded-xl border border-gray-200 focus:border-primary focus:ring-primary/20 outline-none"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </section>
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-gray-100 bg-gray-50/50 flex gap-3 sm:justify-end">
          <Button 
            variant="outline" 
            onClick={() => onReject(user._id, comment)}
            className="rounded-xl h-12 px-6 font-bold text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject Application
          </Button>
          <Button 
            onClick={() => onApprove(user._id, comment)}
            className="rounded-xl h-12 px-8 font-bold bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200 transition-all"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approve & Activate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovalModal;
