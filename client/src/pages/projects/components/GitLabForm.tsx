import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Gitlab, ArrowLeft, Loader2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ProjectCreateGitLab } from '@/core/interfaces/project.interface';

interface GitLabFormProps {
  onBack: () => void;
  onSubmit: (data: ProjectCreateGitLab) => Promise<void>;
  isSubmitting: boolean;
}

interface GitLabFormData {
  name: string;
  description: string;
  gitlab_project_id: string;
  repository_url: string;
  gitlab_token: string;
}

export const GitLabForm = ({ onBack, onSubmit, isSubmitting }: GitLabFormProps) => {
  const [showToken, setShowToken] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GitLabFormData>({
    defaultValues: {
      name: '',
      description: '',
      gitlab_project_id: '',
      repository_url: '',
      gitlab_token: '',
    },
  });

  const handleFormSubmit = async (data: GitLabFormData) => {
    const payload: ProjectCreateGitLab = {
      name: data.name,
      description: data.description || undefined,
      platform: 'GITLAB',
      repository_url: data.repository_url,
      gitlab_project_id: data.gitlab_project_id,
      gitlab_token: data.gitlab_token,
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
          disabled={isSubmitting}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-orange-600 dark:bg-orange-700">
            <Gitlab className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">GitLab Project</h3>
            <p className="text-xs text-muted-foreground">Connect your GitLab repository</p>
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

        {/* GitLab Project ID */}
        <div className="space-y-2">
          <Label htmlFor="gitlab_project_id">GitLab Project ID *</Label>
          <Input
            id="gitlab_project_id"
            placeholder="12345678"
            {...register('gitlab_project_id', {
              required: 'GitLab Project ID is required',
              pattern: {
                value: /^[0-9]+$/,
                message: 'Project ID must be a number',
              },
            })}
            className={errors.gitlab_project_id ? 'border-red-500' : ''}
          />
          {errors.gitlab_project_id && (
            <p className="text-xs text-red-500">{errors.gitlab_project_id.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Find this in your GitLab project settings under "General"
          </p>
        </div>

        {/* Repository URL */}
        <div className="space-y-2">
          <Label htmlFor="repository_url">Repository URL *</Label>
          <div className="relative">
            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="repository_url"
              placeholder="https://gitlab.com/username/project"
              {...register('repository_url', {
                required: 'Repository URL is required',
                pattern: {
                  value: /^https?:\/\/(gitlab\.com|gitlab\.[a-z]+\.[a-z]+)\/.+/i,
                  message: 'Please enter a valid GitLab repository URL (e.g., https://gitlab.com/...)',
                },
              })}
              className={`pl-10 ${errors.repository_url ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.repository_url && (
            <p className="text-xs text-red-500">{errors.repository_url.message}</p>
          )}
        </div>

        {/* GitLab Token */}
        <div className="space-y-2">
          <Label htmlFor="gitlab_token">Personal Access Token *</Label>
          <div className="relative">
            <Input
              id="gitlab_token"
              type={showToken ? 'text' : 'password'}
              placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
              {...register('gitlab_token', {
                required: 'GitLab token is required',
                pattern: {
                  value: /^glpat-[a-zA-Z0-9_-]{20,}$/,
                  message: 'Please enter a valid GitLab token (starts with glpat-)',
                },
              })}
              className={`pr-10 ${errors.gitlab_token ? 'border-red-500' : ''}`}
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
          {errors.gitlab_token && (
            <p className="text-xs text-red-500">{errors.gitlab_token.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Need a token?{' '}
            <a
              href="https://gitlab.com/-/user_settings/personal_access_tokens"
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
            className="min-w-[120px] bg-orange-600 hover:bg-orange-500 dark:bg-orange-700 dark:hover:bg-orange-600"
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

export default GitLabForm;
