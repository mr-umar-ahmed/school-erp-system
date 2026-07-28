import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { TimetableGrid } from "@/components/shared/timetable-grid";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";

export const metadata: Metadata = { title: "My Timetable" };

export default async function StudentTimetablePage() {
  const user = await requireRole(["student"]);
  if (!user.student?.sectionId) redirect("/student");

  const slots = await prisma.timetableSlot.findMany({
    where: { sectionId: user.student.sectionId },
    include: {
      subject: true,
      teacher: { select: { firstName: true, lastName: true } },
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
            detail: `${s.teacher.firstName} ${s.teacher.lastName}`,
            room: s.roomNumber,
          }))}
        />
      </GlassmorphicCard>
    </div>
  );
}
