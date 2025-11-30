import { memo, useState } from "react";
import { 
  Sparkles, 
  Loader2, 
  Clock,
  ChevronDown,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/components/lib/utils";

interface AIReviewTriggerProps {
  onTrigger: (reviewType?: string, focusAreas?: string[]) => void;
  isLoading: boolean;
  hasExistingReview: boolean;
  reviewStatus?: string;
  disabled?: boolean;
}

const REVIEW_TYPES = [
  {
    id: "full",
    label: "Full Review",
    description: "Comprehensive code analysis",
    icon: Sparkles,
  },
  {
    id: "security",
    label: "Security Review",
    description: "Focus on security vulnerabilities",
    icon: Zap,
  },
  {
    id: "quick",
    label: "Quick Review",
    description: "Fast high-level feedback",
    icon: Clock,
  },
];

export const AIReviewTrigger = memo(({ 
  onTrigger, 
  isLoading,
  hasExistingReview,
  reviewStatus,
  disabled
}: AIReviewTriggerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleTrigger = (reviewType?: string) => {
    setIsOpen(false);
    onTrigger(reviewType);
  };

  const isPending = reviewStatus === "pending" || reviewStatus === "processing";
  const buttonDisabled = disabled || isLoading || isPending;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={hasExistingReview ? "outline" : "default"}
          size="sm"
          disabled={buttonDisabled}
          className={cn(
            "gap-1.5 h-8 text-xs shrink-0",
            !hasExistingReview && "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          )}
        >
          {isLoading || isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {isPending
            ? "Processing..."
            : hasExistingReview
            ? "Re-analyze"
            : "AI Review"}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {REVIEW_TYPES.map((type) => (
          <DropdownMenuItem
            key={type.id}
            onClick={() => handleTrigger(type.id)}
            className="flex items-start gap-3 py-2"
          >
            <type.icon className="h-4 w-4 mt-0.5 text-primary" />
            <div>
              <p className="font-medium text-sm">{type.label}</p>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

AIReviewTrigger.displayName = "AIReviewTrigger";
