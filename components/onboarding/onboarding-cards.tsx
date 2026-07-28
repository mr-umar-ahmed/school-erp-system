"use client";

import { useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Sparkles,
  Wallet,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleIcon } from "@/components/shared/module-icon";
import { completeOnboarding } from "@/features/auth/actions";
import { ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/lib/generated/prisma/enums";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function WelcomeCard({
  firstName,
  institution,
}: {
  firstName: string;
  institution: string;
}) {
  const stats = [
    { label: "Modules", value: "17" },
    { label: "Roles", value: "5" },
    { label: "Offline", value: "Yes" },
    { label: "Installable", value: "PWA" },
  ];
  return (
    <motion.div {...fadeUp} transition={{ duration: 0.35 }} className="glass-strong rounded-3xl p-8 text-center">
      <div className="glass-icon mx-auto flex size-20 items-center justify-center rounded-3xl">
        <GraduationCap className="size-10" />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold">
        Hello, {firstName}! 👋
      </h1>
      <p className="mt-2 text-muted-foreground">
        Welcome to <strong>EduNexus</strong> — the all-in-one workspace for{" "}
        {institution}.
      </p>
      <div className="mt-6 grid grid-cols-4 gap-2">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            {...fadeUp}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="rounded-2xl bg-secondary p-3"
          >
            <p className="text-lg font-extrabold text-primary">{stat.value}</p>
            <p className="text-[10px] font-medium text-muted-foreground">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
      <Button asChild size="lg" className="mt-8 w-full rounded-full">
        <Link href="/features">
          Get Started
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </motion.div>
  );
}

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: ClipboardCheck,
    title: "Attendance in seconds",
    text: "Mark a whole class with one tap and parents get notified automatically.",
  },
  {
    icon: CalendarDays,
    title: "Smart timetables",
    text: "Conflict-free scheduling for classes, teachers and rooms.",
  },
  {
    icon: Wallet,
    title: "Fees without friction",
    text: "Structures, receipts, dues and defaulter reports — all in one place.",
  },
  {
    icon: BellRing,
    title: "Everyone in the loop",
    text: "Announcements, messages and push notifications for every role.",
  },
  {
    icon: WifiOff,
    title: "Works offline",
    text: "Install EduNexus as an app and keep working without internet.",
  },
];

export function FeaturesCard() {
  return (
    <motion.div {...fadeUp} transition={{ duration: 0.35 }} className="glass-strong rounded-3xl p-8">
      <h1 className="text-2xl font-extrabold">Everything your school needs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        A quick look at what you can do.
      </p>
      <ul className="mt-6 space-y-4">
        {FEATURES.map((feature, i) => (
          <motion.li
            key={feature.title}
            {...fadeUp}
            transition={{ delay: 0.08 + i * 0.06 }}
            className="flex items-start gap-4"
          >
            <ModuleIcon icon={feature.icon} />
            <div>
              <p className="font-bold">{feature.title}</p>
              <p className="text-sm text-muted-foreground">{feature.text}</p>
            </div>
          </motion.li>
        ))}
      </ul>
      <Button asChild size="lg" className="mt-8 w-full rounded-full">
        <Link href="/role-select">
          Continue
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </motion.div>
  );
}

const ROLE_BLURBS: Record<UserRole, string> = {
  super_admin:
    "You have full control across every school, module and setting.",
  admin:
    "Manage students, staff, fees, timetables and everything in between.",
  staff: "Handle day-to-day operations for your departments.",
  teacher:
    "Your classes, attendance, assignments and gradebook — all one tap away.",
  student:
    "Track your timetable, assignments, results and fees at a glance.",
  parent:
    "Follow your child's attendance, results and fees, and message teachers.",
};

export function RoleIntroCard({ role }: { role: UserRole }) {
  const [isPending, startTransition] = useTransition();
  return (
    <motion.div {...fadeUp} transition={{ duration: 0.35 }} className="glass-strong rounded-3xl p-8 text-center">
      <div className="glass-icon mx-auto flex size-20 items-center justify-center rounded-3xl">
        <Sparkles className="size-9" />
      </div>
      <p className="mt-6 inline-block rounded-full bg-primary/12 px-4 py-1 text-sm font-bold text-primary">
        {ROLE_LABELS[role]}
      </p>
      <h1 className="mt-3 text-2xl font-extrabold">
        Your dashboard is ready
      </h1>
      <p className="mt-2 text-muted-foreground">{ROLE_BLURBS[role]}</p>
      <Button
        size="lg"
        className="mt-8 w-full rounded-full"
        disabled={isPending}
        onClick={() => startTransition(() => completeOnboarding())}
      >
        {isPending ? "Opening..." : "Go to My Dashboard"}
        <ArrowRight className="size-4" />
      </Button>
    </motion.div>
  );
}
