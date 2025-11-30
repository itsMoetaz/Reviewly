import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { teamService } from "@/core/services/teamService";
import { useToast } from "@/components/hooks/use-toast";

// Components
import { ProjectHeader } from "./components/ProjectHeader";
import { ProjectTabs, type ProjectTab } from "./components/ProjectTabs";

// Tabs
import { OverviewTab } from "./tabs/OverviewTab";
import { PullRequestsTab } from "./tabs/PullRequestsTab";
import { BranchesTab } from "./tabs/BranchesTab";
import { TeamTab } from "./tabs/TeamTab";

// Hooks
import { useProjectDetails } from "./hooks/useProjectDetails";
import { usePullRequests } from "./hooks/usePullRequests";

// Types
import type { ProjectMemberRole } from "@/core/interfaces/team.interface";

const ProjectDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projectId = parseInt(id || "0", 10);
  const { toast } = useToast();
  
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProjectTab>("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data hooks
  const {
    project,
    branches,
    members,
    isLoading,
    isProjectLoading,
    isBranchesLoading,
    isMembersLoading,
    projectError,
    refetchAll,
  } = useProjectDetails(projectId);

  const pullRequestsHook = usePullRequests(projectId);

  // Determine user's role in this project
  const currentMember = members.find(m => m.user_id === user?.id);
  const currentUserRole = currentMember?.role;
  const isOwner = currentUserRole === "OWNER" || project?.user_id === user?.id;

  // Handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchAll();
      await pullRequestsHook.refetch();
      toast({ title: "Data refreshed successfully" });
    } catch {
      toast({ title: "Failed to refresh data", variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchAll, pullRequestsHook, toast]);

  const handleTabChange = useCallback((tab: ProjectTab) => {
    setActiveTab(tab);
  }, []);

  const handleInviteMember = useCallback(() => {
    // TODO: Open invite member dialog
    toast({ title: "Invite member dialog coming soon!" });
  }, [toast]);

  const handleUpdateRole = useCallback(async (
    _memberId: number, 
    userId: number, 
    newRole: ProjectMemberRole
  ) => {
    const result = await teamService.updateMemberRole(projectId, userId, newRole);
    if (result.success) {
      toast({ title: "Member role updated" });
      queryClient.invalidateQueries({ queryKey: ["project", projectId, "members"] });
    } else {
      toast({ title: result.error || "Failed to update role", variant: "destructive" });
    }
  }, [projectId, queryClient, toast]);

  const handleRemoveMember = useCallback(async (_memberId: number, userId: number) => {
    const result = await teamService.removeMember(projectId, userId);
    if (result.success) {
      toast({ title: "Member removed from project" });
      queryClient.invalidateQueries({ queryKey: ["project", projectId, "members"] });
    } else {
      toast({ title: result.error || "Failed to remove member", variant: "destructive" });
    }
  }, [projectId, queryClient, toast]);

  // Invalid project ID
  if (!projectId || projectId <= 0) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 max-w-7xl flex flex-col items-center justify-center min-h-[60vh]">
          <Alert variant="destructive" className="max-w-md mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid Project</AlertTitle>
            <AlertDescription>
              The project ID is invalid. Please go back and select a valid project.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/home")} className="gap-2">
            Go to Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (projectError) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 max-w-7xl flex flex-col items-center justify-center min-h-[60vh]">
          <Alert variant="destructive" className="max-w-md mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Project</AlertTitle>
            <AlertDescription>
              {projectError.message || "Failed to load project data. Please try again."}
            </AlertDescription>
          </Alert>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/home")}>
              Go Back
            </Button>
            <Button onClick={() => refetchAll()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <ProjectHeader
        project={project}
        isLoading={isProjectLoading}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Tabs */}
      <ProjectTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        openPRsCount={project?.stats?.open_prs_count || 0}
        membersCount={members.length}
        isOwner={isOwner}
      />

      {/* Tab Content */}
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {activeTab === "overview" && (
          <OverviewTab
            project={project}
            branches={branches}
            members={members}
            isLoading={isLoading}
            onNavigateToPRs={() => setActiveTab("pull-requests")}
            onNavigateToBranches={() => setActiveTab("branches")}
            onNavigateToTeam={() => setActiveTab("team")}
          />
        )}

        {activeTab === "pull-requests" && (
          <PullRequestsTab
            projectId={projectId}
            pullRequests={pullRequestsHook.pullRequests}
            isLoading={pullRequestsHook.isLoading}
            isFetching={pullRequestsHook.isFetching}
            state={pullRequestsHook.state}
            page={pullRequestsHook.page}
            totalPages={pullRequestsHook.totalPages}
            total={pullRequestsHook.total}
            hasNextPage={pullRequestsHook.hasNextPage}
            hasPreviousPage={pullRequestsHook.hasPreviousPage}
            onStateChange={pullRequestsHook.setState}
            onNextPage={pullRequestsHook.goToNextPage}
            onPreviousPage={pullRequestsHook.goToPreviousPage}
          />
        )}

        {activeTab === "branches" && (
          <BranchesTab
            branches={branches}
            isLoading={isBranchesLoading}
          />
        )}

        {activeTab === "team" && (
          <TeamTab
            members={members}
            isLoading={isMembersLoading}
            currentUserId={user?.id || 0}
            currentUserRole={currentUserRole}
            onInviteMember={handleInviteMember}
            onUpdateRole={handleUpdateRole}
            onRemoveMember={handleRemoveMember}
          />
        )}

        {activeTab === "settings" && (
          <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-xl bg-muted/20">
            <p className="text-lg font-medium mb-2">Settings</p>
            <p className="text-sm text-muted-foreground text-center">
              Project settings will be implemented in a future update.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ProjectDetailsPage;
