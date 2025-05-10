import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Auth callback running, checking for code');
        
        // Get the auth code from the URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Log all URL parameters for debugging
        console.log('URL Parameters:', {
          code: code ? 'present' : 'missing',
          error,
          errorDescription,
          allParams: Object.fromEntries(searchParams.entries())
        });

        if (!code) {
          if (error || errorDescription) {
            console.error('OAuth error:', { error, errorDescription });
            throw new Error(errorDescription || error || 'Authentication error');
          }
          throw new Error('No code provided');
        }

        console.log('Auth code found, exchanging for session');
        
        // Exchange the code for a session
        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
        if (sessionError) {
          console.error('Error exchanging code for session:', sessionError);
          throw sessionError;
        }

        if (!data.session) {
          console.error('No session returned from code exchange');
          throw new Error('No session returned');
        }

        console.log('Session obtained successfully, redirecting to dashboard');
        
        // Always navigate to dashboard after successful auth
        navigate('/dashboard', { replace: true });
        toast.success('Successfully signed in!');
      } catch (error) {
        console.error('Error in auth callback:', error);
        
        // More descriptive error message based on the error type
        let errorMessage = 'Authentication failed. Please try again.';
        if (error instanceof Error) {
          if (error.message.includes('PKCE')) {
            errorMessage = 'Invalid authentication code. Please try logging in again.';
          } else if (error.message.includes('expired')) {
            errorMessage = 'Authentication code expired. Please try logging in again.';
          } else {
            errorMessage = error.message;
          }
        }
        
        toast.error(errorMessage);
        navigate('/login', { replace: true });
      }
    };

    // Only handle the callback if we don't already have a session
    if (!session) {
      console.log('No session found, handling callback');
      handleCallback();
    } else {
      console.log('Session already exists, going to dashboard');
      // If we already have a session, just go to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, searchParams, session]);

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