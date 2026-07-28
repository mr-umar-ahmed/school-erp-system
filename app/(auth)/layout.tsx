import { GraduationCap } from "lucide-react";
import { GeometricPattern } from "@/components/onboarding/geometric-pattern";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-1 items-center justify-center p-4">
      <GeometricPattern />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="glass-icon flex size-16 items-center justify-center rounded-2xl">
            <GraduationCap className="size-8 text-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold">{APP_NAME}</h1>
            <p className="text-sm text-muted-foreground">
              School Management System
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
