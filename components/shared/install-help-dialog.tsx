"use client";

import { CheckCircle2, MonitorDown, Share, SquarePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InstallBlocker } from "@/hooks/use-install-prompt";

function Step({
  index,
  icon,
  children,
}: {
  index: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="glass-icon flex size-9 shrink-0 items-center justify-center rounded-xl">
        {icon}
      </span>
      <span>
        <strong className="mr-1">{index}.</strong>
        {children}
      </span>
    </li>
  );
}

/**
 * Fallback shown whenever the browser's own installer can't be opened — on
 * iOS, on a build with no service worker, or after the user declined the
 * native prompt (the event is single-use, so the button would otherwise be
 * dead until the next page load).
 */
export function InstallHelpDialog({
  open,
  onOpenChange,
  blocker,
  ios,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocker: InstallBlocker;
  ios: boolean;
}) {
  const alreadyInstalled = blocker === "already-installed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong rounded-3xl">
        <DialogHeader>
          <DialogTitle>
            {alreadyInstalled ? "EduNexus is installed" : "Install EduNexus"}
          </DialogTitle>
          <DialogDescription>
            {alreadyInstalled
              ? "You're already running the installed app."
              : ios
                ? "Safari installs web apps from the Share menu."
                : "Add EduNexus to your device for offline access and a full-screen app window."}
          </DialogDescription>
        </DialogHeader>

        {alreadyInstalled ? (
          <p className="flex items-center gap-2 rounded-2xl bg-success/10 p-4 text-sm text-success">
            <CheckCircle2 className="size-4 shrink-0" />
            Launch it from your home screen or app list any time.
          </p>
        ) : ios ? (
          <ol className="space-y-3 text-sm">
            <Step index={1} icon={<Share className="size-4" />}>
              Tap the <strong>Share</strong> button in Safari
            </Step>
            <Step index={2} icon={<SquarePlus className="size-4" />}>
              Choose <strong>Add to Home Screen</strong>
            </Step>
            <Step index={3} icon={<MonitorDown className="size-4" />}>
              Tap <strong>Add</strong> — EduNexus appears on your home screen
            </Step>
          </ol>
        ) : (
          <>
            <ol className="space-y-3 text-sm">
              <Step index={1} icon={<MonitorDown className="size-4" />}>
                Open the browser menu (<strong>⋮</strong> on Chrome / Edge)
              </Step>
              <Step index={2} icon={<SquarePlus className="size-4" />}>
                Choose <strong>Install app</strong> or{" "}
                <strong>Add to Home screen</strong>
              </Step>
              <Step index={3} icon={<CheckCircle2 className="size-4" />}>
                Confirm <strong>Install</strong>
              </Step>
            </ol>
            <p className="rounded-2xl bg-secondary/60 p-3 text-xs text-muted-foreground">
              {blocker === "insecure-context"
                ? "Installing requires HTTPS. Open the site over https:// (or localhost) and try again."
                : blocker === "no-service-worker"
                  ? "The service worker only runs in a production build. Run pnpm build && pnpm start, or use the deployed site."
                  : blocker === "browser-unsupported"
                    ? "This browser doesn't support installing web apps. Chrome, Edge or Safari will work."
                    : "If you don't see the install option, reload the page once — the browser needs a moment to verify the app."}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
