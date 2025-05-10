import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      // Store the attempted URL to redirect back after login
      const currentPath = location.pathname + location.search;
      if (currentPath !== '/login') {
        navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      }
    }
  }, [session, loading, navigate, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-primary text-lg">Loading...</div>
          <p className="text-sm text-muted-foreground mt-2">Please wait while we verify your session.</p>
        </div>
      </div>
    );
  }

  // Only render children if we have both a user and a session
  if (!user || !session) {
    return null;
  }

  return <>{children}</>;
}; 