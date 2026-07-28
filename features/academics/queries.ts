import "server-only";
import { prisma } from "@/lib/prisma";

/** All sections of an institution as select options ("Class 1 — A"). */
export async function getSectionOptions(institutionId: string) {
  const sections = await prisma.section.findMany({
    where: { schoolClass: { institutionId } },
    include: { schoolClass: true },
    orderBy: [{ schoolClass: { numericOrder: "asc" } }, { name: "asc" }],
  });
  return sections.map((s) => ({
    id: s.id,
    label: `${s.schoolClass.name} — ${s.name}`,
    classId: s.classId,
    className: s.schoolClass.name,
    sectionName: s.name,
  }));
}
