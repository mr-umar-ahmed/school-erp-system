import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/dal";
import { RoleIntroCard } from "@/components/onboarding/onboarding-cards";

export const metadata: Metadata = { title: "Your Role" };

export default async function RoleSelectPage() {
  const user = await requireUser();
  return <RoleIntroCard role={user.role} />;
}
