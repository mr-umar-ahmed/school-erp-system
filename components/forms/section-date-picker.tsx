"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SectionDatePicker({
  sections,
  selectedSection,
  date,
  showDate = true,
}: {
  sections: { id: string; label: string }[];
  selectedSection?: string;
  date?: string;
  showDate?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={selectedSection ?? ""}
        onValueChange={(v) => update("section", v)}
      >
        <SelectTrigger className="w-56 rounded-full">
          <SelectValue placeholder="Choose class & section" />
        </SelectTrigger>
        <SelectContent>
          {sections.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showDate && (
        <Input
          type="date"
          className="w-44 rounded-full"
          value={date ?? ""}
          onChange={(e) => update("date", e.target.value)}
        />
      )}
    </div>
  );
}
