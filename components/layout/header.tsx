"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  UserRound,
  WifiOff,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  NotificationBell,
  type NotificationItem,
} from "@/components/shared/notification-bell";
import { InstallAppButton } from "@/components/shared/install-app-button";
import { SidebarDrawerContent } from "@/components/layout/sidebar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { logout } from "@/features/auth/actions";
import { clearClientStorage } from "@/lib/clear-client-storage";
import { getNavForRole } from "@/lib/navigation";
import { ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/lib/generated/prisma/enums";

export interface HeaderUser {
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl: string | null;
  profileHref: string;
}

export function Header({
  user,
  notifications,
}: {
  user: HeaderUser;
  notifications: NotificationItem[];
}) {
  const router = useRouter();
  const online = useOnlineStatus();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [, startTransition] = useTransition();

  const navItems = getNavForRole(user.role).flatMap((s) => s.items);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <header className="glass sticky top-0 z-40 flex items-center gap-2 border-b border-border px-4 py-3">
      {/* Tablet / mobile nav drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="glass-strong w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarDrawerContent
            role={user.role}
            onNavigate={() => setDrawerOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="hidden md:block">
        <Breadcrumbs />
      </div>

      <div className="flex-1" />

      {!online && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">
          <WifiOff className="size-3.5" />
          Offline
        </span>
      )}

      <Button
        variant="outline"
        className="hidden w-56 justify-start gap-2 rounded-full text-muted-foreground sm:flex"
        onClick={() => setSearchOpen(true)}
      >
        <Search className="size-4" />
        <span className="flex-1 text-left text-sm">Search...</span>
        <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
          Ctrl K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full sm:hidden"
        onClick={() => setSearchOpen(true)}
        aria-label="Search"
      >
        <Search className="size-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
      >
        <Sun className="size-5 dark:hidden" />
        <Moon className="hidden size-5 dark:block" />
      </Button>

      <InstallAppButton />

      <NotificationBell notifications={notifications} />

      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <UserAvatar
            firstName={user.firstName}
            lastName={user.lastName}
            avatarUrl={user.avatarUrl}
            className="size-9"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass-strong w-56 rounded-2xl">
          <DropdownMenuLabel>
            <p className="font-bold">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              {ROLE_LABELS[user.role]}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push(user.profileHref)}>
            <UserRound className="size-4" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() =>
              startTransition(async () => {
                // Purge cached pages before the session goes away.
                await clearClientStorage();
                await logout();
              })
            }
          >
            <LogOut className="size-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Jump to a module..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {navItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  setSearchOpen(false);
                  router.push(item.href);
                }}
              >
                <item.icon className="size-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
