import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  handleAuthCallback: () => Promise<void>;
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
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        setError(null);
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        // Set up real-time subscription to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, currentSession: Session | null) => {
          console.log('Auth state changed:', event, currentSession?.user?.email);
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          // Handle sign out
          if (event === 'SIGNED_OUT') {
            navigate('/login');
            toast.success('Successfully signed out');
          }

          // Handle sign in
          if (event === 'SIGNED_IN') {
            if (!location.pathname.startsWith('/auth')) {
              navigate('/dashboard');
              toast.success('Successfully signed in');
            }
          }
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error initializing auth:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize authentication');
        toast.error('Authentication error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setLoading(false);
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
            prompt: 'consent',
          }
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in');
      toast.error('Sign in error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign out');
      toast.error('Sign out error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  };

  const handleAuthCallback = async () => {
    try {
      setError(null);
      const { data: { session: newSession }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (!newSession) {
        throw new Error('No session found');
      }
      
      setSession(newSession);
      setUser(newSession.user);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error handling auth callback:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete authentication');
      toast.error('Authentication error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      navigate('/login');
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signOut,
    handleAuthCallback
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