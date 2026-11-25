import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  requiredRole?: string;
  permission?: string;
}

const ProtectedRoute = ({ children, roles, requiredRole, permission }: ProtectedRouteProps) => {
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

  if (allowedRoles && user && !allowedRoles.some((r) => user.type === r)) {
    if (user.type === 'admin') return <Navigate to="/overview" replace />;
    if (user.type === 'delivery') return <Navigate to="/delivery" replace />;
    if (user.type === 'restaurant') return <Navigate to="/restaurant" replace />;
    return <Navigate to="/" replace />;
  }

  // Granular admin permission check
  if (permission && user?.type === 'admin') {
    const perms = user.permissions || [];
    const hasAccess = perms.includes('super_admin') || perms.includes(permission);
    if (!hasAccess) {
      return <Navigate to="/overview" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
