import { GraduationCap } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-4">
      <div className="glass-icon flex size-16 animate-pulse items-center justify-center rounded-2xl">
        <GraduationCap className="size-8" />
      </div>
      <div className="h-2 w-40 overflow-hidden rounded-full bg-muted shimmer" />
    </div>
  );
}
