import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { handleAuthCallback } = useAuth();

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get the URL hash
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', '?'));
        
        // Check for error
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        
        if (error) {
          console.error('Auth error:', error, errorDescription);
          navigate('/auth/login?error=' + encodeURIComponent(errorDescription || 'Authentication failed'));
          return;
        }

        // Handle successful authentication
        await handleAuthCallback();
        navigate('/dashboard');
      } catch (error) {
        console.error('Error handling auth callback:', error);
        navigate('/auth/login?error=' + encodeURIComponent('Failed to complete authentication'));
      }
    }

    handleCallback();
  }, [navigate, handleAuthCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Completing Authentication...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
} 