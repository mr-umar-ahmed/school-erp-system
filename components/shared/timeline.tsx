import { cn } from "@/lib/utils";

export interface TimelineEntry {
  time: string;
  content: React.ReactNode;
  active?: boolean;
}

/** Vertical time-labelled timeline for daily schedules (Image 2 style). */
export function Timeline({
  entries,
  className,
}: {
  entries: TimelineEntry[];
  className?: string;
}) {
  return (
    <ol className={cn("relative space-y-4", className)}>
      {entries.map((entry, index) => (
        <li key={index} className="flex gap-3">
          <div className="flex w-14 shrink-0 flex-col items-end pt-3">
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                entry.active ? "text-primary" : "text-muted-foreground"
              )}
            >
              {entry.time}
            </span>
          </div>
          <div className="relative flex flex-col items-center">
            <span
              className={cn(
                "mt-3.5 size-2.5 shrink-0 rounded-full",
                entry.active ? "bg-primary ring-4 ring-primary/20" : "bg-muted-foreground/40"
              )}
            />
            {index < entries.length - 1 && (
              <span className="w-px flex-1 bg-border" />
            )}
          </div>
          <div className="min-w-0 flex-1 pb-1">{entry.content}</div>
        </li>
      ))}
    </ol>
  );
}
