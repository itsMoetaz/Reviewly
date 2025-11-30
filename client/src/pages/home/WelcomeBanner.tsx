import type { User } from "../../core/interfaces/auth.interface";
import { Skeleton } from "../../components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { CreateProjectDialog } from "../projects/components";

interface WelcomeBannerProps {
  user: User | null | undefined;
  isLoading: boolean;
}

export const WelcomeBanner = ({ user, isLoading }: WelcomeBannerProps) => {

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

  return (
    <div className="relative overflow-hidden p-6 mb-8 rounded-2xl bg-gradient-to-r from-card to-background border border-border/50 shadow-sm group">
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-primary/20 ring-2 ring-background">
              <AvatarImage 
                src={
                  user?.avatar_url 
                    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL}${user.avatar_url}`)
                    : `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.username || "user"}&backgroundColor=e5e7eb,f3f4f6,e0e7ff`
                } 
                alt={user?.full_name || ""} 
              />
              <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
              <div className="bg-green-500 h-3 w-3 rounded-full border-2 border-background" />
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Welcome back, {user?.full_name?.split(" ")[0] || user?.username}!
              <span className="animate-wave inline-block origin-[70%_70%]">👋</span>
            </h1>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <span>@{user?.username}</span>
              <span className="text-border">•</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 transition-colors">
                <Sparkles className="w-3 h-3 mr-1" />
                {user?.subscription_tier?.toUpperCase() || "FREE"} PLAN
              </Badge>
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
