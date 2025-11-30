import { useDashboardData } from "./useDashboardData";
import { WelcomeBanner } from "./WelcomeBanner";
import { StatsOverview } from "./StatsOverview";
import { ProjectList } from "./ProjectList";
import { Button } from "../../components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { AppLayout } from "@/components/layouts/AppLayout";

const HomePage = () => {
  const { user, projects, stats, isLoading, error, refetch } = useDashboardData();

  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 max-w-7xl flex flex-col items-center justify-center min-h-[60vh]">
          <Alert variant="destructive" className="max-w-md mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load dashboard data. Please check your connection and try again.
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl space-y-12 animate-in fade-in duration-500">
        <WelcomeBanner user={user} isLoading={isLoading} />
        
        <StatsOverview stats={stats} isLoading={isLoading} />

        <ProjectList projects={projects} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
};

export default HomePage;
