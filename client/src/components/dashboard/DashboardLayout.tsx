import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Book,
  Calendar,
  Calculator,
  Settings,
  Menu,
  X,
  LogOut,
  Wand2,
  ChevronRight,
  User,
  Bell,
  Shirt,
  Palette,
  BookOpen,
  Layers,
  FolderKanban,
  PencilRuler,
  FileText,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';

const navigation = [
  // Dashboard overview
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  
  // Creation tools
  { name: 'All Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'T-shirt Designs', href: '/dashboard/t-shirts', icon: Shirt },
  { name: 'Coloring Pages', href: '/dashboard/coloring', icon: Palette },
  { name: 'Book Covers', href: '/dashboard/covers', icon: BookOpen },
  { name: 'Puzzle Books', href: '/dashboard/puzzles', icon: PencilRuler },
  
  // Planning & Analytics
  { name: 'Content Planner', href: '/dashboard/content', icon: Calendar },
  { name: 'KDP Calculator', href: '/dashboard/pricing', icon: Calculator },
  { name: 'Merch Calculator', href: '/dashboard/merch-calculator', icon: Calculator },
  
  // User settings
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications] = useState(3); // Example notification count

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
          <div className="flex h-16 items-center gap-2 px-6 border-b border-primary/10">
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
          </div>

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
                    {isActive && (
                      <ChevronRight className="h-4 w-4 ml-auto text-primary" />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* User Area */}
          <div className="border-t border-primary/10 p-4">
            <div className="flex items-center gap-3 px-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pro Account
                </p>
              </div>
            </div>
          </div>
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

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium flex items-center justify-center text-primary-foreground">
                    {notifications}
                  </span>
                )}
              </Button>

              {/* User Menu */}
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>

              {/* Logout */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => supabase.auth.signOut()}
                className="text-muted-foreground hover:text-primary"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
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