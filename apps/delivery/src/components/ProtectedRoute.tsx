import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  requiredRole?: string;
}

const ProtectedRoute = ({ children, roles, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading } = useAuthStore();
  const location = useLocation();

  // If authenticated delivery user is not approved, redirect to approval status page
  if (isAuthenticated && user?.type === 'delivery' && !['active', 'approved'].includes((user as any).status)) {
    return <Navigate to="/approval-status" replace />;
  }

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Unify role checking: support both 'roles' array and 'requiredRole' string
  const allowedRoles = roles || (requiredRole ? [requiredRole] : null);

  if (allowedRoles && user && !allowedRoles.some(r => user.type === r)) {
    // Redirect to appropriate dashboard based on actual roles
    if (user.type === 'admin') return <Navigate to="/admin" replace />;
    if (user.type === 'delivery') return <Navigate to="/delivery" replace />;
    if (user.type === 'restaurant') return <Navigate to="/restaurant" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

