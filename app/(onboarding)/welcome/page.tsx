import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/dal";
import { WelcomeCard } from "@/components/onboarding/onboarding-cards";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const user = await requireUser();
  return (
    <WelcomeCard
      firstName={user.firstName}
      institution={user.institution?.name ?? "your school"}
    />
  );
}
