import "dotenv/config";
import { prisma } from "@/lib/prisma";

const SCHEDULE = "0af48c54-8f26-48ef-ab81-f3b3f79da482";

// Removes every record created while verifying the import/upload features.
async function main() {
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: "uitest." } },
        { email: { contains: "round.two." } },
        { email: { contains: "dupe." } },
      ],
    },
    select: { id: true, email: true },
  });
  const del = await prisma.user.deleteMany({
    where: { id: { in: testUsers.map((u) => u.id) } },
  });
  console.log("deleted test users:", del.count, testUsers.map((u) => u.email).join(", "));

  const marks = await prisma.examResult.deleteMany({ where: { examScheduleId: SCHEDULE } });
  console.log("deleted test exam results:", marks.count);

  const assignments = await prisma.assignment.deleteMany({
    where: { title: { startsWith: "Attachment test" } },
  });
  console.log("deleted test assignments:", assignments.count);

  const files = await prisma.storedFile.deleteMany({
    where: { name: { in: ["homework-ch5.pdf", "dot.png", "probe.png"] } },
  });
  console.log("deleted test stored files:", files.count);

  const audits = await prisma.auditLog.deleteMany({
    where: { action: { in: ["student.bulk_import", "exam.marks_imported"] } },
  });
  console.log("deleted test audit rows:", audits.count);

  console.log("remaining students:", await prisma.student.count());
  console.log("remaining stored files:", await prisma.storedFile.count());
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
