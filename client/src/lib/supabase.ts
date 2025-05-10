import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'puzzle-craft-auth',
    flowType: 'pkce'
  }
});

// Helper to get the current origin, even in development
const getRedirectTo = (redirectPath: string) => {
  return `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(redirectPath)}`;
};

export const signInWithGoogle = async (redirectTo: string = '/dashboard') => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getRedirectTo(redirectTo),
      skipBrowserRedirect: false,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account'
      }
    }
  });
  if (error) {
    console.error('Google Sign In Error:', error);
  }
  return { data, error };
};

export const signInWithApple = async (redirectTo: string = '/dashboard') => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: getRedirectTo(redirectTo),
      skipBrowserRedirect: false
    }
  });
  if (error) {
    console.error('Apple Sign In Error:', error);
  }
  return { data, error };
};

export const signInWithFacebook = async (redirectTo: string = '/dashboard') => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: getRedirectTo(redirectTo),
      skipBrowserRedirect: false
    }
  });
  if (error) {
    console.error('Facebook Sign In Error:', error);
  }
  return { data, error };
};

export const signInWithGithub = async (redirectTo: string = '/dashboard') => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: getRedirectTo(redirectTo),
      skipBrowserRedirect: false
    }
  });
  if (error) {
    console.error('GitHub Sign In Error:', error);
  }
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign Out Error:', error);
  }
  return { error };
}; 