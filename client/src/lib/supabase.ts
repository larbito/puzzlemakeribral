import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a custom storage object
const customStorage = {
  getItem: (key: string) => {
    const value = localStorage.getItem(key);
    console.log('Getting storage item:', key, value ? 'exists' : 'not found');
    return value;
  },
  setItem: (key: string, value: string) => {
    console.log('Setting storage item:', key);
    localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    console.log('Removing storage item:', key);
    localStorage.removeItem(key);
  }
};

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
    storage: customStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce'
  }
});

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
  
  if (session) {
    // Store the session
    customStorage.setItem('supabase.auth.token', JSON.stringify(session));
    
    if (event === 'SIGNED_IN') {
      // Force refresh the page to ensure all components get the updated session
      window.location.href = '/dashboard';
    }
  } else {
    // Clear the session
    customStorage.removeItem('supabase.auth.token');
    
    if (event === 'SIGNED_OUT') {
      window.location.href = '/login';
    }
  }
});

// Initialize session from storage
const storedSession = customStorage.getItem('supabase.auth.token');
if (storedSession) {
  try {
    const session = JSON.parse(storedSession);
    if (session?.access_token) {
      console.log('Found stored session, validating...');
      supabase.auth.getUser(session.access_token)
        .then(({ data: { user }, error }) => {
          if (error || !user) {
            console.log('Stored session is invalid, removing');
            customStorage.removeItem('supabase.auth.token');
          } else {
            console.log('Stored session is valid');
          }
        });
    }
  } catch (error) {
    console.error('Error parsing stored session:', error);
    customStorage.removeItem('supabase.auth.token');
  }
}

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