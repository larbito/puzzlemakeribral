import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Log configuration (for debugging)
console.log('Supabase URL:', supabaseUrl);
console.log('Current origin:', window.location.origin);

const redirectUrl = `${window.location.origin}/auth/callback`;
console.log('Auth Callback URL:', redirectUrl);

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

// Handle auth state changes globally
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
  
  if (event === 'SIGNED_IN' && session) {
    console.log('User signed in, storing session');
    // Store the session in localStorage
    window.localStorage.setItem('puzzle-craft-auth', JSON.stringify(session));
    
    // Redirect to dashboard if not already there
    if (!window.location.pathname.startsWith('/dashboard')) {
      window.location.href = '/dashboard';
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out, clearing session');
    window.localStorage.removeItem('puzzle-craft-auth');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
});

export const signInWithGoogle = async () => {
  console.log('Initiating Google sign-in with redirect URL:', redirectUrl);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
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
  console.log('Initiating Apple sign-in with redirect URL:', redirectUrl);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: redirectUrl,
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
  console.log('Initiating Facebook sign-in with redirect URL:', redirectUrl);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: redirectUrl,
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
  console.log('Initiating GitHub sign-in with redirect URL:', redirectUrl);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: redirectUrl,
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