import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  ClipboardCheck,
  CalendarDays,
  FileSpreadsheet,
  Wallet,
  Bus,
  BookOpen,
  Building2,
  HandCoins,
  Megaphone,
  BarChart3,
  Boxes,
  DoorOpen,
  Settings,
  GraduationCap,
  NotebookPen,
  ClipboardList,
  CalendarClock,
  MessageSquare,
  CircleUser,
  Baby,
} from "lucide-react";
import type { UserRole } from "@/lib/generated/prisma/enums";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

const ADMIN_NAV: NavSection[] = [
  {
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "People",
    items: [
      { label: "Students", href: "/admin/students", icon: GraduationCap },
      { label: "Teachers", href: "/admin/teachers", icon: Users },
      { label: "Staff", href: "/admin/staff", icon: BriefcaseBusiness },
    ],
  },
  {
    label: "Academics",
    items: [
      { label: "Attendance", href: "/admin/attendance", icon: ClipboardCheck },
      { label: "Timetable", href: "/admin/timetable", icon: CalendarDays },
      {
        label: "Examinations",
        href: "/admin/examinations",
        icon: FileSpreadsheet,
      },
      { label: "Assignments", href: "/admin/assignments", icon: NotebookPen },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Fees", href: "/admin/fees", icon: Wallet },
      { label: "HR & Payroll", href: "/admin/hr-payroll", icon: HandCoins },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Campus",
    items: [
      { label: "Transport", href: "/admin/transport", icon: Bus },
      { label: "Library", href: "/admin/library", icon: BookOpen },
      { label: "Hostel", href: "/admin/hostel", icon: Building2 },
      { label: "Inventory", href: "/admin/inventory", icon: Boxes },
      { label: "Visitors", href: "/admin/visitors", icon: DoorOpen },
    ],
  },
  {
    label: "Organisation",
    items: [
      {
        label: "Communication",
        href: "/admin/communication",
        icon: Megaphone,
      },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

const TEACHER_NAV: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
      { label: "My Classes", href: "/teacher/my-classes", icon: Users },
      {
        label: "Attendance",
        href: "/teacher/attendance",
        icon: ClipboardCheck,
      },
      {
        label: "Assignments",
        href: "/teacher/assignments",
        icon: NotebookPen,
      },
      { label: "Gradebook", href: "/teacher/gradebook", icon: ClipboardList },
      { label: "Timetable", href: "/teacher/timetable", icon: CalendarDays },
      { label: "Leave", href: "/teacher/leave", icon: CalendarClock },
      {
        label: "Messages",
        href: "/teacher/communication",
        icon: MessageSquare,
      },
      { label: "Profile", href: "/teacher/profile", icon: CircleUser },
    ],
  },
];

const STUDENT_NAV: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/student", icon: LayoutDashboard },
      { label: "Timetable", href: "/student/timetable", icon: CalendarDays },
      {
        label: "Attendance",
        href: "/student/attendance",
        icon: ClipboardCheck,
      },
      {
        label: "Assignments",
        href: "/student/assignments",
        icon: NotebookPen,
      },
      { label: "Results", href: "/student/results", icon: FileSpreadsheet },
      { label: "Fees", href: "/student/fees", icon: Wallet },
      { label: "Library", href: "/student/library", icon: BookOpen },
      { label: "Transport", href: "/student/transport", icon: Bus },
      {
        label: "Announcements",
        href: "/student/announcements",
        icon: Megaphone,
      },
      { label: "Profile", href: "/student/profile", icon: CircleUser },
    ],
  },
];

const PARENT_NAV: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
      { label: "Children", href: "/parent/children", icon: Baby },
      {
        label: "Attendance",
        href: "/parent/attendance",
        icon: ClipboardCheck,
      },
      { label: "Results", href: "/parent/results", icon: FileSpreadsheet },
      { label: "Fees", href: "/parent/fees", icon: Wallet },
      { label: "Transport", href: "/parent/transport", icon: Bus },
      {
        label: "Messages",
        href: "/parent/communication",
        icon: MessageSquare,
      },
      { label: "Profile", href: "/parent/profile", icon: CircleUser },
    ],
  },
];

export function getNavForRole(role: UserRole): NavSection[] {
  switch (role) {
    case "super_admin":
    case "admin":
    case "staff":
      return ADMIN_NAV;
    case "teacher":
      return TEACHER_NAV;
    case "student":
      return STUDENT_NAV;
    case "parent":
      return PARENT_NAV;
  }
}

/** First five destinations become the mobile bottom tab bar. */
export function getBottomNavForRole(role: UserRole): NavItem[] {
  const flat = getNavForRole(role).flatMap((section) => section.items);
  const profile = flat.find((item) => item.href.endsWith("/profile"));
  const first = flat.slice(0, profile ? 4 : 5);
  return profile ? [...first, profile] : first;
}
