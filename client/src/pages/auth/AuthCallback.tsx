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
        
        // Check if we already have a valid session in localStorage
        const storedSession = window.localStorage.getItem('puzzle-craft-auth');
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          if (parsedSession?.access_token) {
            console.log('Found existing session, redirecting to dashboard');
            navigate('/dashboard', { replace: true });
            return;
          }
        }
        
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

        console.log('Session obtained successfully');
        
        // Store the new session
        window.localStorage.setItem('puzzle-craft-auth', JSON.stringify(data.session));
        
        // Navigate to dashboard
        console.log('Redirecting to dashboard');
        navigate('/dashboard', { replace: true });
        toast.success('Successfully signed in!');
      } catch (error) {
        console.error('Error in auth callback:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/login', { replace: true });
      }
    };

    // Handle the callback immediately
    handleCallback();
  }, [navigate, searchParams]);

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