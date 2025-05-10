import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, session, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      // Store the attempted URL to redirect back after login
      const currentPath = location.pathname + location.search;
      if (currentPath !== '/login') {
        navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
        toast.error('Please sign in to access this page');
      }
    }
  }, [session, loading, navigate, location]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <div className="animate-pulse text-primary text-lg">Loading...</div>
          <p className="text-sm text-muted-foreground">Please wait while we verify your session.</p>
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