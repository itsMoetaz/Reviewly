import { useState, useCallback, lazy, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { projectService } from '@/core/services/projectService';
import { useToast } from '@/components/hooks/use-toast';
import type { ProjectCreateGitHub, ProjectCreateGitLab } from '@/core/interfaces/project.interface';

// Lazy load form components for better performance
const PlatformSelector = lazy(() => import('./PlatformSelector'));
const GitHubForm = lazy(() => import('./GitHubForm'));
const GitLabForm = lazy(() => import('./GitLabForm'));

type Platform = 'GITHUB' | 'GITLAB';
type DialogStep = 'select' | 'form';

interface CreateProjectDialogProps {
  trigger?: React.ReactNode;
}

const FormLoader = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

export const CreateProjectDialog = ({ trigger }: CreateProjectDialogProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<DialogStep>('select');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Reset dialog state when closing
  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Delay reset to allow close animation
      setTimeout(() => {
        setStep('select');
        setSelectedPlatform(null);
        setIsSubmitting(false);
      }, 200);
    }
  }, []);

  // Handle platform selection
  const handlePlatformSelect = useCallback((platform: Platform) => {
    setSelectedPlatform(platform);
    setStep('form');
  }, []);

  // Handle back to platform selection
  const handleBack = useCallback(() => {
    setStep('select');
    setSelectedPlatform(null);
  }, []);

  // Handle GitHub form submission
  const handleGitHubSubmit = useCallback(async (data: ProjectCreateGitHub) => {
    setIsSubmitting(true);
    try {
      const result = await projectService.createGitHub(data);
      
      if (result.success) {
        // Invalidate and refetch projects query before closing
        await queryClient.invalidateQueries({ queryKey: ['projects'] });
        
        toast({
          title: 'Project created!',
          description: `${data.name} has been successfully connected.`,
        });
        handleOpenChange(false);
      } else {
        toast({
          title: 'Failed to create project',
          description: result.error || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [queryClient, toast, handleOpenChange]);

  // Handle GitLab form submission
  const handleGitLabSubmit = useCallback(async (data: ProjectCreateGitLab) => {
    setIsSubmitting(true);
    try {
      const result = await projectService.createGitLab(data);
      
      if (result.success) {
        // Invalidate and refetch projects query before closing
        await queryClient.invalidateQueries({ queryKey: ['projects'] });
        
        toast({
          title: 'Project created!',
          description: `${data.name} has been successfully connected.`,
        });
        handleOpenChange(false);
      } else {
        toast({
          title: 'Failed to create project',
          description: result.error || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [queryClient, toast, handleOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Default trigger if none provided */}
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      )}

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' ? 'Create New Project' : `Connect ${selectedPlatform === 'GITHUB' ? 'GitHub' : 'GitLab'}`}
          </DialogTitle>
          <DialogDescription>
            {step === 'select'
              ? 'Choose a platform to connect your repository'
              : 'Fill in the details to connect your repository'}
          </DialogDescription>
        </DialogHeader>

        <Suspense fallback={<FormLoader />}>
          <AnimatePresence mode="wait">
            {step === 'select' && (
              <PlatformSelector
                key="selector"
                onSelect={handlePlatformSelect}
              />
            )}

            {step === 'form' && selectedPlatform === 'GITHUB' && (
              <GitHubForm
                key="github-form"
                onBack={handleBack}
                onSubmit={handleGitHubSubmit}
                isSubmitting={isSubmitting}
              />
            )}

            {step === 'form' && selectedPlatform === 'GITLAB' && (
              <GitLabForm
                key="gitlab-form"
                onBack={handleBack}
                onSubmit={handleGitLabSubmit}
                isSubmitting={isSubmitting}
              />
            )}
          </AnimatePresence>
        </Suspense>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
