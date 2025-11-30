import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentService } from "@/core/services/commentService";
import type { ReactionType, CommentResponse } from "@/core/interfaces/comment.interface";

/**
 * Hook for managing PR comments
 */
export const usePRComments = (projectId: number, prNumber: number) => {
  const queryClient = useQueryClient();

  // Fetch comments
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["project", projectId, "pr", prNumber, "comments"],
    queryFn: async () => {
      const result = await commentService.getComments(projectId, prNumber);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    enabled: !!projectId && projectId > 0 && !!prNumber && prNumber > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      const result = await commentService.createComment(projectId, prNumber, commentText);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["project", projectId, "pr", prNumber, "comments"] 
      });
    },
  });

  // Create inline comment mutation
  const createInlineCommentMutation = useMutation({
    mutationFn: async (data: {
      commentText: string;
      commit_sha: string;
      file_path: string;
      line_number: number;
      line_end?: number;
    }) => {
      const result = await commentService.createInlineComment(projectId, prNumber, data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["project", projectId, "pr", prNumber, "comments"] 
      });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, commentText }: { commentId: number; commentText: string }) => {
      const result = await commentService.updateComment(commentId, commentText);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["project", projectId, "pr", prNumber, "comments"] 
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const result = await commentService.deleteComment(commentId);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["project", projectId, "pr", prNumber, "comments"] 
      });
    },
  });

  // Toggle reaction mutation
  const toggleReactionMutation = useMutation({
    mutationFn: async ({ 
      commentId, 
      reactionType, 
      currentUserReactions 
    }: { 
      commentId: number; 
      reactionType: ReactionType; 
      currentUserReactions: ReactionType[];
    }) => {
      const result = await commentService.toggleReaction(commentId, reactionType, currentUserReactions);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["project", projectId, "pr", prNumber, "comments"] 
      });
    },
  });

  // Group comments by file path for inline display
  const commentsByFile = (data?.comments || []).reduce((acc, comment) => {
    if (comment.file_path) {
      if (!acc[comment.file_path]) {
        acc[comment.file_path] = [];
      }
      acc[comment.file_path].push(comment);
    }
    return acc;
  }, {} as Record<string, CommentResponse[]>);

  // General comments (not inline)
  const generalComments = (data?.comments || []).filter(c => !c.file_path);

  return {
    // Data
    comments: data?.comments || [],
    generalComments,
    commentsByFile,
    total: data?.total || 0,
    isLoading,
    error: error as Error | null,
    refetch,

    // Create
    createComment: createCommentMutation.mutate,
    isCreatingComment: createCommentMutation.isPending,

    // Create inline
    createInlineComment: createInlineCommentMutation.mutate,
    isCreatingInlineComment: createInlineCommentMutation.isPending,

    // Update
    updateComment: updateCommentMutation.mutate,
    isUpdatingComment: updateCommentMutation.isPending,

    // Delete
    deleteComment: deleteCommentMutation.mutate,
    isDeletingComment: deleteCommentMutation.isPending,

    // Reactions
    toggleReaction: toggleReactionMutation.mutate,
    isTogglingReaction: toggleReactionMutation.isPending,
  };
};
