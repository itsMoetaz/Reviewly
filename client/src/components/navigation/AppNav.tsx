import { useState } from 'react';
import { Bell, LogOut, Settings, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { ToggleTheme } from '../ui/toggle-theme';

export const AppNav = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <img
              src="/rev-logo.png"
              alt="Reviewly Logo"
              className="w-20 h-20 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-bold text-foreground">Reviewly</span>
          </div>

          <div className="flex items-center gap-4">
            
            <ToggleTheme />

            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg hover:bg-surface/50 transition-colors"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold text-foreground">Notifications</h3>
                    </div>
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No new notifications
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                  {getInitials()}
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
                  <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                    
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
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-surface/80 transition-colors"
                      >
                        <User className="w-4 h-4 text-muted-foreground" />
                        Profile
                      </button>
                      
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/settings');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-surface/80 transition-colors"
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
          </div>
        </div>
      </div>
    </nav>
  );
};
