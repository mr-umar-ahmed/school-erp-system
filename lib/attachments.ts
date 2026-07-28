import "server-only";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/auth/dal";
import { MAX_ATTACHMENTS, parseStoredFileUrl, storedFileUrl } from "@/lib/uploads";

/**
 * Validate attachment URLs sent from a client before persisting them on a
 * record: each must be a stored file that this user uploaded in their own
 * institution. Returns canonical URLs rebuilt from the database (the display
 * name in the query string is untrusted input).
 */
export async function verifyOwnAttachments(
  user: CurrentUser,
  urls: string[]
): Promise<{ urls: string[] } | { error: string }> {
  const unique = [...new Set(urls)];
  if (unique.length === 0) return { urls: [] };
  if (unique.length > MAX_ATTACHMENTS) {
    return { error: `You can attach up to ${MAX_ATTACHMENTS} files` };
  }
  const ids: string[] = [];
  for (const url of unique) {
    const parsed = parseStoredFileUrl(url);
    if (!parsed) return { error: "Invalid attachment" };
    ids.push(parsed.id);
  }
  const files = await prisma.storedFile.findMany({
    where: {
      id: { in: ids },
      institutionId: user.institutionId ?? "",
      uploaderId: user.id,
    },
    select: { id: true, name: true },
  });
  if (files.length !== ids.length) return { error: "Invalid attachment" };
  const byId = new Map(files.map((f) => [f.id, f.name]));
  return { urls: ids.map((id) => storedFileUrl(id, byId.get(id) ?? "attachment")) };
}
