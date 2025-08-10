import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Puzzle, DollarSign, Users, Phone, LayoutDashboard, LogIn, UserPlus, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('pcf-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const root = document.documentElement;
    if (next) {
      root.classList.add('dark');
      localStorage.setItem('pcf-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('pcf-theme', 'light');
    }
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      description: 'Go to dashboard'
    },
    {
      name: 'Pricing',
      path: '/pricing',
      icon: <DollarSign className="w-4 h-4" />,
      description: 'Plans & pricing'
    },
    {
      name: 'About Us',
      path: '/about',
      icon: <Users className="w-4 h-4" />,
      description: 'Our story'
    },
    {
      name: 'Contact',
      path: '/contact',
      icon: <Phone className="w-4 h-4" />,
      description: 'Get in touch'
    }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-primary/10">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Puzzle className="w-7 h-7 text-primary relative" />
            </div>
            <span className="text-lg font-semibold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%] animate-gradient">
              PuzzleCraft
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="group flex items-center space-x-2 text-foreground/80 hover:text-foreground relative px-3 py-2"
              >
                <div className="absolute inset-0 bg-primary/5 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300" />
                <div className="relative flex items-center space-x-2">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-primary to-secondary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </Link>
            ))}
            <div className="h-6 w-px bg-border/60" />
            <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggleTheme}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link to="/login">
              <Button variant="ghost" className="px-3">
                <LogIn className="w-4 h-4 mr-2" />
                Log in
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                <UserPlus className="w-4 h-4 mr-2" />
                Register
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="relative group"
            >
              <div className="absolute inset-0 bg-primary/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
              {isOpen ? (
                <X className="h-5 w-5 relative" />
              ) : (
                <Menu className="h-5 w-5 relative" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-background/80 backdrop-blur-xl border-b border-primary/10">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="group flex items-center justify-between px-3 py-2 text-foreground/80 hover:text-foreground relative"
                onClick={() => setIsOpen(false)}
              >
                <div className="relative flex items-center space-x-2">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                <div className="absolute inset-0 bg-primary/5 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300" />
              </Link>
            ))}
            <div className="flex items-center gap-2 pt-2">
              <Link to="/login" className="flex-1" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/10">
                  Log in
                </Button>
              </Link>
              <Link to="/register" className="flex-1" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};