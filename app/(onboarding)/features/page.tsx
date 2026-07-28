import type { Metadata } from "next";
import { FeaturesCard } from "@/components/onboarding/onboarding-cards";

export const metadata: Metadata = { title: "Features" };

export default function FeaturesPage() {
  return <FeaturesCard />;
}
