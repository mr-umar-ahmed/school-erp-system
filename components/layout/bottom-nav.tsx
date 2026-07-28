"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { getBottomNavForRole } from "@/lib/navigation";
import type { UserRole } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

/** Mobile bottom tab bar (Image 1 style): icons + labels, pill highlight. */
export function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = getBottomNavForRole(role);

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-around">
        {items.map((item) => {
          const isAreaRoot = item.href.split("/").filter(Boolean).length === 1;
          const active = isAreaRoot
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute inset-x-2 top-1 h-8 rounded-full bg-primary/12"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon className="relative z-10 size-5" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
