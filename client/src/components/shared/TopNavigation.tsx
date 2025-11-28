import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ToggleTheme } from '../ui/toggle-theme';
import { Menu, X, LayoutDashboard, LogOut, Settings, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const API_URL = import.meta.env.VITE_API_URL;

const TopNavigation = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const navLinks = [
    { name: 'Product', href: '#features' },
    { name: 'How it works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent',
        isScrolled ? 'bg-background/80 backdrop-blur-md border-border/40 shadow-sm' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative w-24 h-24 flex items-center justify-center">
              <img 
                src="/rev-logo.png" 
                alt="Reviewly Logo" 
                className="relative z-10 w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 rounded-lg bg-indigo-500/50 blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
            </div>
            <span className="font-bold text-lg tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">Reviewly</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            <ToggleTheme />
            
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => navigate('/home')}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>

                {/* User Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface/50 transition-colors"
                  >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                  {user?.avatar_url ? (
                    <img 
                      src={user.avatar_url.startsWith('http') ? user.avatar_url : `${API_URL}${user.avatar_url}`} 
                      alt="User Avatar" 
                      className="w-8 h-8 rounded-full object-cover" 
                    />
                  ) : (
                    getInitials()
                  )}
                </div>
                    <span className="text-sm font-medium text-foreground hidden sm:block">
                      {user?.full_name || user?.username || user?.email?.split('@')[0]}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden bg-background">
                        <div className="p-4 border-b border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-lg">
                              {getInitials()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {user?.full_name || user?.username}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user?.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="py-2">
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              navigate('/profile');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                          >
                            <User className="w-4 h-4 text-muted-foreground" />
                            Profile
                          </button>
                          
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              navigate('/settings');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                          >
                            <Settings className="w-4 h-4 text-muted-foreground" />
                            Settings
                          </button>
                        </div>

                        <div className="border-t border-border">
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Log out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button onClick={() => navigate('/login')} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Log in
                </Button>
                <Button onClick={() => navigate('/register')} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                  Get started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-muted-foreground hover:text-foreground p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border/40 px-4 py-4 space-y-4 shadow-xl">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="block text-base font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <div className="pt-4 flex flex-col gap-3 border-t border-border/40">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 px-2 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                    {getInitials()}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {user?.full_name || user?.username}
                  </span>
                </div>
                <Button onClick={() => navigate('/home')} variant="ghost" className="w-full justify-start gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
                <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                  <LogOut className="w-4 h-4" />
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => navigate('/login')} variant="ghost" className="w-full justify-start">
                  Log in
                </Button>
                <Button onClick={() => navigate('/register')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                  Get started
                </Button>
              </>
            )}
            <div className="flex justify-start px-2">
              <ToggleTheme />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default TopNavigation;
