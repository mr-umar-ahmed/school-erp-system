"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, GraduationCap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebarStore } from "@/stores/sidebar-store";
import { getNavForRole, type NavSection } from "@/lib/navigation";
import type { UserRole } from "@/lib/generated/prisma/enums";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  // Exact match for area roots so "/admin" doesn't stay lit on subpages.
  const isAreaRoot = href.split("/").filter(Boolean).length === 1;
  return isAreaRoot ? pathname === href : pathname.startsWith(href);
}

function NavLinks({
  sections,
  collapsed,
  pathname,
  onNavigate,
  layoutKey = "sidebar-active",
}: {
  sections: NavSection[];
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
  layoutKey?: string;
}) {
  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
      {sections.map((section, i) => (
        <div key={section.label ?? i}>
          {section.label && !collapsed && (
            <p className="px-3 pb-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              {section.label}
            </p>
          )}
          <ul className="space-y-1">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              const link = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                    collapsed && "justify-center px-2"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId={layoutKey}
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary to-success shadow-md shadow-primary/25"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <item.icon className="relative z-10 size-5 shrink-0" />
                  {!collapsed && (
                    <span className="relative z-10 truncate">{item.label}</span>
                  )}
                </Link>
              );
              return (
                <li key={item.href}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebarStore();
  const sections = getNavForRole(role);

  return (
    <aside
      className={cn(
        "glass sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border transition-[width] duration-300 lg:flex",
        collapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2.5 px-4 py-5",
          collapsed && "justify-center px-2"
        )}
      >
        <span className="glass-icon flex size-10 shrink-0 items-center justify-center rounded-xl">
          <GraduationCap className="size-5" />
        </span>
        {!collapsed && (
          <span className="font-heading text-lg font-extrabold">{APP_NAME}</span>
        )}
      </div>

      <NavLinks sections={sections} collapsed={collapsed} pathname={pathname} />

      <button
        onClick={toggleCollapsed}
        className="m-3 flex items-center justify-center gap-2 rounded-2xl border border-sidebar-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronsRight className="size-4" />
        ) : (
          <>
            <ChevronsLeft className="size-4" />
            Collapse
          </>
        )}
      </button>
    </aside>
  );
}

/** Drawer variant used by the header hamburger on tablet/mobile. */
export function SidebarDrawerContent({
  role,
  onNavigate,
}: {
  role: UserRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sections = getNavForRole(role);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <span className="glass-icon flex size-10 items-center justify-center rounded-xl">
          <GraduationCap className="size-5" />
        </span>
        <span className="font-heading text-lg font-extrabold">{APP_NAME}</span>
      </div>
      <NavLinks
        sections={sections}
        collapsed={false}
        pathname={pathname}
        onNavigate={onNavigate}
        layoutKey="sidebar-drawer-active"
      />
    </div>
  );
}
