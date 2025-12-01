import { memo, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  MessageSquare, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  X,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/components/lib/utils";
import type { CommentResponse, ReactionType } from "@/core/interfaces/comment.interface";
import { REACTION_CONFIG } from "@/core/interfaces/comment.interface";

interface CommentThreadProps {
  comments: CommentResponse[];
  currentUserId: number;
  onEdit?: (commentId: number, newText: string) => Promise<boolean>;
  onDelete?: (commentId: number) => Promise<boolean>;
  onReaction?: (commentId: number, reactionType: ReactionType) => Promise<void>;
  isCompact?: boolean;
}

interface CommentItemProps {
  comment: CommentResponse;
  isOwner: boolean;
  onEdit?: (commentId: number, newText: string) => Promise<boolean>;
  onDelete?: (commentId: number) => Promise<boolean>;
  onReaction?: (reactionType: ReactionType) => Promise<void>;
  isCompact?: boolean;
}

const CommentItem = memo(({
  comment,
  isOwner,
  onEdit,
  onDelete,
  onReaction,
  isCompact = false,
}: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment_text);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const handleSaveEdit = useCallback(async () => {
    if (!editText.trim() || !onEdit) return;
    setIsSubmitting(true);
    const success = await onEdit(comment.id, editText.trim());
    if (success) {
      setIsEditing(false);
    }
    setIsSubmitting(false);
  }, [editText, onEdit, comment.id]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    setIsSubmitting(true);
    await onDelete(comment.id);
    setIsSubmitting(false);
  }, [onDelete, comment.id]);

  const handleReaction = useCallback(async (type: ReactionType) => {
    if (!onReaction) return;
    await onReaction(type);
    setShowReactions(false);
  }, [onReaction]);

  const reactions = comment.reactions_summary;
  const userReactions = reactions?.user_reactions || [];
  const hasReactions = reactions && Object.entries(reactions)
    .filter(([key]) => key !== "user_reactions")
    .some(([, value]) => (value as number) > 0);

  return (
    <div className={cn(
      "group rounded-lg border border-border bg-card",
      isCompact ? "p-2" : "p-3"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            "rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium",
            isCompact ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"
          )}>
            U{comment.user_id}
          </div>
          <div className="min-w-0">
            <span className={cn(
              "font-medium truncate block",
              isCompact && "text-sm"
            )}>
              User {comment.user_id}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              {comment.updated_at && comment.updated_at !== comment.created_at && (
                <span className="ml-1">(edited)</span>
              )}
            </span>
          </div>
        </div>

        {isOwner && !isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete} 
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Location Badge */}
      {comment.file_path && comment.line_number && (
        <div className="mb-2">
          <Badge variant="outline" className="text-xs font-mono">
            {comment.file_path.split("/").pop()}:{comment.line_number}
            {comment.line_end && comment.line_end !== comment.line_number && 
              `-${comment.line_end}`
            }
          </Badge>
        </div>
      )}

      {/* Content */}
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="min-h-[80px] text-sm"
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setEditText(comment.comment_text);
              }}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={!editText.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className={cn(
          "text-sm whitespace-pre-wrap break-words",
          isCompact && "text-xs"
        )}>
          {comment.comment_text}
        </div>
      )}

      {/* Reactions */}
      {!isEditing && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {/* Existing reactions */}
          {hasReactions && Object.entries(REACTION_CONFIG).map(([type, config]) => {
            const count = reactions?.[type as keyof typeof reactions] as number;
            if (!count || count === 0) return null;
            const isUserReaction = userReactions.includes(type as ReactionType);
            
            return (
              <button
                key={type}
                onClick={() => handleReaction(type as ReactionType)}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors",
                  isUserReaction
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted hover:bg-muted/80 border border-transparent"
                )}
              >
                <span>{config.emoji}</span>
                <span>{count}</span>
              </button>
            );
          })}

          {/* Add reaction button */}
          {onReaction && (
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className={cn(
                  "p-1 rounded-full transition-colors",
                  "opacity-0 group-hover:opacity-100",
                  "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {showReactions ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {showReactions && (
                <div className="absolute bottom-full left-0 mb-1 p-1 rounded-lg border border-border bg-popover shadow-lg flex gap-1 z-10">
                  {Object.entries(REACTION_CONFIG).map(([type, config]) => (
                    <button
                      key={type}
                      onClick={() => handleReaction(type as ReactionType)}
                      className={cn(
                        "p-1.5 rounded hover:bg-muted transition-colors",
                        userReactions.includes(type as ReactionType) && "bg-primary/20"
                      )}
                      title={config.label}
                    >
                      <span className="text-base">{config.emoji}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

CommentItem.displayName = "CommentItem";

export const CommentThread = memo(({
  comments,
  currentUserId,
  onEdit,
  onDelete,
  onReaction,
  isCompact = false,
}: CommentThreadProps) => {
  if (!comments.length) {
    return null;
  }

  return (
    <div className={cn("space-y-2", isCompact && "space-y-1")}>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          isOwner={comment.user_id === currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
          onReaction={onReaction ? (type) => onReaction(comment.id, type) : undefined}
          isCompact={isCompact}
        />
      ))}
    </div>
  );
});

CommentThread.displayName = "CommentThread";

// Inline comment indicator for diff viewer
interface InlineCommentIndicatorProps {
  count: number;
  onClick: () => void;
}

export const InlineCommentIndicator = memo(({ count, onClick }: InlineCommentIndicatorProps) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors text-xs"
  >
    <MessageSquare className="h-3 w-3" />
    <span>{count}</span>
  </button>
));

InlineCommentIndicator.displayName = "InlineCommentIndicator";
