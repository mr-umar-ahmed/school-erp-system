import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { TimetableGrid } from "@/components/shared/timetable-grid";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";

export const metadata: Metadata = { title: "My Timetable" };

export default async function TeacherTimetablePage() {
  const user = await requireRole(["teacher"]);
  const slots = await prisma.timetableSlot.findMany({
    where: { teacherId: user.id },
    include: {
      subject: true,
      section: { include: { schoolClass: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">My Timetable</h1>
      <GlassmorphicCard>
        <TimetableGrid
          slots={slots.map((s) => ({
            id: s.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            subject: s.subject.name,
            detail: `${s.section.schoolClass.name}-${s.section.name}`,
            room: s.roomNumber,
          }))}
        />
      </GlassmorphicCard>
    </div>
  );
}
