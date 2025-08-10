import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

// Build a safe stub so the app doesn't crash if env vars are not configured
function createSupabaseStub() {
  const noop = async (..._args: any[]) => ({ data: null, error: new Error('Supabase not configured') });
  const onAuthStateChange = (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } });
  const getSession = async () => ({ data: { session: null }, error: null });
  const getUser = async () => ({ data: { user: null }, error: new Error('Supabase not configured') });
  const signOut = async () => ({ error: null });
  return {
    auth: {
      onAuthStateChange,
      getSession,
      getUser,
      signInWithOAuth: noop,
      signOut,
    },
  } as any;
}

// Avoid hard crash: log configuration
if (!hasSupabase) {
  // eslint-disable-next-line no-console
  console.warn('Supabase env missing. Auth features are disabled. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '';

export const supabase = hasSupabase
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : createSupabaseStub();

// Set up auth state change listener (no-op for stub)
supabase.auth.onAuthStateChange?.((event: string, session: any) => {
  // eslint-disable-next-line no-console
  console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
  try {
    if (session) {
      localStorage.setItem('supabase.auth.token', JSON.stringify(session));
      if (event === 'SIGNED_IN') {
        window.location.href = '/dashboard';
      }
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem('supabase.auth.token');
      window.location.href = '/login';
    }
  } catch {}
});

// Initialize session from storage (safe)
try {
  const storedSession = localStorage.getItem('supabase.auth.token');
  if (storedSession && hasSupabase) {
    const session = JSON.parse(storedSession);
    if (session?.access_token) {
      supabase.auth.getUser(session.access_token).then(({ data: { user }, error }: any) => {
        if (error || !user) {
          localStorage.removeItem('supabase.auth.token');
        }
      });
    }
  }
} catch {}

export const signInWithGoogle = async () => {
  if (!hasSupabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUrl, queryParams: { access_type: 'offline', prompt: 'consent' } },
  });
};

export const signInWithApple = async () => {
  if (!hasSupabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: redirectUrl, skipBrowserRedirect: false } });
};

export const signInWithFacebook = async () => {
  if (!hasSupabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.auth.signInWithOAuth({ provider: 'facebook', options: { redirectTo: redirectUrl, skipBrowserRedirect: false } });
};

export const signInWithGithub = async () => {
  if (!hasSupabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: redirectUrl, skipBrowserRedirect: false } });
};

export const signOut = async () => {
  if (!hasSupabase) return { error: null };
  return supabase.auth.signOut();
}; 