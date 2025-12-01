import { useState, useEffect, useCallback } from 'react';
import { Bell, LogOut, Settings, User, Check, X, Users, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { ToggleTheme } from '../ui/toggle-theme';
import { teamService } from '@/core/services/teamService';
import type { ProjectInvitationResponse } from '@/core/interfaces/team.interface';
import { useToast } from '@/components/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL;

export const AppNav = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { toast } = useToast();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [invitations, setInvitations] = useState<ProjectInvitationResponse[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!user) return;
    setIsLoadingInvitations(true);
    const result = await teamService.getMyInvitations();
    if (result.success && result.data) {
      setInvitations(result.data);
    }
    setIsLoadingInvitations(false);
  }, [user]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleAcceptInvitation = async (token: string, id: number) => {
    setProcessingId(id);
    const result = await teamService.acceptInvitation(token);
    if (result.success) {
      toast({ title: "Invitation accepted! You've joined the project." });
      fetchInvitations();
    } else {
      toast({ title: result.error || "Failed to accept invitation", variant: "destructive" });
    }
    setProcessingId(null);
  };

  const handleDeclineInvitation = async (token: string, id: number) => {
    setProcessingId(id);
    const result = await teamService.declineInvitation(token);
    if (result.success) {
      toast({ title: "Invitation declined" });
      fetchInvitations();
    } else {
      toast({ title: result.error || "Failed to decline invitation", variant: "destructive" });
    }
    setProcessingId(null);
  };

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
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  if (!notificationsOpen) fetchInvitations();
                }}
                className="relative p-2 rounded-lg hover:bg-surface/50 transition-colors"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {invitations.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-96 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Notifications</h3>
                      {invitations.length > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {invitations.length} pending
                        </span>
                      )}
                    </div>
                    
                    {isLoadingInvitations ? (
                      <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      </div>
                    ) : invitations.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        No new notifications
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {invitations.map((inv) => (
                          <div key={inv.id} className="p-4 border-b border-border last:border-b-0 hover:bg-muted/30">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                                <Users className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                  Team Invitation
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  <strong>{inv.inviter_name}</strong> invited you to join{' '}
                                  <strong>{inv.project_name}</strong> as {inv.role}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={() => handleAcceptInvitation(inv.token!, inv.id)}
                                    disabled={processingId === inv.id}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                                  >
                                    {processingId === inv.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )}
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleDeclineInvitation(inv.token!, inv.id)}
                                    disabled={processingId === inv.id}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50"
                                  >
                                    <X className="w-3 h-3" />
                                    Decline
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

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
