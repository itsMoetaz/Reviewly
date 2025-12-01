import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentService } from "@/core/services/commentService";
import type { CommentResponse, ReactionType } from "@/core/interfaces/comment.interface";

interface UseCommentsOptions {
  projectId: number;
  prNumber: number;
  commitSha?: string;
}

export function useComments({ projectId, prNumber, commitSha }: UseCommentsOptions) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 50;

  // Fetch comments
  const {
    data: commentsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["comments", projectId, prNumber, page, perPage],
    queryFn: async () => {
      const result = await commentService.getComments(projectId, prNumber, { page, per_page: perPage });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!projectId && !!prNumber,
    staleTime: 30000, // 30 seconds
  });

  // Group comments by file and line
  const commentsByLine = useMemo(() => {
    const map = new Map<string, CommentResponse[]>();
    
    commentsData?.comments.forEach((comment) => {
      if (comment.file_path && comment.line_number) {
        const key = `${comment.file_path}:${comment.line_number}`;
        const existing = map.get(key) || [];
        map.set(key, [...existing, comment]);
      }
    });
    
    return map;
  }, [commentsData?.comments]);

  // General comments (no file/line)
  const generalComments = useMemo(() => {
    return commentsData?.comments.filter(
      (c) => !c.file_path || !c.line_number
    ) || [];
  }, [commentsData?.comments]);

  // Get comments for a specific line
  const getCommentsForLine = useCallback((filePath: string, lineNumber: number): CommentResponse[] => {
    return commentsByLine.get(`${filePath}:${lineNumber}`) || [];
  }, [commentsByLine]);

  // Check if a line has comments
  const hasCommentsOnLine = useCallback((filePath: string, lineNumber: number): boolean => {
    return (commentsByLine.get(`${filePath}:${lineNumber}`)?.length || 0) > 0;
  }, [commentsByLine]);

  // Count comments on a line
  const getCommentCount = useCallback((filePath: string, lineNumber: number): number => {
    return commentsByLine.get(`${filePath}:${lineNumber}`)?.length || 0;
  }, [commentsByLine]);

  // Create general comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      const result = await commentService.createComment(projectId, prNumber, commentText);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", projectId, prNumber] });
    },
  });

  // Create inline comment mutation
  const createInlineCommentMutation = useMutation({
    mutationFn: async (data: {
      commentText: string;
      filePath: string;
      lineNumber: number;
      lineEnd?: number;
    }) => {
      if (!commitSha) {
        throw new Error("Commit SHA is required for inline comments");
      }
      const result = await commentService.createInlineComment(projectId, prNumber, {
        commentText: data.commentText,
        commit_sha: commitSha,
        file_path: data.filePath,
        line_number: data.lineNumber,
        line_end: data.lineEnd,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", projectId, prNumber] });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, commentText }: { commentId: number; commentText: string }) => {
      const result = await commentService.updateComment(commentId, commentText);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", projectId, prNumber] });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const result = await commentService.deleteComment(commentId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", projectId, prNumber] });
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
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", projectId, prNumber] });
    },
  });

  // Action handlers
  const createComment = useCallback(async (commentText: string): Promise<boolean> => {
    try {
      await createCommentMutation.mutateAsync(commentText);
      return true;
    } catch {
      return false;
    }
  }, [createCommentMutation]);

  const createInlineComment = useCallback(async (
    filePath: string,
    lineNumber: number,
    commentText: string,
    lineEnd?: number
  ): Promise<boolean> => {
    try {
      await createInlineCommentMutation.mutateAsync({
        commentText,
        filePath,
        lineNumber,
        lineEnd,
      });
      return true;
    } catch {
      return false;
    }
  }, [createInlineCommentMutation]);

  const updateComment = useCallback(async (commentId: number, commentText: string): Promise<boolean> => {
    try {
      await updateCommentMutation.mutateAsync({ commentId, commentText });
      return true;
    } catch {
      return false;
    }
  }, [updateCommentMutation]);

  const deleteComment = useCallback(async (commentId: number): Promise<boolean> => {
    try {
      await deleteCommentMutation.mutateAsync(commentId);
      return true;
    } catch {
      return false;
    }
  }, [deleteCommentMutation]);

  const toggleReaction = useCallback(async (
    commentId: number,
    reactionType: ReactionType
  ): Promise<void> => {
    const comment = commentsData?.comments.find(c => c.id === commentId);
    const currentUserReactions = comment?.reactions_summary?.user_reactions || [];
    
    await toggleReactionMutation.mutateAsync({
      commentId,
      reactionType,
      currentUserReactions,
    });
  }, [toggleReactionMutation, commentsData?.comments]);

  return {
    // Data
    comments: commentsData?.comments || [],
    generalComments,
    commentsByLine,
    total: commentsData?.total || 0,
    page,
    perPage,
    totalPages: commentsData ? Math.ceil(commentsData.total / perPage) : 0,
    
    // State
    isLoading,
    error,
    isCreating: createCommentMutation.isPending || createInlineCommentMutation.isPending,
    isUpdating: updateCommentMutation.isPending,
    isDeleting: deleteCommentMutation.isPending,
    
    // Actions
    refetch,
    setPage,
    createComment,
    createInlineComment,
    updateComment,
    deleteComment,
    toggleReaction,
    
    // Helpers
    getCommentsForLine,
    hasCommentsOnLine,
    getCommentCount,
  };
}
