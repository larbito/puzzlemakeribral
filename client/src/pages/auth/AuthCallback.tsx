import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const AuthCallback = () => {
  const { handleAuthCallback } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      if (isProcessing) return;
      
      try {
        setIsProcessing(true);
        await handleAuthCallback();
        // Navigation will be handled by AuthContext
      } catch (error) {
        console.error('Error in auth callback:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [handleAuthCallback, navigate, isProcessing]);

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