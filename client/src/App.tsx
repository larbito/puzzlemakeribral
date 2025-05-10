import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Home } from '@/pages/Home';
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
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          {/* Background gradients */}
          <div className="fixed inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-50" />
          <div className="fixed inset-0 bg-gradient-radial from-secondary/5 via-transparent to-transparent translate-x-full opacity-50" />
          <div className="fixed inset-0 bg-gradient-radial from-accent/5 via-transparent to-transparent -translate-x-full opacity-50" />
          
          {/* Content */}
          <div className="relative z-10">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
              <Route path="/pricing" element={<><Navbar /><MainPricing /><Footer /></>} />
              <Route path="/contact" element={<><Navbar /><Contact /><Footer /></>} />
              <Route path="/about" element={<><Navbar /><About /><Footer /></>} />

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
                }
              />
            </Routes>
          </div>
        </div>
      </Router>
    </>
  );
}

export default App; 