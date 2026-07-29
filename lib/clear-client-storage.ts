/**
 * Wipes everything this browser holds for the signed-in user before the
 * session cookie is destroyed. On shared school devices the next person must
 * not be able to read the previous user's pages out of the cache.
 */
export async function clearClientStorage(): Promise<void> {
  if (typeof window === "undefined") return;

  // Ask the service worker to drop its caches, and clear them from here too
  // in case no worker is controlling this page yet.
  try {
    navigator.serviceWorker?.controller?.postMessage("clear-caches");
  } catch {
    // no controller — the direct cache clear below still runs
  }

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // Storage may be unavailable (private mode); nothing was persisted then.
  }
}
