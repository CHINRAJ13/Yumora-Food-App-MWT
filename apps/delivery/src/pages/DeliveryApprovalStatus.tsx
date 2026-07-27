import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { XCircle, Clock, Info } from 'lucide-react';

type DeliveryStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';

/**
 * Approval status page for delivery‑boy users.
 * Mirrors the restaurant approval UI with a premium look.
 */
const DeliveryApprovalStatus = () => {
  const { user, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    // If already approved, send to dashboard
    if (user.status === 'active' || user.status === 'approved') {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Guard: hide while redirecting or if no user
  if (!user || user.status === 'active' || user.status === 'approved') return null;

  const status = (user.status as DeliveryStatus) || 'pending';
  const comment = (user as any).deliveryProfile?.adminComment || '';

  const renderStatus = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex flex-col items-center space-y-4">
            <Clock className="w-16 h-16 text-orange-500" />
            <h2 className="text-2xl font-bold text-orange-600">Pending Review</h2>
            <p className="text-gray-600 max-w-md text-center">
              Your application has been received and is currently under review by the admin team.
            </p>
          </div>
        );
      case 'reviewing':
        return (
          <div className="flex flex-col items-center space-y-4">
            <Clock className="w-16 h-16 text-blue-500" />
            <h2 className="text-2xl font-bold text-blue-600">Under Review</h2>
            <p className="text-gray-600 max-w-md text-center">
              Our admins are reviewing your delivery details. Please be patient.
            </p>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="w-16 h-16 text-red-500" />
            <h2 className="text-2xl font-bold text-red-600">Application Rejected</h2>
            {comment && (
              <p className="text-gray-600 max-w-md text-center">
                <span className="font-medium">Reason:</span> {comment}
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 max-w-lg w-full border border-gray-200">
        {renderStatus()}
        <div className="mt-6 flex justify-center">
          {status !== 'approved' && (
            <button
              onClick={() => toast.info('If you believe this is an error, contact support.')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 transition-colors"
            >
              Contact Support
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryApprovalStatus;
