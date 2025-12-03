import type { User } from "../../core/interfaces/auth.interface";
import { Skeleton } from "../../components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Plus, Sparkles, Crown, Zap } from "lucide-react";
import { CreateProjectDialog } from "../projects/components";

interface WelcomeBannerProps {
  user: User | null | undefined;
  isLoading: boolean;
}

// Animated Plan Badge Component
const PlanBadge = ({ tier }: { tier: string }) => {
  const normalizedTier = tier?.toUpperCase() || "FREE";
  
  if (normalizedTier === "PRO") {
    return (
      <div className="relative group">
        {/* Outer glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full blur-md opacity-75 group-hover:opacity-100 animate-pulse" />
        
        {/* Badge */}
        <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 font-bold text-xs shadow-lg shadow-amber-500/50">
          <Crown className="w-3.5 h-3.5 animate-bounce" style={{ animationDuration: '2s' }} />
          <span className="tracking-wide">PRO</span>
        </div>
      </div>
    );
  }
  
  if (normalizedTier === "PLUS") {
    return (
      <div className="relative group">
        {/* Subtle glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full blur opacity-60 group-hover:opacity-100 transition-opacity" />
        
        {/* Badge */}
        <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-purple-500/30">
          <Zap className="w-3.5 h-3.5" />
          <span className="tracking-wide">PLUS</span>
          
          {/* Animated border */}
          <div className="absolute inset-0 rounded-full border border-purple-300/50 animate-pulse" />
        </div>
      </div>
    );
  }
  
  // FREE tier - simple and clean
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground font-medium text-xs border border-border">
      <Sparkles className="w-3 h-3" />
      <span>FREE</span>
    </div>
  );
};

// Avatar Frame Component based on plan
const AvatarFrame = ({ 
  tier, 
  children, 
  avatarUrl, 
  userName 
}: { 
  tier: string; 
  children: React.ReactNode;
  avatarUrl?: string;
  userName?: string;
}) => {
  const normalizedTier = tier?.toUpperCase() || "FREE";
  
  if (normalizedTier === "PRO") {
    return (
      <div className="relative">
        {/* Rotating gradient ring */}
        <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-spin-slow opacity-90" style={{ animationDuration: '4s' }} />
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 animate-pulse" />
        
        {/* Crown decoration */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <Crown className="w-5 h-5 text-amber-400 drop-shadow-lg fill-amber-400" />
        </div>
        
        {/* Avatar container */}
        <div className="relative h-16 w-16 rounded-full bg-background p-0.5">
          <Avatar className="h-full w-full">
            <AvatarImage src={avatarUrl} alt={userName || ""} />
            <AvatarFallback className="bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-700 text-xl font-bold">
              {children}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Status indicator with glow */}
        <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5 z-10">
          <div className="bg-green-500 h-3.5 w-3.5 rounded-full border-2 border-background shadow-lg shadow-green-500/50" />
        </div>
      </div>
    );
  }
  
  if (normalizedTier === "PLUS") {
    return (
      <div className="relative">
        {/* Gradient ring */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 animate-pulse" style={{ animationDuration: '3s' }} />
        
        {/* Sparkle decoration */}
        <div className="absolute -top-1 -right-1 z-20">
          <Zap className="w-4 h-4 text-purple-400 fill-purple-400 animate-pulse" />
        </div>
        
        {/* Avatar container */}
        <div className="relative h-16 w-16 rounded-full bg-background p-0.5">
          <Avatar className="h-full w-full">
            <AvatarImage src={avatarUrl} alt={userName || ""} />
            <AvatarFallback className="bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 text-xl font-bold">
              {children}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Status indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5 z-10">
          <div className="bg-green-500 h-3 w-3 rounded-full border-2 border-background" />
        </div>
      </div>
    );
  }
  
  // FREE tier - simple
  return (
    <div className="relative">
      <Avatar className="h-16 w-16 border-2 border-border ring-2 ring-background">
        <AvatarImage src={avatarUrl} alt={userName || ""} />
        <AvatarFallback className="bg-muted text-muted-foreground text-xl font-bold">
          {children}
        </AvatarFallback>
      </Avatar>
      <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
        <div className="bg-green-500 h-3 w-3 rounded-full border-2 border-background" />
      </div>
    </div>
  );
};

export const WelcomeBanner = ({ user, isLoading }: WelcomeBannerProps) => {
  const tier = user?.subscription_tier?.toUpperCase() || "FREE";
  
  // Dynamic background based on plan
  const getBannerBackground = () => {
    if (tier === "PRO") {
      return "bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border-amber-500/20";
    }
    if (tier === "PLUS") {
      return "bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-purple-500/10 border-purple-500/20";
    }
    return "bg-gradient-to-r from-card to-background border-border/50";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-between p-6 mb-8 rounded-2xl bg-card border border-border/50 shadow-sm">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  const avatarUrl = user?.avatar_url 
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL}${user.avatar_url}`)
    : `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.username || "user"}&backgroundColor=e5e7eb,f3f4f6,e0e7ff`;

  return (
    <div className={`relative overflow-hidden p-6 mb-8 rounded-2xl border shadow-sm group ${getBannerBackground()}`}>
      {/* Animated background elements for PRO */}
      {tier === "PRO" && (
        <>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-yellow-400/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </>
      )}
      
      {/* Animated background elements for PLUS */}
      {tier === "PLUS" && (
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
      )}
      
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <AvatarFrame 
            tier={tier} 
            avatarUrl={avatarUrl}
            userName={user?.full_name}
          >
            {user?.full_name?.charAt(0) || user?.username?.charAt(0)}
          </AvatarFrame>
          
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Welcome back, {user?.full_name?.split(" ")[0] || user?.username}!
              <span className="animate-wave inline-block origin-[70%_70%]">👋</span>
            </h1>
            <div className="flex items-center gap-3 mt-2 text-muted-foreground">
              <span>@{user?.username}</span>
              <span className="text-border">•</span>
              <PlanBadge tier={tier} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CreateProjectDialog
            trigger={
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Project
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
};

// Add this to your global CSS or tailwind config
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
// .animate-shimmer { animation: shimmer 2s infinite; }
// .animate-spin-slow { animation: spin 4s linear infinite; }
