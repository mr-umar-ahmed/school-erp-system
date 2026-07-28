import { cn } from "@/lib/utils";
import type { PriorityLevel } from "@/lib/generated/prisma/enums";

const STYLES: Record<PriorityLevel, string> = {
  low: "bg-info/15 text-info",
  medium: "bg-warning/15 text-warning",
  high: "bg-destructive/15 text-destructive",
  urgent: "bg-destructive text-destructive-foreground",
};

const LABELS: Record<PriorityLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

/** Rounded pill priority tag (Image 1 style). */
export function PriorityBadge({
  priority,
  className,
}: {
  priority: PriorityLevel;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STYLES[priority],
        className
      )}
    >
      {LABELS[priority]}
    </span>
  );
}
