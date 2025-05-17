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
import KDPFuturisticGenerator from '@/pages/generators/KDPFuturisticGenerator';
import BookCoverGenerator from '@/pages/dashboard/BookCoverGenerator';
import { TShirtDesigner } from '@/pages/dashboard/TShirtDesigner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import Vectorizer from '@/pages/generators/Vectorizer';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster richColors position="top-center" />
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/pricing" element={<MainPricing />} />
              <Route path="/features" element={<Features />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
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
                      <Route path="sudoku" element={<SudokuPage />} />
                      <Route path="bulk" element={<BulkGeneratorPage />} />
                      <Route path="ai-book" element={<AIBookPage />} />
                      <Route path="t-shirts" element={<TShirtDesigner />} />
                      <Route path="kdp-covers" element={<KDPFuturisticGenerator />} />
                      <Route path="book-covers" element={<BookCoverGenerator />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="vectorizer" element={<Vectorizer />} />
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