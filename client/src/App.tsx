import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { AuthCallback } from '@/pages/auth/AuthCallback';
import { Pricing as MainPricing } from '@/pages/Pricing';
import { KDPRoyaltiesCalculator } from '@/pages/dashboard/Pricing';
import { AIColoringGenerator } from '@/pages/dashboard/AIColoringGenerator';
import { SudokuPage } from '@/pages/dashboard/SudokuPage';
import { BulkGeneratorPage } from '@/pages/dashboard/BulkGeneratorPage';
import { AIBookPage } from '@/pages/dashboard/AIBookPage';
import { Contact } from '@/pages/Contact';
import { About } from '@/pages/About';
import { Overview } from '@/pages/dashboard/Overview';
import { Puzzles } from '@/pages/dashboard/Puzzles';
import { Content } from '@/pages/dashboard/Content';
import { Settings } from '@/pages/dashboard/Settings';
import { TShirtGenerator } from '@/pages/dashboard/TShirtGenerator';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Toaster } from 'sonner';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// This component will handle auth codes in the root URL
const RootAuthHandler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      console.log('Found auth code in root URL, redirecting to auth callback');
      const currentUrl = new URL(window.location.href);
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.search = currentUrl.search;
      window.location.href = callbackUrl.toString();
    }
  }, [searchParams]);

  // If there's an auth code, show loading state
  if (searchParams.get('code')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <div className="animate-pulse text-primary text-lg">Redirecting...</div>
          <p className="text-sm text-muted-foreground">Please wait while we process your sign in.</p>
        </div>
      </div>
    );
  }

  // If no auth code, render the regular home page
  return (
    <>
      <Navbar />
      <Home />
      <Footer />
    </>
  );
};

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <AuthProvider>
          <div className="min-h-screen bg-background text-foreground">
            {/* Background gradients */}
            <div className="fixed inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-50" />
            <div className="fixed inset-0 bg-gradient-radial from-secondary/5 via-transparent to-transparent translate-x-full opacity-50" />
            <div className="fixed inset-0 bg-gradient-radial from-accent/5 via-transparent to-transparent -translate-x-full opacity-50" />
            
            {/* Content */}
            <div className="relative z-10">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<RootAuthHandler />} />
                <Route path="/login" element={<><Navbar /><Login /><Footer /></>} />
                <Route path="/register" element={<><Navbar /><Register /><Footer /></>} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/pricing" element={<><Navbar /><MainPricing /><Footer /></>} />
                <Route path="/contact" element={<><Navbar /><Contact /><Footer /></>} />
                <Route path="/about" element={<><Navbar /><About /><Footer /></>} />

                {/* Protected dashboard routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Overview />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/*"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Routes>
                          <Route path="puzzles" element={<Puzzles />} />
                          <Route path="content" element={<Content />} />
                          <Route path="pricing" element={<KDPRoyaltiesCalculator />} />
                          <Route path="coloring" element={<AIColoringGenerator />} />
                          <Route path="sudoku" element={<SudokuPage />} />
                          <Route path="bulk" element={<BulkGeneratorPage />} />
                          <Route path="ai-book" element={<AIBookPage />} />
                          <Route path="t-shirts" element={<TShirtGenerator />} />
                          <Route path="settings" element={<Settings />} />
                          <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </div>
        </AuthProvider>
      </Router>
    </>
  );
}

export default App; 