"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStudent, updateStudent } from "@/features/students/actions";
import {
  studentFormSchema,
  type StudentFormInput,
} from "@/lib/validations/student";

export interface SectionOption {
  id: string;
  label: string; // "Class 10 — A"
}

export function StudentForm({
  sections,
  studentId,
  defaults,
}: {
  sections: SectionOption[];
  studentId?: string;
  defaults?: Partial<StudentFormInput>;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register: field,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentFormInput>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: defaults,
  });

  const onSubmit = (data: StudentFormInput) => {
    startTransition(async () => {
      const result = studentId
        ? await updateStudent(studentId, data)
        : await createStudent(data);
      if (result?.error) toast.error(result.error);
      if (result?.success) toast.success(result.success);
    });
  };

  const err = (key: keyof StudentFormInput) =>
    errors[key] && (
      <p className="text-sm text-destructive">{errors[key]?.message}</p>
    );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="glass-strong space-y-5 rounded-3xl p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name *</Label>
          <Input id="firstName" {...field("firstName")} />
          {err("firstName")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name *</Label>
          <Input id="lastName" {...field("lastName")} />
          {err("lastName")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            disabled={!!studentId}
            {...field("email")}
          />
          {err("email")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...field("phone")} />
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select
            value={watch("gender") ?? ""}
            onValueChange={(v) =>
              setValue("gender", v as StudentFormInput["gender"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input id="dateOfBirth" type="date" {...field("dateOfBirth")} />
        </div>
        <div className="space-y-2">
          <Label>Class &amp; Section *</Label>
          <Select
            value={watch("sectionId") ?? ""}
            onValueChange={(v) => setValue("sectionId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class & section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {err("sectionId")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rollNumber">Roll number</Label>
          <Input
            id="rollNumber"
            type="number"
            {...field("rollNumber", {
              setValueAs: (v) =>
                v === "" || v === null || Number.isNaN(Number(v))
                  ? undefined
                  : Number(v),
            })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bloodGroup">Blood group</Label>
          <Input id="bloodGroup" placeholder="O+" {...field("bloodGroup")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContactName">Emergency contact name</Label>
          <Input
            id="emergencyContactName"
            {...field("emergencyContactName")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContactPhone">Emergency contact phone</Label>
          <Input
            id="emergencyContactPhone"
            {...field("emergencyContactPhone")}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" rows={2} {...field("address")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="medicalNotes">Medical notes</Label>
        <Textarea
          id="medicalNotes"
          rows={2}
          placeholder="Allergies, conditions..."
          {...field("medicalNotes")}
        />
      </div>
      <Button type="submit" className="rounded-full" disabled={isPending}>
        <Save className="size-4" />
        {isPending
          ? "Saving..."
          : studentId
            ? "Save Changes"
            : "Enroll Student"}
      </Button>
      {!studentId && (
        <p className="text-xs text-muted-foreground">
          The student signs in with their email and the default password{" "}
          <code className="rounded bg-muted px-1">Student@123</code>.
        </p>
      )}
    </form>
  );
}
