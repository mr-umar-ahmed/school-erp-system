// Shared upload rules — imported by both client components (accept lists,
// client-side size checks) and server code (validation), so no server-only
// imports here.

/** Vercel caps request bodies at ~4.5MB, so 4MB per file keeps a margin. */
export const MAX_FILE_SIZE = 4 * 1024 * 1024;
export const MAX_ATTACHMENTS = 5;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** Value for the file input `accept` attribute. */
export const UPLOAD_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

export function isAllowedMimeType(type: string): type is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(type);
}

/**
 * Verify the file content actually matches its claimed type (magic bytes),
 * so a renamed .exe can't be stored as a "pdf".
 */
export function sniffMimeType(bytes: Uint8Array): AllowedMimeType | null {
  if (bytes.length < 12) return null;
  // %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Canonical URL for a stored file. The original filename rides along as a
 * query param purely for display — the server serves by id only.
 */
export function storedFileUrl(id: string, name: string): string {
  return `/api/files/${id}?name=${encodeURIComponent(name)}`;
}

/** Parse a stored-file URL back into {id, name}; null if not one of ours. */
export function parseStoredFileUrl(
  url: string
): { id: string; name: string } | null {
  const match = url.match(/^\/api\/files\/([^/?#]+)(?:\?(.*))?$/);
  if (!match) return null;
  const id = match[1];
  if (!UUID_RE.test(id)) return null;
  const params = new URLSearchParams(match[2] ?? "");
  return { id, name: params.get("name") || "attachment" };
}

export function isImageAttachment(name: string): boolean {
  return /\.(jpe?g|png|webp)$/i.test(name);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
