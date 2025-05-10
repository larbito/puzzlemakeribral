import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        setError(null);

        // Get the current session from Supabase
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (mounted) {
          if (currentSession) {
            console.log('Found active session');
            setSession(currentSession);
            setUser(currentSession.user);

            // Store session in localStorage for persistence
            localStorage.setItem('puzzle-craft-auth', JSON.stringify(currentSession));
          } else {
            console.log('No active session found');
            // Clear any stale session data
            localStorage.removeItem('puzzle-craft-auth');
            setSession(null);
            setUser(null);

            // Redirect to login if trying to access protected routes
            if (location.pathname.startsWith('/dashboard')) {
              navigate('/login');
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Failed to initialize authentication');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, currentSession ? 'Session exists' : 'No session');

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        localStorage.setItem('puzzle-craft-auth', JSON.stringify(currentSession));

        if (event === 'SIGNED_IN') {
          // Get redirect path from URL or default to dashboard
          const params = new URLSearchParams(location.search);
          const redirectTo = params.get('redirect') || '/dashboard';
          navigate(redirectTo, { replace: true });
          toast.success('Successfully signed in!');
        }
      } else {
        setSession(null);
        setUser(null);
        localStorage.removeItem('puzzle-craft-auth');

        if (event === 'SIGNED_OUT') {
          navigate('/login', { replace: true });
          toast.success('Successfully signed out!');
        }
      }
    });

    // Initialize auth state
    initializeAuth();

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  // Check session status periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession && !session) {
        setSession(currentSession);
        setUser(currentSession.user);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [session]);

  const signIn = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in');
      toast.error('Sign in failed. Please try again.');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
      localStorage.removeItem('puzzle-craft-auth');
      setSession(null);
      setUser(null);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign out');
      toast.error('Sign out failed. Please try again.');
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 