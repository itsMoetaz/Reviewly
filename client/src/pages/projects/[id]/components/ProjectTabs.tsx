import { memo } from "react";
import { GitPullRequest, GitBranch, Users, Settings, LayoutDashboard } from "lucide-react";
import { cn } from "@/components/lib/utils";

export type ProjectTab = "overview" | "pull-requests" | "branches" | "team" | "settings";

interface Tab {
  id: ProjectTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface ProjectTabsProps {
  activeTab: ProjectTab;
  onTabChange: (tab: ProjectTab) => void;
  openPRsCount?: number;
  membersCount?: number;
  isOwner?: boolean;
}

export const ProjectTabs = memo(({
  activeTab,
  onTabChange,
  openPRsCount = 0,
  membersCount = 0,
  isOwner = false,
}: ProjectTabsProps) => {
  const tabs: Tab[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "pull-requests", label: "Pull Requests", icon: GitPullRequest, badge: openPRsCount },
    { id: "branches", label: "Branches", icon: GitBranch },
    { id: "team", label: "Team", icon: Users, badge: membersCount },
    ...(isOwner ? [{ id: "settings" as ProjectTab, label: "Settings", icon: Settings }] : []),
  ];

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40">
      <div className="container mx-auto px-6 max-w-7xl">
        <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={cn(
                      "ml-1.5 px-2 py-0.5 text-xs font-medium rounded-full",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
});

ProjectTabs.displayName = "ProjectTabs";
