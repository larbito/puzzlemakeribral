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

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setError(null);
        
        // First check localStorage for existing session
        const storedSession = window.localStorage.getItem('puzzle-craft-auth');
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          if (parsedSession?.access_token) {
            console.log('Found stored session, validating...');
            const { data: { user: storedUser }, error: userError } = await supabase.auth.getUser(parsedSession.access_token);
            
            if (!userError && storedUser) {
              console.log('Stored session is valid');
              setSession(parsedSession);
              setUser(storedUser);
              
              if (location.pathname === '/login') {
                navigate('/dashboard');
              }
              return;
            } else {
              console.log('Stored session is invalid, removing');
              window.localStorage.removeItem('puzzle-craft-auth');
            }
          }
        }
        
        // If no valid stored session, get the current session
        console.log('Getting current session from Supabase');
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (mounted) {
          if (currentSession) {
            console.log('Found current session');
            setSession(currentSession);
            setUser(currentSession.user);
            window.localStorage.setItem('puzzle-craft-auth', JSON.stringify(currentSession));

            if (location.pathname === '/login') {
              navigate('/dashboard');
            }
          } else {
            console.log('No current session found');
            if (location.pathname.startsWith('/dashboard')) {
              navigate('/login');
            }
          }
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (!mounted) return;

          console.log('Auth state changed:', event);
          
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
            window.localStorage.setItem('puzzle-craft-auth', JSON.stringify(currentSession));
            
            if (event === 'SIGNED_IN') {
              const redirectTo = new URLSearchParams(location.search).get('redirect') || '/dashboard';
              navigate(redirectTo, { replace: true });
              toast.success('Successfully signed in!');
            }
          } else {
            setSession(null);
            setUser(null);
            window.localStorage.removeItem('puzzle-craft-auth');
            
            if (event === 'SIGNED_OUT') {
              navigate('/login', { replace: true });
              toast.success('Successfully signed out!');
            }
          }
        });

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        if (!mounted) return;
        console.error('Error initializing auth:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize authentication');
        toast.error('Authentication error occurred');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, [navigate, location]);

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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.localStorage.removeItem('puzzle-craft-auth');
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