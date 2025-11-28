import type { DashboardStats } from "./useDashboardData";
import { Skeleton } from "../../components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { FolderGit2, GitBranch, Activity } from "lucide-react";

interface StatsOverviewProps {
  stats: DashboardStats;
  isLoading: boolean;
}

export const StatsOverview = ({ stats, isLoading }: StatsOverviewProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: FolderGit2,
      description: "All connected repositories",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Active Projects",
      value: stats.activeProjects,
      icon: Activity,
      description: "Currently being monitored",
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "GitHub Projects",
      value: stats.githubProjects,
      icon: GitBranch,
      description: "Connected via GitHub",
      color: "text-gray-500",
      bg: "bg-gray-500/10",
    },
    {
      title: "GitLab Projects",
      value: stats.gitlabProjects,
      icon: GitBranch,
      description: "Connected via GitLab",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {statItems.map((item, index) => (
        <Card key={index} className="border-border/50 shadow-lg  hover:shadow-md transition-all duration-300 hover:border-primary/20 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-300`}>
              <item.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {item.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
