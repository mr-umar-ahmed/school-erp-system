"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RetryButton() {
  return (
    <Button
      className="relative z-10 rounded-full"
      onClick={() => window.location.reload()}
    >
      <RefreshCw className="size-4" />
      Retry Connection
    </Button>
  );
}
