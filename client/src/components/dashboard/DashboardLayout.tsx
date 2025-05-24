import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Calculator,
  Settings,
  Menu,
  Palette,
  Sparkles,
  Shirt,
  Puzzle,
  BookCopy,
  FileText,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Define which routes are coming soon
const comingSoonRoutes = [
  '/dashboard/ai-book-generator',
  '/dashboard/kdp-formatter',
  '/dashboard/puzzle-generator',
  '/dashboard/content',
  '/dashboard/pricing',
  '/dashboard/merch-calculator',
];

const navigation = [
  // Dashboard overview
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  
  // Creation tools
  { name: 'T-shirt Designs', href: '/dashboard/t-shirts', icon: Shirt },
  { name: 'Coloring Pages', href: '/dashboard/coloring', icon: Palette },
  { name: 'KDP Cover Designer', href: '/dashboard/kdp-covers', icon: BookCopy },
  { name: 'AI Book Generator', href: '/dashboard/ai-book-generator', icon: BookCopy },
  { name: 'KDP Book Formatter', href: '/dashboard/kdp-formatter', icon: FileText },
  { name: 'Puzzle Generator', href: '/dashboard/puzzle-generator', icon: Puzzle },
  
  // Planning & Analytics
  { name: 'Content Planner', href: '/dashboard/content', icon: Calendar },
  { name: 'KDP Calculator', href: '/dashboard/pricing', icon: Calculator },
  { name: 'Merch Calculator', href: '/dashboard/merch-calculator', icon: Calculator },
  
  // User settings
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Check if current route is a "coming soon" route and redirect to dashboard if directly accessed
  useEffect(() => {
    const currentPathname = location.pathname;
    if (comingSoonRoutes.includes(currentPathname)) {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isSidebarOpen ? 0 : -300 }}
        className="fixed top-0 left-0 z-40 h-screen w-64 bg-white/5 backdrop-blur-xl border-r border-primary/10"
      >
        <div className="flex h-full flex-col">
          {/* Logo Area */}
          <Link to="/" className="flex h-16 items-center gap-2 px-6 border-b border-primary/10 hover:bg-primary/5 transition-colors">
            <motion.div
              className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="h-5 w-5 text-primary" />
            </motion.div>
            <span className="font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              PuzzleCraft Forge
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const isComingSoon = comingSoonRoutes.includes(item.href);
              
              // For coming soon items, render a div instead of a Link to completely prevent navigation
              return isComingSoon ? (
                <div 
                  key={item.name}
                  className="cursor-not-allowed"
                >
                  <motion.div
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-3 rounded-xl transition-colors",
                      "text-muted-foreground/60"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                    
                    <Badge 
                      variant="outline" 
                      className="ml-auto text-xs bg-gray-500/10 text-gray-500 border-gray-500/20 flex items-center gap-1"
                    >
                      <Clock className="h-3 w-3" />
                      <span>Soon</span>
                    </Badge>
                  </motion.div>
                </div>
              ) : (
                <Link 
                  key={item.name} 
                  to={item.href}
                >
                  <motion.div
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-3 rounded-xl transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                    )}
                    whileHover={{ x: 5 }}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                    
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-primary/10 -z-10"
                        layoutId="activeNav"
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </nav>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        isSidebarOpen ? "ml-64" : "ml-0"
      )}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/50 backdrop-blur-xl border-b border-primary/10">
          <div className="flex h-full items-center justify-between px-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-muted-foreground hover:text-primary"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}; 