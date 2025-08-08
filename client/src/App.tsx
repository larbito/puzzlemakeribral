import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Home } from '@/pages/Home';
import { Pricing as MainPricing } from '@/pages/Pricing';
import { Features } from '@/pages/Features';
import { Templates } from '@/pages/Templates';
import { Blog } from '@/pages/Blog';
import { Privacy } from '@/pages/legal/Privacy';
import { Terms } from '@/pages/legal/Terms';
import { KDPRoyaltiesCalculator } from '@/pages/dashboard/Pricing';
import { AIColoringGenerator } from '@/pages/dashboard/AIColoringGenerator';
import { SudokuPage } from '@/pages/dashboard/SudokuPage';
import { BulkGeneratorPage } from '@/pages/dashboard/BulkGeneratorPage';
import { AIBookPage } from '@/pages/dashboard/AIBookPage';
import { Contact } from '@/pages/Contact';
import { About } from '@/pages/About';
import { Overview } from '@/pages/dashboard/Overview';
import { Puzzles } from '@/pages/dashboard/Puzzles';
import { PuzzleGenerator } from '@/pages/dashboard/PuzzleGenerator';
import { Content } from '@/pages/dashboard/Content';
import { Settings } from '@/pages/dashboard/Settings';
import { TShirtDesigner } from '@/pages/dashboard/TShirtDesigner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import Vectorizer from '@/pages/generators/Vectorizer';
import KDPCoverDesigner from '@/pages/dashboard/KDPCoverDesigner';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeDebug } from '@/pages/dashboard/puzzles/ThemeDebug';
import { AIBookGenerator } from '@/pages/dashboard/AIBookGenerator';
import { KDPBookFormatter } from '@/pages/dashboard/KDPBookFormatter';
import { PromptToImage } from '@/pages/dashboard/PromptToImage';
import { Toaster } from 'sonner';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          {/* Content */}
          <div className="relative">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
              <Route path="/features" element={<><Navbar /><Features /><Footer /></>} />
              <Route path="/templates" element={<><Navbar /><Templates /><Footer /></>} />
              <Route path="/pricing" element={<><Navbar /><MainPricing /><Footer /></>} />
              <Route path="/blog" element={<><Navbar /><Blog /><Footer /></>} />
              <Route path="/about" element={<><Navbar /><About /><Footer /></>} />
              <Route path="/contact" element={<><Navbar /><Contact /><Footer /></>} />
              <Route path="/privacy" element={<><Navbar /><Privacy /><Footer /></>} />
              <Route path="/terms" element={<><Navbar /><Terms /><Footer /></>} />
              <Route path="/login" element={<><Navbar /><Login /><Footer /></>} />
              <Route path="/register" element={<><Navbar /><Register /><Footer /></>} />

              {/* Dashboard routes */}
              <Route
                path="/dashboard"
                element={
                  <DashboardLayout>
                    <Overview />
                  </DashboardLayout>
                }
              />
              <Route
                path="/dashboard/*"
                element={
                  <DashboardLayout>
                    <Routes>
                      <Route path="puzzles" element={<Puzzles />} />
                      <Route path="puzzle-generator" element={<PuzzleGenerator />} />
                      <Route path="content" element={<Content />} />
                      <Route path="pricing" element={<KDPRoyaltiesCalculator />} />
                      <Route path="coloring" element={<AIColoringGenerator />} />
                      <Route path="prompt-to-image" element={<PromptToImage />} />
                      <Route path="sudoku" element={<SudokuPage />} />
                      <Route path="bulk" element={<BulkGeneratorPage />} />
                      <Route path="ai-book" element={<AIBookPage />} />
                      <Route path="ai-book-generator" element={<AIBookGenerator />} />
                      <Route path="kdp-formatter" element={<KDPBookFormatter />} />
                      <Route path="t-shirts" element={<TShirtDesigner />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="vectorizer" element={<Vectorizer />} />
                      <Route path="kdp-covers" element={<KDPCoverDesigner />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                }
              />

              {/* Add the debug route */}
              <Route path="/debug/modal" element={<ThemeDebug />} />
            </Routes>
          </div>
          <Toaster position="top-right" />
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App; 