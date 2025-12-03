import { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, Crown, Zap, Sparkles, Star, Calendar, BarChart3, Settings, Infinity } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { userService } from '@/core/services/userService';
import { paymentApi, type UsageStats, type SubscriptionStatus } from '@/core/api/paymentApi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ProfileHeaderProps {
  onAvatarUpdate?: () => void;
}

// Subscription Progress Component
const SubscriptionProgress = ({ 
  usageStats, 
  subscriptionStatus,
  tier,
  onManageSubscription
}: { 
  usageStats: UsageStats | null;
  subscriptionStatus: SubscriptionStatus | null;
  tier: string;
  onManageSubscription: () => void;
}) => {
  const getProgressColor = () => {
    if (tier === "PRO") return "from-amber-500 to-yellow-400";
    if (tier === "PLUS") return "from-purple-500 to-indigo-500";
    return "from-gray-500 to-gray-400";
  };

  const getProgressBgColor = () => {
    if (tier === "PRO") return "bg-amber-500/20";
    if (tier === "PLUS") return "bg-purple-500/20";
    return "bg-gray-500/20";
  };

  // Calculate days until reset
  const getDaysUntilReset = () => {
    if (!usageStats?.resets_at) return null;
    const resetDate = new Date(usageStats.resets_at);
    const now = new Date();
    const diffTime = resetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Calculate days until subscription ends (for paid tiers)
  const getDaysUntilSubscriptionEnd = () => {
    if (!subscriptionStatus?.current_period_end) return null;
    const endDate = new Date(subscriptionStatus.current_period_end * 1000);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysUntilReset = getDaysUntilReset();
  const daysUntilEnd = getDaysUntilSubscriptionEnd();
  const reviewsUsed = usageStats?.ai_reviews?.used || 0;
  const reviewsLimit = usageStats?.ai_reviews?.limit || 10;
  const isUnlimited = usageStats?.ai_reviews?.unlimited || false;
  const percentage = usageStats?.ai_reviews?.percentage || 0;

  return (
    <div className="mt-6 pt-6 border-t border-border/50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reviews Usage */}
        <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${getProgressBgColor()}`}>
                <BarChart3 className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">AI Reviews</span>
            </div>
            {isUnlimited ? (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                <Infinity className="w-4 h-4" />
                Unlimited
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {reviewsUsed} / {reviewsLimit}
              </span>
            )}
          </div>
          
          {!isUnlimited && (
            <>
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {reviewsLimit - reviewsUsed} reviews remaining this month
              </p>
            </>
          )}
          
          {isUnlimited && (
            <p className="text-xs text-muted-foreground">
              You have unlimited AI reviews with PRO
            </p>
          )}
        </div>

        {/* Days Until Reset */}
        <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${getProgressBgColor()}`}>
                <Calendar className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">
                {tier === "FREE" ? "Monthly Reset" : "Billing Cycle"}
              </span>
            </div>
          </div>
          
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">
              {tier === "FREE" ? daysUntilReset : (daysUntilEnd ?? daysUntilReset)}
            </span>
            <span className="text-sm text-muted-foreground">days left</span>
          </div>
          
          {subscriptionStatus?.cancel_at_period_end && (
            <p className="text-xs text-amber-500 mt-2">
              ⚠️ Subscription will cancel at period end
            </p>
          )}
          
          {tier === "FREE" && (
            <p className="text-xs text-muted-foreground mt-2">
              Usage resets on the 1st of each month
            </p>
          )}
        </div>

        {/* Manage Subscription */}
        <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${getProgressBgColor()}`}>
                <Settings className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">Manage Plan</span>
            </div>
          </div>
          
          {tier === "FREE" ? (
            <button
              onClick={() => window.location.href = '/#pricing'}
              className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium transition-all"
            >
              Upgrade Plan
            </button>
          ) : (
            <button
              onClick={onManageSubscription}
              className={`w-full py-2 px-4 rounded-lg bg-gradient-to-r ${getProgressColor()} text-white text-sm font-medium transition-all hover:opacity-90`}
            >
              Manage Subscription
            </button>
          )}
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {tier === "FREE" ? "Get more reviews & features" : "Update billing or cancel"}
          </p>
        </div>
      </div>
    </div>
  );
};

// Animated Plan Badge for Profile
const ProfilePlanBadge = ({ tier }: { tier: string }) => {
  const normalizedTier = tier?.toUpperCase() || "FREE";
  
  if (normalizedTier === "PRO") {
    return (
      <div className="relative group inline-flex">
        {/* Outer animated glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full blur-md opacity-75 group-hover:opacity-100 animate-pulse" />
        
        {/* Badge container */}
        <div className="relative flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 font-bold text-xs shadow-xl shadow-amber-500/40">
          <Crown className="w-4 h-4 animate-bounce" style={{ animationDuration: '2s' }} />
          <span className="tracking-wider">PRO PLAN</span>
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer" />
          </div>
        </div>
        
        {/* Floating particles */}
        <Star className="absolute -top-2 -right-2 w-3 h-3 text-yellow-300 animate-ping" style={{ animationDuration: '2s' }} />
        <Star className="absolute -bottom-1 -left-2 w-2.5 h-2.5 text-yellow-300 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.7s' }} />
        <Sparkles className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 text-amber-300 animate-pulse" />
      </div>
    );
  }
  
  if (normalizedTier === "PLUS") {
    return (
      <div className="relative group inline-flex">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 rounded-full blur opacity-60 group-hover:opacity-100 transition-opacity animate-pulse" style={{ animationDuration: '3s' }} />
        
        {/* Badge */}
        <div className="relative flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-500/30">
          <Zap className="w-4 h-4 animate-pulse" />
          <span className="tracking-wider">PLUS PLAN</span>
          
          {/* Animated border */}
          <div className="absolute inset-0 rounded-full border-2 border-purple-300/40 animate-pulse" style={{ animationDuration: '2s' }} />
        </div>
        
        {/* Decorative element */}
        <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-purple-300 animate-pulse" />
      </div>
    );
  }
  
  // FREE tier - clean and simple
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-500/20 text-gray-400 font-medium text-xs border border-gray-500/30">
      <Sparkles className="w-3.5 h-3.5" />
      <span>FREE PLAN</span>
    </div>
  );
};

// Avatar with tier-based decoration
const ProfileAvatarFrame = ({ 
  tier, 
  avatarUrl, 
  initials, 
  onUploadClick, 
  isUploading 
}: { 
  tier: string;
  avatarUrl?: string;
  initials: string;
  onUploadClick: () => void;
  isUploading: boolean;
}) => {
  const normalizedTier = tier?.toUpperCase() || "FREE";
  
  const getFrameStyles = () => {
    if (normalizedTier === "PRO") {
      return {
        rotatingFrame: "absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 animate-spin-slow",
        staticContainer: "relative w-28 h-28 rounded-full p-1.5",
        inner: "bg-gradient-to-br from-amber-100 to-yellow-100",
        decoration: (
          <>
            {/* Rotating outer ring */}
            <div className="absolute -inset-2 rounded-full border-2 border-dashed border-amber-400/50 animate-spin" style={{ animationDuration: '10s' }} />
            {/* Crown on top */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
              <div className="relative">
                <Crown className="w-7 h-7 text-amber-400 fill-amber-400 drop-shadow-lg" />
                <div className="absolute inset-0 animate-ping">
                  <Crown className="w-7 h-7 text-amber-300 opacity-30" />
                </div>
              </div>
            </div>
            {/* Floating stars */}
            <Star className="absolute -top-1 -right-3 w-4 h-4 text-yellow-400 fill-yellow-400 animate-pulse" />
            <Star className="absolute -bottom-2 -left-3 w-3 h-3 text-yellow-400 fill-yellow-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <Star className="absolute top-1/2 -right-4 w-2.5 h-2.5 text-amber-400 fill-amber-400 animate-ping" style={{ animationDuration: '2s' }} />
          </>
        )
      };
    }
    
    if (normalizedTier === "PLUS") {
      return {
        rotatingFrame: null,
        staticContainer: "relative w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600 p-1",
        inner: "bg-gradient-to-br from-purple-100 to-indigo-100",
        decoration: (
          <>
            {/* Glowing ring */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 opacity-50 blur-md animate-pulse" />
            {/* Lightning bolt */}
            <div className="absolute -top-2 -right-1 z-30">
              <Zap className="w-5 h-5 text-purple-400 fill-purple-400 drop-shadow-lg animate-pulse" />
            </div>
            {/* Sparkles */}
            <Sparkles className="absolute -bottom-1 -left-2 w-4 h-4 text-indigo-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
          </>
        )
      };
    }
    
    return {
      rotatingFrame: null,
      staticContainer: "relative w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-1",
      inner: "",
      decoration: null
    };
  };
  
  const styles = getFrameStyles();
  
  return (
    <div className="relative group">
      {styles.decoration}
      
      {/* Rotating gradient frame (only for PRO) */}
      {styles.rotatingFrame && (
        <div className={styles.rotatingFrame} style={{ animationDuration: '8s' }} />
      )}
      
      {/* Main avatar container - static */}
      <div className={styles.staticContainer}>
        <div className={`w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden ${styles.inner}`}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className={`text-3xl font-bold ${normalizedTier === "PRO" ? "text-amber-700" : normalizedTier === "PLUS" ? "text-purple-700" : "text-foreground"}`}>
              {initials}
            </span>
          )}
        </div>
      </div>

      {/* Upload overlay */}
      <button
        onClick={onUploadClick}
        disabled={isUploading}
        className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-20"
      >
        {isUploading ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : (
          <Camera className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
};

const ProfileHeader = ({ onAvatarUpdate }: ProfileHeaderProps) => {
  const { user, fetchUser } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tier = user?.subscription_tier?.toUpperCase() || "FREE";

  // Fetch usage stats and subscription status
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        // Always fetch usage stats
        const usage = await paymentApi.getUsageStats();
        setUsageStats(usage);
        
        // Only fetch Stripe subscription status for paid tiers
        if (tier !== "FREE") {
          try {
            const subscription = await paymentApi.getSubscriptionStatus();
            setSubscriptionStatus(subscription);
          } catch {
            // User might not have a Stripe subscription yet, that's okay
            setSubscriptionStatus(null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch subscription stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [tier]);

  const handleManageSubscription = async () => {
    try {
      const portalUrl = await paymentApi.createPortalSession();
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Failed to open subscription portal:', error);
    }
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
    return user?.username?.[0]?.toUpperCase() || 'U';
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await userService.uploadAvatar(file);

      if (result.success) {
        await fetchUser();
        onAvatarUpdate?.();
      } else {
        alert(result.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  // Dynamic header background based on tier
  const getHeaderBackground = () => {
    if (tier === "PRO") {
      return "bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-amber-500/20";
    }
    if (tier === "PLUS") {
      return "bg-gradient-to-br from-purple-500/20 via-indigo-500/10 to-purple-500/20";
    }
    return "bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20";
  };

  const avatarUrl = user?.avatar_url 
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${API_URL}${user.avatar_url}`)
    : undefined;

  return (
    <div className={`relative overflow-hidden rounded-2xl ${getHeaderBackground()} border border-border`}>
      {/* Animated background effects for PRO */}
      {tier === "PRO" && (
        <>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-400/30 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-yellow-400/30 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-amber-400/10 to-transparent rounded-full" />
        </>
      )}
      
      {/* Animated background effects for PLUS */}
      {tier === "PLUS" && (
        <>
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-purple-500/30 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-gradient-to-tr from-indigo-500/30 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        </>
      )}
      
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      <div className="relative p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar with tier-based frame */}
          <ProfileAvatarFrame
            tier={tier}
            avatarUrl={avatarUrl}
            initials={getInitials()}
            onUploadClick={handleAvatarClick}
            isUploading={isUploading}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* User Info */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold text-foreground">{user?.full_name || user?.username}</h1>
            <p className="text-muted-foreground">@{user?.username}</p>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>

            <div className="flex flex-wrap items-center gap-3 mt-4 justify-center sm:justify-start">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {user?.role}
              </span>

              <ProfilePlanBadge tier={tier} />

              <span className="text-xs text-muted-foreground">
                Member since {user?.created_at ? formatDate(user.created_at) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Progress Section */}
        {!isLoadingStats && (
          <SubscriptionProgress
            usageStats={usageStats}
            subscriptionStatus={subscriptionStatus}
            tier={tier}
            onManageSubscription={handleManageSubscription}
          />
        )}
        
        {isLoadingStats && (
          <div className="mt-6 pt-6 border-t border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-border/50 animate-pulse">
                  <div className="h-4 bg-muted/50 rounded w-1/2 mb-3" />
                  <div className="h-6 bg-muted/50 rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
