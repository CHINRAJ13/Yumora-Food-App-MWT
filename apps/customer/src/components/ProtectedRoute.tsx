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

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Unify role checking: support both 'roles' array and 'requiredRole' string
  const allowedRoles = roles || (requiredRole ? [requiredRole] : null);

  if (allowedRoles && user && !allowedRoles.some(r => user.roles?.includes(r as any))) {
    // Role mismatch, redirect to home since other dashboards don't exist in this app
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

