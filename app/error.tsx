"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="glass-icon flex size-20 items-center justify-center rounded-3xl">
        <TriangleAlert className="size-9 text-warning" />
      </div>
      <h1 className="text-2xl font-extrabold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. Try again — if it keeps happening,
        contact your school administrator.
      </p>
      <Button onClick={reset} className="rounded-full">
        <RefreshCw className="size-4" />
        Try Again
      </Button>
    </div>
  );
}
