import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleAuthCallback } = useAuth();

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get the URL hash and state
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', '?'));
        const state = params.get('state');
        
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

        // Get the redirect URL from state if it exists
        let redirectTo = '/dashboard';
        if (state) {
          try {
            const stateData = JSON.parse(decodeURIComponent(state));
            if (stateData.redirectTo) {
              redirectTo = stateData.redirectTo;
            }
          } catch (e) {
            console.error('Error parsing state:', e);
          }
        }

        navigate(redirectTo);
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