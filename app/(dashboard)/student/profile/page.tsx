import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/dal";
import { ProfileCard } from "@/components/shared/profile-card";

export const metadata: Metadata = { title: "My Profile" };

export default async function StudentProfilePage() {
  const user = await requireRole(["student"]);
  return <ProfileCard user={user} />;
}
