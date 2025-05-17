import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Calculator,
  Settings,
  Menu,
  Palette,
  BookOpen,
  FolderKanban,
  PencilRuler,
  Sparkles,
  BookOpenCheck,
  Shirt,
  Puzzle,
  Scissors
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  // Dashboard overview
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  
  // Creation tools
  { name: 'All Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'T-shirt Designs', href: '/dashboard/t-shirts', icon: Shirt },
  { name: 'Coloring Pages', href: '/dashboard/coloring', icon: Palette },
  { name: 'KDP Book Covers', href: '/dashboard/kdp-covers', icon: BookOpenCheck },
  { name: 'KDP Cover Wizard', href: '/dashboard/kdp-wizard', icon: BookOpen, badge: 'NEW' },
  { name: 'Puzzle Generator', href: '/dashboard/puzzle-generator', icon: Puzzle },
  { name: 'Puzzle Books', href: '/dashboard/puzzles', icon: PencilRuler },
  { name: 'Vectorizer', href: '/dashboard/vectorizer', icon: Scissors },
  
  // Planning & Analytics
  { name: 'Content Planner', href: '/dashboard/content', icon: Calendar },
  { name: 'KDP Calculator', href: '/dashboard/pricing', icon: Calculator },
  { name: 'Merch Calculator', href: '/dashboard/merch-calculator', icon: Calculator },
  
  // User settings
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
              return (
                <Link key={item.name} to={item.href}>
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