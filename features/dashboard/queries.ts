import "server-only";
import { startOfDay, subDays, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/auth/dal";

/** "HH:mm" for comparisons against timetable slot times. */
export function nowHHmm(): string {
  return format(new Date(), "HH:mm");
}

export function todayDayOfWeek(): number {
  return new Date().getDay();
}

export async function getAdminDashboardData(institutionId: string) {
  const today = startOfDay(new Date());
  const thirtyDaysAgo = subDays(today, 30);

  const [
    totalStudents,
    totalTeachers,
    presentToday,
    studentCountForToday,
    attendanceRows,
    paidPayments,
    pendingFeeAgg,
    announcements,
    upcomingExams,
  ] = await Promise.all([
    prisma.student.count({
      where: { user: { institutionId, isActive: true } },
    }),
    prisma.teacher.count({
      where: { user: { institutionId, isActive: true } },
    }),
    prisma.attendance.count({
      where: {
        institutionId,
        date: today,
        status: { in: ["present", "late", "half_day"] },
        user: { role: "student" },
      },
    }),
    prisma.attendance.count({
      where: { institutionId, date: today, user: { role: "student" } },
    }),
    prisma.attendance.findMany({
      where: {
        institutionId,
        date: { gte: thirtyDaysAgo },
        user: { role: "student" },
      },
      select: { date: true, status: true },
    }),
    prisma.feePayment.findMany({
      where: {
        student: { user: { institutionId } },
        paidDate: { not: null },
      },
      select: { paidDate: true, amountPaid: true },
    }),
    prisma.feePayment.aggregate({
      where: {
        student: { user: { institutionId } },
        status: { in: ["unpaid", "partial", "overdue"] },
      },
      _sum: { amountDue: true, amountPaid: true },
    }),
    prisma.announcement.findMany({
      where: { institutionId },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: 5,
      include: { author: { select: { firstName: true, lastName: true } } },
    }),
    prisma.examination.findMany({
      where: { institutionId, startDate: { gte: today } },
      orderBy: { startDate: "asc" },
      take: 3,
    }),
  ]);

  // Attendance % per day for the trend chart.
  const byDay = new Map<string, { present: number; total: number }>();
  for (const row of attendanceRows) {
    const key = format(row.date, "yyyy-MM-dd");
    const entry = byDay.get(key) ?? { present: 0, total: 0 };
    entry.total += 1;
    if (
      row.status === "present" ||
      row.status === "late" ||
      row.status === "half_day"
    ) {
      entry.present += 1;
    }
    byDay.set(key, entry);
  }
  const attendanceTrend = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { present, total }]) => ({
      date,
      rate: total ? Math.round((present / total) * 100) : 0,
    }));

  // Fee revenue per month (last 6 months).
  const byMonth = new Map<string, number>();
  for (const p of paidPayments) {
    if (!p.paidDate) continue;
    const key = format(p.paidDate, "yyyy-MM");
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(p.amountPaid));
  }
  const revenueByMonth = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({
      month: format(new Date(`${month}-01`), "MMM"),
      amount: Math.round(amount),
    }));

  const monthKey = format(today, "yyyy-MM");
  const collectedThisMonth = Math.round(byMonth.get(monthKey) ?? 0);
  const pendingFees = Math.round(
    Number(pendingFeeAgg._sum.amountDue ?? 0) -
      Number(pendingFeeAgg._sum.amountPaid ?? 0)
  );

  return {
    totalStudents,
    totalTeachers,
    presentToday,
    studentCountForToday,
    attendanceTrend,
    revenueByMonth,
    collectedThisMonth,
    pendingFees,
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      priority: a.priority,
      isPinned: a.isPinned,
      publishedAt: a.publishedAt.toISOString(),
      author: `${a.author.firstName} ${a.author.lastName}`,
    })),
    upcomingExams: upcomingExams.map((e) => ({
      id: e.id,
      name: e.name,
      startDate: e.startDate?.toISOString() ?? null,
    })),
  };
}

export async function getTeacherDashboardData(user: CurrentUser) {
  const dow = todayDayOfWeek();

  const [slots, ungraded, myClasses, announcements, leaveBalance] =
    await Promise.all([
      prisma.timetableSlot.findMany({
        where: { teacherId: user.id, dayOfWeek: dow },
        orderBy: { startTime: "asc" },
        include: {
          subject: true,
          section: { include: { schoolClass: true } },
        },
      }),
      prisma.assignmentSubmission.count({
        where: {
          assignment: { teacherId: user.id },
          marksObtained: null,
        },
      }),
      prisma.classSubject.findMany({
        where: { teacherId: user.id },
        include: { schoolClass: true, subject: true },
      }),
      prisma.announcement.findMany({
        where: {
          institutionId: user.institutionId ?? undefined,
          OR: [
            { targetRoles: { isEmpty: true } },
            { targetRoles: { has: "teacher" } },
          ],
        },
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
        take: 4,
      }),
      prisma.leaveRequest.count({
        where: { userId: user.id, status: "approved" },
      }),
    ]);

  return {
    todaySlots: slots.map((s) => ({
      id: s.id,
      subject: s.subject.name,
      className: `${s.section.schoolClass.name}-${s.section.name}`,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.roomNumber,
    })),
    ungraded,
    myClasses: myClasses.map((c) => ({
      id: c.id,
      className: c.schoolClass.name,
      subject: c.subject.name,
    })),
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      priority: a.priority,
      publishedAt: a.publishedAt.toISOString(),
    })),
    approvedLeaves: leaveBalance,
  };
}

