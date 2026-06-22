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

  // If authenticated restaurant user is not approved, redirect to approval status page
  if (isAuthenticated && user?.roles?.includes('restaurant') && (user as any).status !== 'active') {
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

  if (allowedRoles && user && !allowedRoles.some(r => user.roles?.includes(r as any))) {
    // Redirect to appropriate dashboard based on actual roles
    if (user.roles?.includes('admin')) return <Navigate to="/admin" replace />;
    if (user.roles?.includes('delivery')) return <Navigate to="/delivery" replace />;
    if (user.roles?.includes('restaurant')) return <Navigate to="/restaurant" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

