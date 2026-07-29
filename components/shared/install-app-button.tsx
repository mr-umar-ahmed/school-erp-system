"use client";

import { useState } from "react";
import { Loader2, MonitorDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InstallHelpDialog } from "@/components/shared/install-help-dialog";
import {
  useInstallPrompt,
  type InstallBlocker,
} from "@/hooks/use-install-prompt";

/**
 * Always-available install entry point in the header — the banner is
 * dismissible and its prompt event is single-use, so without this there is no
 * way back to the installer.
 */
export function InstallAppButton() {
  const { ios, standalone, status, canInstall, diagnose, install } =
    useInstallPrompt();
  const [showHelp, setShowHelp] = useState(false);
  const [blocker, setBlocker] = useState<InstallBlocker>(null);

  // Hide once the app is running installed; nothing left to offer.
  if (standalone || status === "installed") return null;

  const busy = status === "prompting";

  const onClick = async () => {
    if (ios || !canInstall) {
      setBlocker(await diagnose());
      setShowHelp(true);
      return;
    }
    const outcome = await install();
    if (outcome === "accepted") {
      toast.success("Installing EduNexus — check your home screen or app list");
    } else if (outcome === "unavailable") {
      setBlocker(await diagnose());
      setShowHelp(true);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={onClick}
        disabled={busy}
        aria-label="Install app"
        title="Install EduNexus"
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <MonitorDown className="size-5" />
        )}
      </Button>
      <InstallHelpDialog
        open={showHelp}
        onOpenChange={setShowHelp}
        blocker={blocker}
        ios={ios}
      />
    </>
  );
}
