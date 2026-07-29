"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Connectivity is browser state React doesn't own, so it's read through
 * useSyncExternalStore. The server snapshot is `true` — an SSR render can't
 * know, and rendering the offline badge into the HTML would flash it for
 * every online visitor.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  );
}
