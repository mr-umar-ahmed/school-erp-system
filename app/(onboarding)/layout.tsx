import { GeometricPattern } from "@/components/onboarding/geometric-pattern";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-1 items-center justify-center p-4">
      <GeometricPattern />
      <div className="relative z-10 w-full max-w-lg">{children}</div>
    </div>
  );
}