export interface StudentSnapshot {
  studentId: string;
  name: string;
  className: string | null;
  attendancePercent: number;
  todaySlots: {
    id: string;
    subject: string;
    teacher: string;
    startTime: string;
    endTime: string;
    room: string | null;
  }[];
  pendingAssignments: {
    id: string;
    title: string;
    subject: string;
    dueDate: string;
    submitted: boolean;
  }[];
  recentResults: {
    id: string;
    exam: string;
    subject: string;
    marksObtained: number | null;
    totalMarks: number;
    grade: string | null;
  }[];
  feeDue: number;
  announcements: {
    id: string;
    title: string;
    priority: "low" | "medium" | "high" | "urgent";
    publishedAt: string;
  }[];
}

/** Shared by the student dashboard and the parent child view. */
export async function getStudentSnapshot(
  studentId: string
): Promise<StudentSnapshot | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      section: { include: { schoolClass: true } },
    },
  });
  if (!student) return null;

  const dow = todayDayOfWeek();
  const institutionId = student.user.institutionId ?? undefined;

  const [attendanceAgg, presentAgg, slots, assignments, results, feeAgg, announcements] =
    await Promise.all([
      prisma.attendance.count({ where: { userId: student.userId } }),
      prisma.attendance.count({
        where: {
          userId: student.userId,
          status: { in: ["present", "late", "half_day"] },
        },
      }),
      student.sectionId
        ? prisma.timetableSlot.findMany({
            where: { sectionId: student.sectionId, dayOfWeek: dow },
            orderBy: { startTime: "asc" },
            include: {
              subject: true,
              teacher: { select: { firstName: true, lastName: true } },
            },
          })
        : Promise.resolve([]),
      student.section
        ? prisma.assignment.findMany({
            where: {
              classId: student.section.classId,
              OR: [{ sectionId: null }, { sectionId: student.sectionId }],
              dueDate: { gte: subDays(new Date(), 7) },
            },
            orderBy: { dueDate: "asc" },
            take: 6,
            include: {
              subject: true,
              submissions: { where: { studentId: student.id } },
            },
          })
        : Promise.resolve([]),
      prisma.examResult.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          examSchedule: {
            include: { examination: true, subject: true },
          },
        },
      }),
      prisma.feePayment.aggregate({
        where: {
          studentId: student.id,
          status: { in: ["unpaid", "partial", "overdue"] },
        },
        _sum: { amountDue: true, amountPaid: true },
      }),
      prisma.announcement.findMany({
        where: {
          institutionId,
          OR: [
            { targetRoles: { isEmpty: true } },
            { targetRoles: { has: "student" } },
          ],
        },
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
        take: 4,
      }),
    ]);

  return {
    studentId: student.id,
    name: `${student.user.firstName} ${student.user.lastName}`,
    className: student.section
      ? `${student.section.schoolClass.name}-${student.section.name}`
      : null,
    attendancePercent: attendanceAgg
      ? Math.round((presentAgg / attendanceAgg) * 100)
      : 0,
    todaySlots: slots.map((s) => ({
      id: s.id,
      subject: s.subject.name,
      teacher: `${s.teacher.firstName} ${s.teacher.lastName}`,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.roomNumber,
    })),
    pendingAssignments: assignments.map((a) => ({
      id: a.id,
      title: a.title,
      subject: a.subject.name,
      dueDate: a.dueDate.toISOString(),
      submitted: a.submissions.length > 0,
    })),
    recentResults: results.map((r) => ({
      id: r.id,
      exam: r.examSchedule.examination.name,
      subject: r.examSchedule.subject.name,
      marksObtained: r.marksObtained === null ? null : Number(r.marksObtained),
      totalMarks: Number(r.examSchedule.totalMarks),
      grade: r.grade,
    })),
    feeDue: Math.round(
      Number(feeAgg._sum.amountDue ?? 0) - Number(feeAgg._sum.amountPaid ?? 0)
    ),
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      priority: a.priority,
      publishedAt: a.publishedAt.toISOString(),
    })),
  };
}

export async function getChildrenForParent(user: CurrentUser) {
  if (!user.parent) return [];
  const links = await prisma.parentStudent.findMany({
    where: { parentId: user.parent.id },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true } },
          section: { include: { schoolClass: true } },
        },
      },
    },
  });
  return links.map((link) => ({
    studentId: link.student.id,
    name: `${link.student.user.firstName} ${link.student.user.lastName}`,
    className: link.student.section
      ? `${link.student.section.schoolClass.name}-${link.student.section.name}`
      : null,
    relationship: link.relationship,
  }));
}
