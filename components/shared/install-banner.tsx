"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InstallHelpDialog } from "@/components/shared/install-help-dialog";
import {
  useInstallPrompt,
  type InstallBlocker,
} from "@/hooks/use-install-prompt";

export function InstallBanner() {
  const { visible, ios, status, canInstall, diagnose, install, dismiss } =
    useInstallPrompt();
  const [showHelp, setShowHelp] = useState(false);
  const [blocker, setBlocker] = useState<InstallBlocker>(null);

  const openHelp = async () => {
    setBlocker(await diagnose());
    setShowHelp(true);
  };

  const onInstall = async () => {
    if (ios || !canInstall) {
      await openHelp();
      return;
    }
    const outcome = await install();
    if (outcome === "accepted") {
      toast.success("Installing EduNexus — check your home screen or app list");
    } else if (outcome === "dismissed") {
      toast("Install cancelled — you can install any time from the header");
    } else {
      await openHelp();
    }
  };

  const busy = status === "prompting";

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="fixed inset-x-0 top-0 z-50 px-3 pt-3"
          >
            <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-[#1B5E20] p-3 text-primary-foreground shadow-lg shadow-primary/25">
              <span className="text-xl" aria-hidden>
                📲
              </span>
              <p className="flex-1 text-sm font-medium">
                Install EduNexus for a faster, offline-ready experience
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full"
                disabled={busy}
                onClick={onInstall}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {busy ? "Opening..." : "Install Now"}
              </Button>
              <button
                onClick={dismiss}
                aria-label="Maybe later"
                className="rounded-full p-1.5 transition-colors hover:bg-white/15"
              >
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InstallHelpDialog
        open={showHelp}
        onOpenChange={setShowHelp}
        blocker={blocker}
        ios={ios}
      />
    </>
  );
}
