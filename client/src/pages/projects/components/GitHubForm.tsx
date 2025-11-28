import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Github, ArrowLeft, Loader2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ProjectCreateGitHub } from '@/core/interfaces/project.interface';

interface GitHubFormProps {
  onBack: () => void;
  onSubmit: (data: ProjectCreateGitHub) => Promise<void>;
  isSubmitting: boolean;
}

interface GitHubFormData {
  name: string;
  description: string;
  github_repo_owner: string;
  github_repo_name: string;
  github_token: string;
}

export const GitHubForm = ({ onBack, onSubmit, isSubmitting }: GitHubFormProps) => {
  const [showToken, setShowToken] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GitHubFormData>({
    defaultValues: {
      name: '',
      description: '',
      github_repo_owner: '',
      github_repo_name: '',
      github_token: '',
    },
  });

  const repoOwner = watch('github_repo_owner');
  const repoName = watch('github_repo_name');

  const handleFormSubmit = async (data: GitHubFormData) => {
    const payload: ProjectCreateGitHub = {
      name: data.name,
      description: data.description || undefined,
      platform: 'GITHUB',
      repository_url: `https://github.com/${data.github_repo_owner}/${data.github_repo_name}`,
      github_token: data.github_token,
      github_repo_owner: data.github_repo_owner,
      github_repo_name: data.github_repo_name,
    };
    await onSubmit(payload);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gray-900 dark:bg-gray-800">
            <Github className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">GitHub Repository</h3>
            <p className="text-xs text-muted-foreground">Connect your GitHub project</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Project Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Project Name *</Label>
          <Input
            id="name"
            placeholder="My Awesome Project"
            {...register('name', {
              required: 'Project name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
            })}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Brief description of your project..."
            rows={2}
            {...register('description')}
            className="resize-none"
          />
        </div>

        {/* Repository Owner & Name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="github_repo_owner">Repository Owner *</Label>
            <Input
              id="github_repo_owner"
              placeholder="owner"
              {...register('github_repo_owner', {
                required: 'Repository owner is required',
              })}
              className={errors.github_repo_owner ? 'border-red-500' : ''}
            />
            {errors.github_repo_owner && (
              <p className="text-xs text-red-500">{errors.github_repo_owner.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="github_repo_name">Repository Name *</Label>
            <Input
              id="github_repo_name"
              placeholder="repo-name"
              {...register('github_repo_name', {
                required: 'Repository name is required',
              })}
              className={errors.github_repo_name ? 'border-red-500' : ''}
            />
            {errors.github_repo_name && (
              <p className="text-xs text-red-500">{errors.github_repo_name.message}</p>
            )}
          </div>
        </div>

        {/* Repository URL Preview */}
        {repoOwner && repoName && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">
              github.com/{repoOwner}/{repoName}
            </span>
          </div>
        )}

        {/* GitHub Token */}
        <div className="space-y-2">
          <Label htmlFor="github_token">Personal Access Token *</Label>
          <div className="relative">
            <Input
              id="github_token"
              type={showToken ? 'text' : 'password'}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              {...register('github_token', {
                required: 'GitHub token is required',
                minLength: { value: 10, message: 'Token seems too short' },
              })}
              className={`pr-10 ${errors.github_token ? 'border-red-500' : ''}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            >
              {showToken ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {errors.github_token && (
            <p className="text-xs text-red-500">{errors.github_token.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Need a token?{' '}
            <a
              href="https://github.com/settings/tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Generate one here
            </a>
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px] bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Project'
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default GitHubForm;
