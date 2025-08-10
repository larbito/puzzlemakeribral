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
  Clock,
  Wand2,
  Bell,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Coins, Crown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Define which routes are coming soon
const comingSoonRoutes = [
  '/dashboard/ai-book-generator',
  '/dashboard/puzzle-generator',
  '/dashboard/content',
  '/dashboard/pricing',
  '/dashboard/merch-calculator',
];

console.log('Coming soon routes:', comingSoonRoutes);
console.log('KDP Formatter in coming soon?', comingSoonRoutes.includes('/dashboard/kdp-formatter'));

const navigation = [
  // Dashboard overview
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  
  // Creation tools
  { name: 'T-shirt Designs', href: '/dashboard/t-shirts', icon: Shirt },
  { name: 'Coloring Pages', href: '/dashboard/coloring', icon: Palette },
  { name: 'Prompt-to-Image', href: '/dashboard/prompt-to-image', icon: Wand2 },
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full bg-secondary/10 blur-3xl" />
      </div>
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isSidebarOpen ? 0 : -300 }}
        className="fixed top-0 left-0 z-40 h-screen w-72 bg-gradient-to-b from-fuchsia-900/30 via-fuchsia-800/20 to-transparent backdrop-blur-xl border-r border-fuchsia-500/20"
      >
        <div className="flex h-full flex-col relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
          {/* Logo Area */}
          <Link to="/" className="relative flex h-16 items-center gap-2 px-6 border-b border-primary/10 hover:bg-primary/5 transition-colors">
            <motion.div
              className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="h-5 w-5 text-primary" />
            </motion.div>
            <span className="font-semibold bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              PuzzleCraft Forge
            </span>
          </Link>

          {/* Navigation */}
          <nav className="relative flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const isComingSoon = comingSoonRoutes.includes(item.href);
              
              // Debug logging for KDP formatter
              if (item.name === 'KDP Book Formatter') {
                console.log('KDP Formatter debug:', {
                  name: item.name,
                  href: item.href,
                  isComingSoon,
                  comingSoonRoutes
                });
              }
              
              // For coming soon items, render a div instead of a Link to completely prevent navigation
              return isComingSoon ? (
                <div 
                  key={item.name}
                  className="cursor-not-allowed"
                >
                  <motion.div
                    className={cn(
                      "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
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
                      "group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                      isActive
                        ? "text-fuchsia-400"
                        : "text-muted-foreground hover:text-fuchsia-400 hover:bg-fuchsia-500/5"
                    )}
                    whileHover={{ x: 5 }}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-gradient-to-b from-fuchsia-400 to-pink-400" />
                    )}
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                    
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-fuchsia-500/10 -z-10"
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
        isSidebarOpen ? "ml-72" : "ml-0",
      )}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/60 backdrop-blur-xl border-b border-primary/10">
          <div className="flex h-full items-center justify-between px-8 gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-muted-foreground hover:text-primary"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-xl items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tools, projects, or actions..."
                  className="pl-9 bg-background/60 border-primary/20 focus:border-primary/40"
                />
              </div>
            </div>
            {/* Global account summary on the right */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Coins className="h-4 w-4" />
                <span className="text-xs">Credits</span>
                <span className="text-sm font-semibold">120</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary">
                <Crown className="h-4 w-4" />
                <span className="text-xs">Pro</span>
              </div>
              <Avatar className="h-9 w-9 border border-white/10">
                <AvatarImage src="https://api.dicebear.com/7.x/adventurer/svg?seed=Nova&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50" alt="User avatar" />
                <AvatarFallback>CR</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)] px-6 md:px-8">
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