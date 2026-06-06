import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

const AuthLoader = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    // If we have a token but aren't "hydrated" yet, we could fetch user profile here
    // For now, Zustand's persist handles the hydration.
  }, [isAuthenticated, token]);

  return <>{children}</>;
};

export default AuthLoader;
