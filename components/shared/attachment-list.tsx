import { Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { isImageAttachment, parseStoredFileUrl } from "@/lib/uploads";

function downloadHref(url: string): string {
  return url.includes("?") ? `${url}&download=1` : `${url}?download=1`;
}

/**
 * Read-only view of stored-file attachments: images render as thumbnails,
 * PDFs as pill links. Safe in server components (no hooks, no handlers).
 */
export function AttachmentList({
  urls,
  className,
}: {
  urls: string[];
  className?: string;
}) {
  const files = urls
    .map((url) => ({ url, meta: parseStoredFileUrl(url) }))
    .filter((f) => f.meta !== null);
  if (files.length === 0) return null;

  const images = files.filter((f) => isImageAttachment(f.meta!.name));
  const docs = files.filter((f) => !isImageAttachment(f.meta!.name));

  return (
    <div className={cn("space-y-2", className)}>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((f) => (
            <a
              key={f.url}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-2xl border border-border/60 transition-transform hover:scale-[1.02]"
              title={f.meta!.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.url}
                alt={f.meta!.name}
                loading="lazy"
                className="size-24 object-cover sm:size-28"
              />
            </a>
          ))}
        </div>
      )}
      {docs.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {docs.map((f) => (
            <li key={f.url}>
              <a
                href={downloadHref(f.url)}
                className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                <FileText className="size-4" />
                <span className="max-w-48 truncate">{f.meta!.name}</span>
                <Download className="size-3.5 opacity-70" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
