"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ImportSummary } from "@/lib/validations/import";

export type ImportAction = (
  formData: FormData
) => Promise<{ error: string } | { summary: ImportSummary }>;

/**
 * Upload an .xlsx/.csv, run it through a server import action, and show a
 * per-row result report. Shared by student, teacher and marks imports.
 */
export function ImportDialog({
  title,
  description,
  templateHref,
  action,
  extraFields,
  triggerLabel = "Import from Excel",
  triggerVariant = "outline",
  disabled,
}: {
  title: string;
  description: string;
  templateHref: string;
  action: ImportAction;
  /** Extra values posted alongside the file (e.g. examScheduleId). */
  extraFields?: Record<string, string>;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline";
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setSummary(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const run = () => {
    if (!file) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      for (const [key, value] of Object.entries(extraFields ?? {})) {
        formData.append(key, value);
      }
      const result = await action(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setSummary(result.summary);
      if (result.summary.imported > 0) {
        toast.success(`Imported ${result.summary.imported} record(s)`);
        router.refresh();
      } else {
        toast.error("Nothing was imported — see the report below");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          className="rounded-full"
          disabled={disabled}
        >
          <FileSpreadsheet className="size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ol className="space-y-3 text-sm">
          <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/60 p-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            <span className="flex-1">
              Download the template and fill in your rows.
            </span>
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <a href={templateHref} download>
                <Download className="size-4" />
                Template
              </a>
            </Button>
          </li>
          <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/60 p-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            <span className="flex-1">
              {file ? (
                <span className="font-semibold">{file.name}</span>
              ) : (
                "Choose your filled .xlsx or .csv file."
              )}
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.csv"
              hidden
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setSummary(null);
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => inputRef.current?.click()}
              disabled={isPending}
            >
              <Upload className="size-4" />
              {file ? "Change file" : "Choose file"}
            </Button>
          </li>
        </ol>

        <Button
          onClick={run}
          disabled={!file || isPending}
          className="rounded-full"
        >
          {isPending ? "Importing..." : "Start Import"}
        </Button>

        {summary && (
          <div className="space-y-3 rounded-2xl bg-card/80 p-4">
            <div className="flex flex-wrap gap-4 text-sm font-semibold">
              <span className="flex items-center gap-1.5 text-success">
                <CheckCircle2 className="size-4" />
                {summary.imported} imported
              </span>
              {summary.skipped > 0 && (
                <span className="flex items-center gap-1.5 text-destructive">
                  <AlertTriangle className="size-4" />
                  {summary.skipped} skipped
                </span>
              )}
            </div>
            {summary.unknownHeaders.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Ignored unknown column(s): {summary.unknownHeaders.join(", ")}
              </p>
            )}
            {summary.errors.length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded-xl border border-border/60">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-secondary">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Record</th>
                      <th className="px-3 py-2">Problem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.errors.map((e) => (
                      <tr
                        key={`${e.row}-${e.message}`}
                        className="border-t border-border/50"
                      >
                        <td className="px-3 py-1.5 tabular-nums">{e.row}</td>
                        <td className="px-3 py-1.5">{e.identifier}</td>
                        <td className="px-3 py-1.5 text-destructive">
                          {e.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Fix the listed rows in your file and import again — records that
              already imported are skipped as duplicates.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
