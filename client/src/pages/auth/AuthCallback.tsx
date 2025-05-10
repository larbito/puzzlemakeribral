import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the auth code from the URL
        const code = searchParams.get('code');
        if (!code) {
          const error = searchParams.get('error');
          const errorDescription = searchParams.get('error_description');
          throw new Error(errorDescription || error || 'No code provided');
        }

        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        if (!data.session) {
          throw new Error('No session returned');
        }

        // Get the redirect URL from state if it exists
        const redirectTo = searchParams.get('redirect_to') || '/dashboard';
        navigate(redirectTo, { replace: true });
        toast.success('Successfully signed in!');
      } catch (error) {
        console.error('Error in auth callback:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/login', { replace: true });
      }
    };

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