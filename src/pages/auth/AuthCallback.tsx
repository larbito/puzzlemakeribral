import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

function parseHash(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
    expires_in: params.get('expires_in'),
    token_type: params.get('token_type'),
    error: params.get('error'),
    error_description: params.get('error_description'),
  };
}

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { access_token, refresh_token, error, error_description } = parseHash(window.location.hash);
        if (error) throw new Error(error_description || error);

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) throw sessionError;
          navigate('/dashboard', { replace: true });
        } else {
          throw new Error('Missing access token or refresh token in callback.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred during authentication');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };
    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-destructive text-center">
          <p>Authentication Error</p>
          <p className="text-sm mt-2">{error}</p>
          <p className="text-sm text-muted-foreground mt-4">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p>Completing sign-in, please wait...</p>
      </div>
    </div>
  );
}; 