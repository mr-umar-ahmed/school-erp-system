"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

export function InstallBanner() {
  const { visible, ios, install, dismiss } = useInstallPrompt();
  const [showIosHelp, setShowIosHelp] = useState(false);

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
                onClick={() => (ios ? setShowIosHelp(true) : install())}
              >
                <Download className="size-4" />
                Install Now
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

      <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <DialogContent className="glass-strong rounded-3xl">
          <DialogHeader>
            <DialogTitle>Install EduNexus on iOS</DialogTitle>
            <DialogDescription>
              Safari installs web apps from the Share menu.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="glass-icon flex size-9 shrink-0 items-center justify-center rounded-xl">
                <Share className="size-4" />
              </span>
              1. Tap the <strong>Share</strong> button in Safari
            </li>
            <li className="flex items-center gap-3">
              <span className="glass-icon flex size-9 shrink-0 items-center justify-center rounded-xl">
                <SquarePlus className="size-4" />
              </span>
              2. Choose <strong>Add to Home Screen</strong>
            </li>
            <li className="flex items-center gap-3">
              <span className="glass-icon flex size-9 shrink-0 items-center justify-center rounded-xl">
                <Download className="size-4" />
              </span>
              3. Tap <strong>Add</strong> — EduNexus appears on your home screen
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
