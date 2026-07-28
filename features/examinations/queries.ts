import "server-only";
import { prisma } from "@/lib/prisma";

export interface ExamReport {
  examId: string;
  examName: string;
  subjects: {
    subject: string;
    marks: number | null;
    total: number;
    grade: string | null;
    isAbsent: boolean;
    passed: boolean;
  }[];
  obtained: number;
  totalMarks: number;
  percentage: number;
}

/** Published exam results for one student, grouped per examination. */
export async function getPublishedResults(
  studentId: string
): Promise<ExamReport[]> {
  const results = await prisma.examResult.findMany({
    where: {
      studentId,
      examSchedule: { examination: { isPublished: true } },
    },
    include: {
      examSchedule: {
        include: { examination: true, subject: true },
      },
    },
    orderBy: { examSchedule: { date: "asc" } },
  });

  const byExam = new Map<string, ExamReport>();
  for (const r of results) {
    const exam = r.examSchedule.examination;
    let report = byExam.get(exam.id);
    if (!report) {
      report = {
        examId: exam.id,
        examName: exam.name,
        subjects: [],
        obtained: 0,
        totalMarks: 0,
        percentage: 0,
      };
      byExam.set(exam.id, report);
    }
    const total = Number(r.examSchedule.totalMarks);
    const marks = r.marksObtained === null ? null : Number(r.marksObtained);
    report.subjects.push({
      subject: r.examSchedule.subject.name,
      marks,
      total,
      grade: r.grade,
      isAbsent: r.isAbsent,
      passed: marks !== null && marks >= Number(r.examSchedule.passingMarks),
    });
    report.totalMarks += total;
    report.obtained += marks ?? 0;
  }
  for (const report of byExam.values()) {
    report.percentage = report.totalMarks
      ? Math.round((report.obtained / report.totalMarks) * 1000) / 10
      : 0;
  }
  return [...byExam.values()];
}
