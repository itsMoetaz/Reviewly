import { useState, useCallback, useMemo, Suspense, lazy } from "react";
import { useParams } from "react-router-dom";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { motion } from "framer-motion";
import { Loader2, GripVertical, AlertTriangle, FileCode, Sparkles, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/hooks/use-toast";
import { AppLayout } from "@/components/layouts/AppLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FileChange } from "@/core/interfaces/repository.interface";

// Hooks
import { useProjectDetails } from "../../hooks/useProjectDetails";
import { usePRDetails } from "./hooks";
import { useAIReview } from "./hooks";

// Eager-loaded components (above the fold)
import { PRHeader } from "./components/PRHeader";
import { PRStats } from "./components/PRStats";
import { FileTree } from "./components/FileTree";

// Lazy-loaded components
const DiffViewer = lazy(() =>
  import("./components/DiffViewer").then((m) => ({ default: m.DiffViewer }))
);
const AIReviewPanel = lazy(() =>
  import("./components/AIReviewPanel").then((m) => ({ default: m.AIReviewPanel }))
);

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full min-h-[200px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Resize handle component (desktop only)
const ResizeHandle = ({ className = "" }) => (
  <PanelResizeHandle className={`group relative flex items-center justify-center ${className}`}>
    <div className="absolute inset-0 -mx-1 group-hover:bg-primary/10 transition-colors" />
    <div className="relative z-10 flex h-full items-center justify-center">
      <GripVertical className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
    </div>
  </PanelResizeHandle>
);

// Mobile tab type
type MobileTab = "files" | "diff" | "review";

export default function PullRequestDetailPage() {
  const { id: projectId, prNumber } = useParams<{ id: string; prNumber: string }>();
  const { toast } = useToast();

  // State
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("files");

  // Data fetching
  const { 
    project, 
    isLoading: isProjectLoading 
  } = useProjectDetails(Number(projectId));

  const {
    prDetails,
    isLoading: isPRLoading,
    error: prError,
  } = usePRDetails(Number(projectId), Number(prNumber));

  const {
    reviews,
    selectedReview,
    deleteReview,
    rerunReview,
    isCreatingReview,
    isRerunning,
    isDeletingReview,
    isLoadingReviews,
  } = useAIReview(Number(projectId), Number(prNumber));

  // Get files from PR details
  const files: FileChange[] = prDetails?.files || [];

  // Auto-select first file if none selected
  const selectedFileData = useMemo(() => {
    if (!files.length) return null;
    if (selectedFile) {
      return files.find((f: FileChange) => f.filename === selectedFile) || null;
    }
    return files[0];
  }, [files, selectedFile]);

  // Handlers
  const handleSelectFile = useCallback((filename: string) => {
    setSelectedFile(filename);
    // On mobile, switch to diff tab when file is selected
    setMobileTab("diff");
  }, []);

  const handleCreateReview = useCallback(
    async (reviewType?: string) => {
      try {
        const options = reviewType ? { include_context: true, focus_areas: [reviewType] } : undefined;
        
        // Always use rerunReview - it handles both cases:
        // - If there's an existing review, it deletes first then creates
        // - If no existing review, it just creates
        await rerunReview(null, options);
        toast({
          title: "Review Started",
          description: "AI is analyzing your code. This may take a moment.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to Start Review",
          description: error instanceof Error ? error.message : "Could not start AI review. Please try again.",
        });
      }
    },
    [rerunReview, toast]
  );

  const handleDeleteReview = useCallback(
    async (reviewId: number) => {
      try {
        await deleteReview(reviewId);
        toast({
          title: "Review Deleted",
          description: "The AI review has been removed.",
        });
      } catch {
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: "Could not delete the review. Please try again.",
        });
      }
    },
    [deleteReview, toast]
  );

  const handleNavigateToFile = useCallback(
    (filename: string, _line: number) => {
      setSelectedFile(filename);
      // Could scroll to line in future enhancement
    },
    []
  );

  const handleAddComment = useCallback(
    (_lineNumber: number, _filePath: string) => {
      // TODO: Implement comment dialog
      toast({
        title: "Coming Soon",
        description: "Inline comments will be available soon!",
      });
    },
    [toast]
  );

  // Loading state
  const isLoading = isProjectLoading || isPRLoading;

  // Error state
  if (prError) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Failed to Load Pull Request</h2>
            <p className="text-muted-foreground mb-4">
              {prError instanceof Error ? prError.message : "An error occurred"}
            </p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background flex flex-col -mt-16 pt-16">
        {/* Header */}
        <PRHeader
          prDetails={prDetails}
          projectId={Number(projectId)}
          platform={project?.platform}
          repositoryUrl={project?.repository_url}
          isLoading={isLoading}
        />

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 container mx-auto px-3 sm:px-6 py-4 sm:py-6 max-w-[1800px]"
        >
          {/* Stats Bar */}
          <div className="mb-4 sm:mb-6">
            <PRStats stats={prDetails?.stats} isLoading={isLoading} />
          </div>

          {/* Mobile Layout: Tabbed Interface */}
          <div className="lg:hidden">
            <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as MobileTab)} className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="files" className="gap-1.5 text-xs sm:text-sm">
                  <FileCode className="h-4 w-4" />
                  <span className="hidden xs:inline">Files</span>
                  <span className="xs:hidden">Files</span>
                </TabsTrigger>
                <TabsTrigger value="diff" className="gap-1.5 text-xs sm:text-sm">
                  <Code2 className="h-4 w-4" />
                  <span className="hidden xs:inline">Changes</span>
                  <span className="xs:hidden">Diff</span>
                </TabsTrigger>
                <TabsTrigger value="review" className="gap-1.5 text-xs sm:text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden xs:inline">AI Review</span>
                  <span className="xs:hidden">AI</span>
                </TabsTrigger>
              </TabsList>

              <div className="rounded-xl border border-border bg-card overflow-hidden min-h-[calc(100vh-380px)]">
                {/* Files Tab */}
                <TabsContent value="files" className="m-0 h-[calc(100vh-380px)]">
                  <FileTree
                    files={files}
                    selectedFile={selectedFileData?.filename || null}
                    onSelectFile={handleSelectFile}
                    isLoading={isLoading}
                  />
                </TabsContent>

                {/* Diff Tab */}
                <TabsContent value="diff" className="m-0 h-[calc(100vh-380px)] overflow-y-auto">
                  <ErrorBoundary
                    title="Diff Viewer Error"
                    description="Failed to render the diff viewer. Try selecting a different file."
                  >
                    <Suspense fallback={<LoadingFallback />}>
                      <div className="p-3 sm:p-4">
                        <DiffViewer
                          file={selectedFileData}
                          issues={selectedReview?.issues}
                          onAddComment={handleAddComment}
                          isLoading={isLoading}
                        />
                      </div>
                    </Suspense>
                  </ErrorBoundary>
                </TabsContent>

                {/* AI Review Tab */}
                <TabsContent value="review" className="m-0 h-[calc(100vh-380px)]">
                  <ErrorBoundary
                    title="AI Review Error"
                    description="Failed to render the AI review panel. Try refreshing the page."
                  >
                    <Suspense fallback={<LoadingFallback />}>
                      <AIReviewPanel
                        reviews={reviews}
                        selectedReview={selectedReview ?? null}
                        onCreateReview={handleCreateReview}
                        onDeleteReview={handleDeleteReview}
                        isCreating={isCreatingReview || isRerunning}
                        isDeleting={isDeletingReview}
                        isLoading={isLoadingReviews}
                        onNavigateToFile={handleNavigateToFile}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Desktop Layout: Three Panel Layout */}
          <div className="hidden lg:block h-[calc(100vh-280px)] min-h-[500px]">
            <PanelGroup direction="horizontal" className="rounded-xl border border-border bg-card">
              {/* Left: File Tree */}
              <Panel defaultSize={20} minSize={15} maxSize={30}>
                <div className="h-full overflow-hidden">
                  <FileTree
                    files={files}
                    selectedFile={selectedFileData?.filename || null}
                    onSelectFile={handleSelectFile}
                    isLoading={isLoading}
                  />
                </div>
              </Panel>

              <ResizeHandle />

              {/* Center: Diff Viewer */}
              <Panel defaultSize={45} minSize={30}>
                <div className="h-full overflow-hidden">
                  <ErrorBoundary
                    title="Diff Viewer Error"
                    description="Failed to render the diff viewer. Try selecting a different file."
                  >
                    <Suspense fallback={<LoadingFallback />}>
                      <div className="h-full overflow-y-auto p-4">
                        <DiffViewer
                          file={selectedFileData}
                          issues={selectedReview?.issues}
                          onAddComment={handleAddComment}
                          isLoading={isLoading}
                        />
                      </div>
                    </Suspense>
                  </ErrorBoundary>
                </div>
              </Panel>

              <ResizeHandle />

              {/* Right: AI Review Panel */}
              <Panel defaultSize={35} minSize={20} maxSize={60}>
                <div className="h-full overflow-hidden border-l border-border">
                  <ErrorBoundary
                    title="AI Review Error"
                    description="Failed to render the AI review panel. Try refreshing the page."
                  >
                    <Suspense fallback={<LoadingFallback />}>
                      <AIReviewPanel
                        reviews={reviews}
                        selectedReview={selectedReview ?? null}
                        onCreateReview={handleCreateReview}
                        onDeleteReview={handleDeleteReview}
                        isCreating={isCreatingReview || isRerunning}
                        isDeleting={isDeletingReview}
                        isLoading={isLoadingReviews}
                        onNavigateToFile={handleNavigateToFile}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              </Panel>
            </PanelGroup>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
