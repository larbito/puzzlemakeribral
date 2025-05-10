import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const AuthCallback = () => {
  const { handleAuthCallback } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const processCallback = async () => {
      try {
        await handleAuthCallback();
      } catch (error) {
        console.error('Error in auth callback:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
      }
    };

    processCallback();
  }, [handleAuthCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <div className="animate-pulse text-primary text-lg">Completing Sign In...</div>
        <p className="text-sm text-muted-foreground">Please wait while we verify your credentials.</p>
      </div>
    </div>
  );
}; 