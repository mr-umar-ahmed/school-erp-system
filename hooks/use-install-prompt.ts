"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "edunexus-install-dismissed-at";
const DISMISS_DAYS = 7;

export type InstallStatus = "idle" | "prompting" | "installed" | "declined";

/** Why the native installer can't run — surfaced to the user verbatim. */
export type InstallBlocker =
  | "already-installed"
  | "ios"
  | "insecure-context"
  | "no-service-worker"
  | "browser-unsupported"
  | "not-ready"
  | null;

const STANDALONE_QUERIES = [
  "(display-mode: standalone)",
  "(display-mode: window-controls-overlay)",
];

function subscribeStandalone(onChange: () => void): () => void {
  const lists = STANDALONE_QUERIES.map((q) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener("change", onChange));
  return () => lists.forEach((l) => l.removeEventListener("change", onChange));
}

function isStandaloneSnapshot(): boolean {
  return (
    STANDALONE_QUERIES.some((q) => window.matchMedia(q).matches) ||
    // iOS Safari
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ reports as Mac but exposes touch points.
    (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
  );
}

// The dismissal lives in localStorage, so it is external state too. A tiny
// store lets `dismiss()` notify every mounted consumer (banner + header
// button) without prop-drilling or a setState-in-effect.
const dismissListeners = new Set<() => void>();

function subscribeDismissed(onChange: () => void): () => void {
  dismissListeners.add(onChange);
  return () => {
    dismissListeners.delete(onChange);
  };
}

function wasRecentlyDismissed(): boolean {
  try {
    const at = localStorage.getItem(DISMISS_KEY);
    if (!at) return false;
    return Date.now() - Number(at) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Wraps the `beforeinstallprompt` flow.
 *
 * The event fires once and is consumed by `prompt()`, so the browser installer
 * can only be opened while we hold a live event. Everything else (iOS, an
 * unsupported browser, a dev build with no service worker) is diagnosed on
 * demand by `diagnose()` so the UI can explain itself instead of offering a
 * button that silently does nothing.
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [status, setStatus] = useState<InstallStatus>("idle");

  // Display mode is external browser state, not something React owns.
  const standalone = useSyncExternalStore(
    subscribeStandalone,
    isStandaloneSnapshot,
    () => false // server render: assume browser tab
  );

  const ios = useSyncExternalStore(
    () => () => {},
    isIos,
    () => false
  );

  // Server snapshot is "dismissed" so the banner never renders during SSR and
  // can't cause a hydration mismatch.
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    wasRecentlyDismissed,
    () => true
  );

  useEffect(() => {
    // iOS never fires beforeinstallprompt — Safari installs from Share — so
    // there is nothing to listen for there.
    if (isStandaloneSnapshot() || isIos()) return;

    const handler = (event: Event) => {
      // Keep the event so the button can open the installer on demand.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const installed = () => {
      setDeferredPrompt(null);
      setStatus("installed");
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const visible =
    !standalone &&
    !dismissed &&
    status !== "installed" &&
    (ios || deferredPrompt !== null);

  /** Works out what is stopping the native installer, checked when asked. */
  const diagnose = useCallback(async (): Promise<InstallBlocker> => {
    if (standalone) return "already-installed";
    if (ios) return "ios";
    if (deferredPrompt) return null;
    if (!window.isSecureContext) return "insecure-context";
    if (!("serviceWorker" in navigator)) return "browser-unsupported";
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return "no-service-worker";
    return "not-ready";
  }, [standalone, ios, deferredPrompt]);

  /**
   * Opens the browser installer. Resolves to the outcome so callers can show
   * feedback; "unavailable" means the caller should show manual instructions.
   */
  const install = useCallback(async (): Promise<
    "accepted" | "dismissed" | "unavailable"
  > => {
    if (!deferredPrompt) return "unavailable";
    setStatus("prompting");
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      // The event is single-use whatever the answer.
      setDeferredPrompt(null);
      if (outcome === "accepted") {
        setStatus("installed");
      } else {
        setStatus("declined");
      }
      return outcome;
    } catch {
      setStatus("idle");
      setDeferredPrompt(null);
      return "unavailable";
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage unavailable (private mode) — the banner reappears on the
      // next load, which is the safer failure than never showing it again.
    }
    dismissListeners.forEach((notify) => notify());
  }, []);

  return {
    visible,
    ios,
    standalone,
    status,
    canInstall: deferredPrompt !== null,
    diagnose,
    install,
    dismiss,
  };
}
