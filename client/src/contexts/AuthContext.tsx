import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle navigation based on auth state
  const handleAuthNavigation = useCallback(async (event: AuthChangeEvent, currentSession: Session | null) => {
    if (isNavigating) return; // Prevent multiple navigations
    
    const isCallback = location.pathname === '/auth/callback';
    const isLoginPage = location.pathname === '/login';
    
    try {
      setIsNavigating(true);
      
      if (event === 'SIGNED_OUT') {
        if (!isLoginPage) {
          navigate('/login');
          toast.success('Successfully signed out');
        }
      } else if (event === 'SIGNED_IN' && currentSession) {
        if (!isCallback) {
          const params = new URLSearchParams(location.search);
          const redirectTo = params.get('redirect') || '/dashboard';
          navigate(redirectTo);
          toast.success('Successfully signed in');
        }
      }
    } finally {
      setIsNavigating(false);
    }
  }, [navigate, location, isNavigating]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        setError(null);
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (sessionError) {
          throw sessionError;
        }

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await handleAuthNavigation('SIGNED_IN', initialSession);
        }

        // Set up real-time subscription to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (!mounted) return;
          
          console.log('Auth state changed:', event, currentSession?.user?.email);
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          await handleAuthNavigation(event, currentSession);
        });

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        if (!mounted) return;
        
        console.error('Error initializing auth:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize authentication');
        toast.error('Authentication error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, [handleAuthNavigation]);

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