import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signInWithGoogle, signInWithApple, signInWithFacebook, signInWithGithub, supabase } from '@/lib/supabase';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaApple } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

export const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  // If user is already logged in, redirect to dashboard or the requested page
  useEffect(() => {
    if (session) {
      const params = new URLSearchParams(location.search);
      const redirectTo = params.get('redirect') || '/dashboard';
      navigate(redirectTo);
    }
  }, [session, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.session) {
        const params = new URLSearchParams(location.search);
        const redirectTo = params.get('redirect') || '/dashboard';
        navigate(redirectTo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook' | 'github') => {
    setIsLoading(true);
    setError(null);
    try {
      const loginFn = {
        google: signInWithGoogle,
        apple: signInWithApple,
        facebook: signInWithFacebook,
        github: signInWithGithub
      }[provider];

      // Add the redirect parameter to the OAuth redirect URL
      const params = new URLSearchParams(location.search);
      const redirectTo = params.get('redirect');
      const { error } = await loginFn();
      
      if (error) throw error;
      // Social login will redirect to callback URL
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-50" />
      <div className="absolute inset-0 bg-gradient-radial from-secondary/5 via-transparent to-transparent translate-x-full opacity-50" />
      <div className="absolute inset-0 bg-grid-white/[0.02]" />

      <Card className="w-full max-w-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 animate-gradient" />
        
        <CardHeader className="space-y-3 relative">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>

        <CardContent className="relative">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="w-full pl-10 pr-4 py-2 bg-card/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="w-full pl-10 pr-4 py-2 bg-card/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded border-border/50" />
                <span>Remember me</span>
              </label>
              <Link 
                to="/forgot-password"
                className="text-primary hover:text-primary/90 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 group relative overflow-hidden"
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center justify-center">
                {isLoading ? (
                  <span className="animate-pulse">Logging in...</span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="border-primary/20 hover:border-primary/50 relative group overflow-hidden"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-2">
                  <FcGoogle className="w-5 h-5" />
                  Google
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-primary/20 hover:border-primary/50 relative group overflow-hidden"
                onClick={() => handleSocialLogin('github')}
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  GitHub
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-primary/20 hover:border-primary/50 relative group overflow-hidden"
                onClick={() => handleSocialLogin('facebook')}
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-2">
                  <FaFacebook className="w-5 h-5 text-[#1877F2]" />
                  Facebook
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-primary/20 hover:border-primary/50 relative group overflow-hidden"
                onClick={() => handleSocialLogin('apple')}
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-2">
                  <FaApple className="w-5 h-5" />
                  Apple
                </span>
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary hover:text-primary/90 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}; 