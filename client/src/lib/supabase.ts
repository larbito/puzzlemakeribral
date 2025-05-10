import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Log configuration (for debugging)
console.log('Initializing Supabase client');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Re-enable this but handle it in the root component
    storage: window.localStorage,
    storageKey: 'puzzle-craft-auth',
    flowType: 'pkce'
  }
});

// Helper to get the current origin, even in development
const getRedirectTo = () => {
  return `${window.location.origin}/auth/callback`;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getRedirectTo(),
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

export const signInWithApple = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: getRedirectTo(),
      skipBrowserRedirect: false
    }
  });
  if (error) {
    console.error('Apple Sign In Error:', error);
  }
  return { data, error };
};

export const signInWithFacebook = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: getRedirectTo(),
      skipBrowserRedirect: false
    }
  });
  if (error) {
    console.error('Facebook Sign In Error:', error);
  }
  return { data, error };
};

export const signInWithGithub = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: getRedirectTo(),
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