import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Log configuration (for debugging)
console.log('Supabase URL:', supabaseUrl);
console.log('Auth Configuration:', {
  redirectUrl: `${window.location.origin}/auth/callback`,
  flowType: 'pkce'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable this as we handle it manually
    storage: window.localStorage,
    storageKey: 'puzzle-craft-auth',
    flowType: 'pkce',
    debug: true // Enable debug mode
  }
});

// Helper to get the current origin, even in development
const getRedirectTo = () => {
  const redirectUrl = `${window.location.origin}/auth/callback`;
  console.log('Generated redirect URL:', redirectUrl);
  return redirectUrl;
};

export const signInWithGoogle = async () => {
  console.log('Initiating Google sign-in...');
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
  } else {
    console.log('Google sign-in initiated successfully');
  }
  return { data, error };
};

export const signInWithApple = async () => {
  console.log('Initiating Apple sign-in...');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: getRedirectTo(),
      skipBrowserRedirect: false
    }
  });
  if (error) {
    console.error('Apple Sign In Error:', error);
  } else {
    console.log('Apple sign-in initiated successfully');
  }
  return { data, error };
};

export const signInWithFacebook = async () => {
  console.log('Initiating Facebook sign-in...');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: getRedirectTo(),
      skipBrowserRedirect: false
    }
  });
  if (error) {
    console.error('Facebook Sign In Error:', error);
  } else {
    console.log('Facebook sign-in initiated successfully');
  }
  return { data, error };
};

export const signInWithGithub = async () => {
  console.log('Initiating GitHub sign-in...');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: getRedirectTo(),
      skipBrowserRedirect: false
    }
  });
  if (error) {
    console.error('GitHub Sign In Error:', error);
  } else {
    console.log('GitHub sign-in initiated successfully');
  }
  return { data, error };
};

export const signOut = async () => {
  console.log('Initiating sign-out...');
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign Out Error:', error);
  } else {
    console.log('Sign-out successful');
  }
  return { error };
}; 