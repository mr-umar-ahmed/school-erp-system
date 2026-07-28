import type { Metadata } from "next";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { getSectionOptions } from "@/features/academics/queries";
import { SectionDatePicker } from "@/components/forms/section-date-picker";
import {
  TimetableSlotForm,
  DeleteSlotButton,
} from "@/components/forms/timetable-slot-form";
import { TimetableGrid } from "@/components/shared/timetable-grid";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Timetable Builder" };

export default async function AdminTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);
  const params = await searchParams;

  const sections = await getSectionOptions(institutionId);
  const sectionId =
    params.section && sections.some((s) => s.id === params.section)
      ? params.section
      : sections[0]?.id;
  const selectedSection = sections.find((s) => s.id === sectionId);

  const [slots, classSubjects, teachers] = sectionId
    ? await Promise.all([
        prisma.timetableSlot.findMany({
          where: { sectionId },
          include: {
            subject: true,
            teacher: { select: { firstName: true, lastName: true } },
          },
        }),
        prisma.classSubject.findMany({
          where: { classId: selectedSection!.classId },
          include: { subject: true },
        }),
        prisma.user.findMany({
          where: { institutionId, role: "teacher", isActive: true },
          select: { id: true, firstName: true, lastName: true },
          orderBy: { firstName: "asc" },
        }),
      ])
    : [[], [], []];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Timetable Builder</h1>
          <p className="text-sm text-muted-foreground">
            Add periods per section — teacher, section and room conflicts are
            detected automatically.
          </p>
        </div>
        <SectionDatePicker
          sections={sections.map((s) => ({ id: s.id, label: s.label }))}
          selectedSection={sectionId}
          showDate={false}
        />
      </div>

      {!sectionId ? (
        <EmptyState title="Create classes & sections first" />
      ) : (
        <>
          <GlassmorphicCard>
            <h2 className="mb-3 text-lg">
              Add Period — {selectedSection?.label}
            </h2>
            <TimetableSlotForm
              sectionId={sectionId}
              subjects={classSubjects.map((cs) => ({
                id: cs.subjectId,
                name: cs.subject.name,
              }))}
              teachers={teachers.map((t) => ({
                id: t.id,
                name: `${t.firstName} ${t.lastName}`,
              }))}
            />
          </GlassmorphicCard>

          <GlassmorphicCard>
            <h2 className="mb-4 text-lg">Weekly Schedule</h2>
            <TimetableGrid
              slots={slots.map((s) => ({
                id: s.id,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                subject: s.subject.name,
                detail: `${s.teacher.firstName} ${s.teacher.lastName}`,
                room: s.roomNumber,
              }))}
              renderSlotExtra={(slot) => <DeleteSlotButton slotId={slot.id} />}
            />
          </GlassmorphicCard>
        </>
      )}
    </div>
  );
}
