import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeometricPattern } from "@/components/onboarding/geometric-pattern";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <GeometricPattern />
      <div className="glass-icon flex size-20 items-center justify-center rounded-3xl">
        <Compass className="size-9" />
      </div>
      <h1 className="text-4xl font-extrabold">404</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page doesn&apos;t exist or has moved. Head back to your dashboard.
      </p>
      <Button asChild className="relative z-10 rounded-full">
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
}
