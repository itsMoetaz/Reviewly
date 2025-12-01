import { useState, useCallback, memo } from "react";
import { MessageSquare, Send, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface InlineCommentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (commentText: string) => Promise<boolean>;
  filePath: string;
  lineNumber: number;
  lineContent?: string;
  isSubmitting?: boolean;
}

export const InlineCommentDialog = memo(({
  isOpen,
  onClose,
  onSubmit,
  filePath,
  lineNumber,
  lineContent,
  isSubmitting = false,
}: InlineCommentDialogProps) => {
  const [commentText, setCommentText] = useState("");

  const handleClose = useCallback(() => {
    setCommentText("");
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!commentText.trim()) return;
    
    const success = await onSubmit(commentText.trim());
    if (success) {
      setCommentText("");
      onClose();
    }
  }, [commentText, onSubmit, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const filename = filePath.split("/").pop() || filePath;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Add Comment
          </DialogTitle>
          <DialogDescription>
            Add a comment on line {lineNumber} of{" "}
            <span className="font-mono text-foreground">{filename}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Line Preview */}
          {lineContent && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs font-mono">
                  Line {lineNumber}
                </Badge>
              </div>
              <pre className="text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre">
                {lineContent}
              </pre>
            </div>
          )}

          {/* Comment Input */}
          <div className="space-y-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your comment... (Ctrl+Enter to submit)"
              className="min-h-[120px] resize-none font-mono text-sm"
              disabled={isSubmitting}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Supports markdown formatting
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!commentText.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

InlineCommentDialog.displayName = "InlineCommentDialog";
