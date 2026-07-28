import type { Metadata } from "next";
import { GeometricPattern } from "@/components/onboarding/geometric-pattern";
import { RetryButton } from "./retry-button";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <GeometricPattern />
      <div className="glass-icon flex size-24 items-center justify-center rounded-3xl text-5xl">
        📡
      </div>
      <div className="relative z-10 space-y-2">
        <h1 className="text-3xl font-extrabold">You&apos;re offline</h1>
        <p className="mx-auto max-w-sm text-muted-foreground">
          Don&apos;t worry, your data is safe. Reconnect to the internet and
          pick up right where you left off.
        </p>
      </div>
      <RetryButton />
    </div>
  );
}
