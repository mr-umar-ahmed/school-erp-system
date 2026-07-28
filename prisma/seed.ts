/* EduNexus demo seed — Green Valley International School.
 * Deterministic (faker seeded). Run: pnpm prisma db seed
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type Prisma,
} from "../lib/generated/prisma/client";
import type {
  AttendanceStatus,
  FeeStatus,
  PriorityLevel,
  UserRole,
} from "../lib/generated/prisma/enums";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

faker.seed(42);

const uuid = () => randomUUID();
const pick = <T>(arr: T[]): T => arr[faker.number.int({ min: 0, max: arr.length - 1 })];

// Date helpers (date-only values are stored at UTC midnight)
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const TODAY = new Date();
const todayISO = TODAY.toISOString().slice(0, 10);

function* weekdaysBack(count: number): Generator<Date> {
  const d = new Date(day(todayISO));
  let yielded = 0;
  while (yielded < count) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      yield new Date(d);
      yielded++;
    }
    d.setUTCDate(d.getUTCDate() - 1);
  }
}

async function main() {
  console.log("Clearing existing data...");
  // Delete in dependency order (children first).
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.visitorLog.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.assignmentSubmission.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.payroll.deleteMany(),
    prisma.leaveRequest.deleteMany(),
    prisma.message.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.hostelAllocation.deleteMany(),
    prisma.hostelRoom.deleteMany(),
    prisma.libraryTransaction.deleteMany(),
    prisma.libraryBook.deleteMany(),
    prisma.studentTransport.deleteMany(),
    prisma.transportStop.deleteMany(),
    prisma.transportRoute.deleteMany(),
    prisma.feePayment.deleteMany(),
    prisma.feeStructure.deleteMany(),
    prisma.gradeScale.deleteMany(),
    prisma.examResult.deleteMany(),
    prisma.examSchedule.deleteMany(),
    prisma.examination.deleteMany(),
    prisma.timetableSlot.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.parentStudent.deleteMany(),
    prisma.parent.deleteMany(),
    prisma.student.deleteMany(),
    prisma.teacher.deleteMany(),
    prisma.staff.deleteMany(),
    prisma.classSubject.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.section.deleteMany(),
    prisma.schoolClass.deleteMany(),
    prisma.academicYear.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.user.deleteMany(),
    prisma.institution.deleteMany(),
  ]);

  console.log("Hashing demo passwords...");
  const [adminHash, teacherHash, studentHash, parentHash, staffHash] =
    await Promise.all([
      bcrypt.hash("Admin@123", 10),
      bcrypt.hash("Teacher@123", 10),
      bcrypt.hash("Student@123", 10),
      bcrypt.hash("Parent@123", 10),
      bcrypt.hash("Staff@123", 10),
    ]);

  console.log("Creating institution + academic year...");
  const institutionId = uuid();
  await prisma.institution.create({
    data: {
      id: institutionId,
      name: "Green Valley International School",
      code: "GVIS",
      address: "12 Green Valley Road",
      city: "Bengaluru",
      state: "Karnataka",
      phone: "+91 80 4111 2222",
      email: "office@greenvalley.edu",
      website: "https://greenvalley.edu",
      establishedYear: 1998,
      board: "CBSE",
    },
  });

  const academicYearId = uuid();
  await prisma.academicYear.create({
    data: {
      id: academicYearId,
      institutionId,
      name: "2026-2027",
      startDate: day("2026-04-01"),
      endDate: day("2027-03-31"),
      isCurrent: true,
    },
  });

  console.log("Creating classes, sections, subjects...");
  const classIds: { id: string; name: string; order: number }[] = [];
  for (let i = 1; i <= 10; i++) {
    classIds.push({ id: uuid(), name: `Class ${i}`, order: i });
  }
  await prisma.schoolClass.createMany({
    data: classIds.map((c) => ({
      id: c.id,
      institutionId,
      name: c.name,
      numericOrder: c.order,
    })),
  });

  const SUBJECT_DEFS = [
    ["English", "ENG"],
    ["Hindi", "HIN"],
    ["Mathematics", "MAT"],
    ["Science", "SCI"],
    ["Social Studies", "SST"],
    ["Computer Science", "CS"],
    ["Physics", "PHY"],
    ["Chemistry", "CHE"],
    ["Biology", "BIO"],
    ["History", "HIS"],
    ["Geography", "GEO"],
    ["Art", "ART"],
    ["Music", "MUS"],
    ["Physical Education", "PE"],
    ["Environmental Studies", "EVS"],
  ] as const;
  const subjects = SUBJECT_DEFS.map(([name, code]) => ({
    id: uuid(),
    name,
    code,
  }));
  await prisma.subject.createMany({
    data: subjects.map((s) => ({
      id: s.id,
      institutionId,
      name: s.name,
      code: s.code,
      type: ["ART", "MUS", "PE"].includes(s.code) ? "activity" : "core",
    })),
  });
  const subjByCode = Object.fromEntries(subjects.map((s) => [s.code, s]));

  console.log("Creating users (admin, teachers, staff)...");
  interface SeedUser {
    id: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    gender: "male" | "female";
    phone: string;
  }
  const users: SeedUser[] = [];

  const superAdminId = uuid();
  users.push({
    id: superAdminId,
    role: "super_admin",
    firstName: "Anita",
    lastName: "Desai",
    email: "admin@edunexus.app",
    passwordHash: adminHash,
    gender: "female",
    phone: "+91 98450 00001",
  });

  // 30 teachers; teacher[0] is the demo account.
  const teacherUsers: SeedUser[] = [];
  for (let i = 0; i < 30; i++) {
    const gender = i % 2 === 0 ? "female" : "male";
    const firstName =
      i === 0 ? "Sarah" : faker.person.firstName(gender);
    const lastName = i === 0 ? "Johnson" : faker.person.lastName();
    teacherUsers.push({
      id: uuid(),
      role: "teacher",
      firstName,
      lastName,
      email:
        i === 0
          ? "sarah.johnson@edu.app"
          : `${firstName}.${lastName}.t${i}@edu.app`.toLowerCase(),
      passwordHash: teacherHash,
      gender,
      phone: faker.phone.number({ style: "international" }),
    });
  }
  users.push(...teacherUsers);

  // 10 staff; staff[0] is the demo account.
  const staffUsers: SeedUser[] = [];
  for (let i = 0; i < 10; i++) {
    const gender = i % 2 === 0 ? "female" : "male";
    const firstName = i === 0 ? "Priya" : faker.person.firstName(gender);
    const lastName = i === 0 ? "Sharma" : faker.person.lastName();
    staffUsers.push({
      id: uuid(),
      role: "staff",
      firstName,
      lastName,
      email:
        i === 0
          ? "priya.staff@edu.app"
          : `${firstName}.${lastName}.s${i}@edu.app`.toLowerCase(),
      passwordHash: staffHash,
      gender,
      phone: faker.phone.number({ style: "international" }),
    });
  }
  users.push(...staffUsers);

  console.log("Creating sections...");
  const sectionNames = ["A", "B", "C"];
  const sections: {
    id: string;
    classId: string;
    className: string;
    name: string;
    classOrder: number;
  }[] = [];
  for (const cls of classIds) {
    for (const name of sectionNames) {
      sections.push({
        id: uuid(),
        classId: cls.id,
        className: cls.name,
        name,
        classOrder: cls.order,
      });
    }
  }
  await prisma.user.createMany({
    data: users.map((u) => ({ ...u, institutionId, onboardingCompleted: true })),
  });
  await prisma.section.createMany({
    data: sections.map((s, i) => ({
      id: s.id,
      classId: s.classId,
      name: s.name,
      capacity: 40,
      academicYearId,
      classTeacherId: teacherUsers[i % teacherUsers.length].id,
    })),
  });

  console.log("Creating students + parents...");
  const studentUsers: SeedUser[] = [];
  const students: {
    id: string;
    userId: string;
    sectionId: string;
    classId: string;
    classOrder: number;
    roll: number;
    admissionNo: string;
  }[] = [];
  let admissionCounter = 1;
  const perSection = Math.ceil(500 / sections.length); // ~17
  for (const section of sections) {
    const count = Math.min(
      perSection,
      500 - students.length
    );
    for (let i = 0; i < count; i++) {
      const isAlex =
        section.className === "Class 10" && section.name === "A" && i === 0;
      const gender = faker.number.int({ min: 0, max: 1 }) ? "male" : "female";
      const firstName = isAlex ? "Alex" : faker.person.firstName(gender);
      const lastName = isAlex ? "Kumar" : faker.person.lastName();
      const userId = uuid();
      studentUsers.push({
        id: userId,
        role: "student",
        firstName,
        lastName,
        email: isAlex
          ? "alex.kumar@edu.app"
          : `${firstName}.${lastName}.${admissionCounter}@edu.app`.toLowerCase(),
        passwordHash: studentHash,
        gender,
        phone: faker.phone.number({ style: "international" }),
      });
      students.push({
        id: uuid(),
        userId,
        sectionId: section.id,
        classId: section.classId,
        classOrder: section.classOrder,
        roll: i + 1,
        admissionNo: `GVIS-${String(admissionCounter).padStart(4, "0")}`,
      });
      admissionCounter++;
    }
    if (students.length >= 500) break;
  }

  await prisma.user.createMany({
    data: studentUsers.map((u) => ({
      ...u,
      institutionId,
      onboardingCompleted: true,
      dateOfBirth: faker.date.birthdate({ mode: "age", min: 6, max: 17 }),
    })),
  });
  await prisma.student.createMany({
    data: students.map((s) => ({
      id: s.id,
      userId: s.userId,
      admissionNo: s.admissionNo,
      admissionDate: day("2026-04-01"),
      sectionId: s.sectionId,
      academicYearId,
      rollNumber: s.roll,
      bloodGroup: pick(["A+", "B+", "O+", "AB+", "A-", "O-"]),
      emergencyContactName: faker.person.fullName(),
      emergencyContactPhone: faker.phone.number({ style: "international" }),
    })),
  });

  // 300 parents: first 200 have 2 children, last 100 have 1.
  const parentUsers: SeedUser[] = [];
  const parents: { id: string; userId: string }[] = [];
  const parentLinks: {
    parentId: string;
    studentId: string;
    relationship: string;
    isPrimaryContact: boolean;
  }[] = [];
  let studentIdx = 0;
  for (let i = 0; i < 300 && studentIdx < students.length; i++) {
    const childCount = i < 200 ? 2 : 1;
    const firstChild = students[studentIdx];
    const firstChildUser = studentUsers.find((u) => u.id === firstChild.userId)!;
    const isRajesh = firstChildUser.email === "alex.kumar@edu.app";
    const gender = i % 3 === 0 ? "female" : "male";
    const firstName = isRajesh ? "Rajesh" : faker.person.firstName(gender);
    // Parents share the family name of their first child.
    const lastName = isRajesh ? "Kumar" : firstChildUser.lastName;
    const userId = uuid();
    const parentId = uuid();
    parentUsers.push({
      id: userId,
      role: "parent",
      firstName,
      lastName,
      email: isRajesh
        ? "rajesh.kumar@edu.app"
        : `${firstName}.${lastName}.p${i}@edu.app`.toLowerCase(),
      passwordHash: parentHash,
      gender,
      phone: faker.phone.number({ style: "international" }),
    });
    parents.push({ id: parentId, userId });
    for (let c = 0; c < childCount && studentIdx < students.length; c++) {
      parentLinks.push({
        parentId,
        studentId: students[studentIdx].id,
        relationship: gender === "female" ? "mother" : "father",
        isPrimaryContact: c === 0,
      });
      studentIdx++;
    }
  }
  await prisma.user.createMany({
    data: parentUsers.map((u) => ({
      ...u,
      institutionId,
      onboardingCompleted: true,
    })),
  });
  await prisma.parent.createMany({
    data: parents.map((p) => ({
      id: p.id,
      userId: p.userId,
      occupation: pick([
        "Engineer",
        "Doctor",
        "Business Owner",
        "Government Employee",
        "Designer",
        "Accountant",
      ]),
      annualIncome: faker.number.int({ min: 4, max: 40 }) * 100000,
    })),
  });
  await prisma.parentStudent.createMany({ data: parentLinks });

  console.log("Creating teacher/staff records...");
  const DEPARTMENTS = [
    "Languages",
    "Mathematics",
    "Science",
    "Humanities",
    "Computer Science",
    "Arts & Sports",
  ];
  await prisma.teacher.createMany({
    data: teacherUsers.map((t, i) => ({
      id: uuid(),
      userId: t.id,
      employeeId: `GVT-${String(i + 1).padStart(3, "0")}`,
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      designation: i % 6 === 0 ? "Senior Teacher" : "Teacher",
      qualification: pick(["M.Sc. B.Ed.", "M.A. B.Ed.", "B.Sc. B.Ed.", "M.C.A."]),
      experienceYears: faker.number.int({ min: 2, max: 25 }),
      joiningDate: faker.date.between({
        from: day("2010-06-01"),
        to: day("2025-06-01"),
      }),
      salary: faker.number.int({ min: 35, max: 90 }) * 1000,
    })),
  });
  await prisma.staff.createMany({
    data: staffUsers.map((s, i) => ({
      id: uuid(),
      userId: s.id,
      employeeId: `GVS-${String(i + 1).padStart(3, "0")}`,
      department: pick(["Accounts", "Administration", "Front Office", "Maintenance"]),
      designation: pick(["Accountant", "Clerk", "Receptionist", "Coordinator"]),
      joiningDate: faker.date.between({
        from: day("2012-06-01"),
        to: day("2025-06-01"),
      }),
      salary: faker.number.int({ min: 20, max: 45 }) * 1000,
    })),
  });

  console.log("Assigning class subjects...");
  // Which subjects each class band studies.
  function subjectCodesFor(order: number): string[] {
    if (order <= 5) return ["ENG", "HIN", "MAT", "EVS", "SST", "ART", "PE"];
    if (order <= 8)
      return ["ENG", "HIN", "MAT", "SCI", "SST", "CS", "MUS", "PE"];
    return ["ENG", "HIN", "MAT", "PHY", "CHE", "BIO", "HIS", "GEO", "CS", "PE"];
  }
  // Round-robin teachers per subject so each subject has a stable pool.
  const teacherPool = new Map<string, string[]>();
  subjects.forEach((s, i) => {
    teacherPool.set(
      s.code,
      [0, 1, 2].map((k) => teacherUsers[(i * 2 + k * 7) % teacherUsers.length].id)
    );
  });
  const classSubjects: {
    id: string;
    classId: string;
    subjectId: string;
    teacherId: string;
    code: string;
  }[] = [];
  for (const cls of classIds) {
    const codes = subjectCodesFor(cls.order);
    for (const code of codes) {
      const poolForSubject = teacherPool.get(code)!;
      classSubjects.push({
        id: uuid(),
        classId: cls.id,
        subjectId: subjByCode[code].id,
        teacherId: poolForSubject[cls.order % poolForSubject.length],
        code,
      });
    }
  }
  await prisma.classSubject.createMany({
    data: classSubjects.map((cs) => ({
      id: cs.id,
      classId: cs.classId,
      subjectId: cs.subjectId,
      teacherId: cs.teacherId,
      academicYearId,
    })),
  });

  console.log("Building conflict-free timetable...");
  const PERIODS: [string, string][] = [
    ["08:00", "08:50"],
    ["09:00", "09:50"],
    ["10:10", "11:00"],
    ["11:10", "12:00"],
    ["12:30", "13:20"],
  ];
  const slotRows: Prisma.TimetableSlotCreateManyInput[] = [];
  for (let dow = 1; dow <= 5; dow++) {
    const busy = new Set<string>(); // teacherId|period
    for (const section of sections) {
      const csList = classSubjects.filter((cs) => cs.classId === section.classId);
      // Rotate the subject order per day/section for variety.
      const rotated = [...csList.slice(dow % csList.length), ...csList.slice(0, dow % csList.length)];
      let periodIdx = 0;
      for (const cs of rotated) {
        if (periodIdx >= PERIODS.length) break;
        const key = `${cs.teacherId}|${periodIdx}`;
        if (busy.has(key)) continue; // teacher already booked this period
        busy.add(key);
        slotRows.push({
          id: uuid(),
          institutionId,
          sectionId: section.id,
          subjectId: cs.subjectId,
          teacherId: cs.teacherId,
          dayOfWeek: dow,
          startTime: PERIODS[periodIdx][0],
          endTime: PERIODS[periodIdx][1],
          roomNumber: `${section.classOrder}0${sectionNames.indexOf(section.name) + 1}`,
          academicYearId,
        });
        periodIdx++;
      }
    }
  }
  await prisma.timetableSlot.createMany({ data: slotRows });

  console.log("Seeding attendance (30 school days)...");
  const attendanceRows: Prisma.AttendanceCreateManyInput[] = [];
  const days = [...weekdaysBack(22)];
  const statusFor = (): AttendanceStatus => {
    const r = faker.number.int({ min: 1, max: 100 });
    if (r <= 91) return "present";
    if (r <= 95) return "absent";
    if (r <= 97) return "late";
    if (r <= 99) return "half_day";
    return "excused";
  };
  for (const d of days) {
    for (const s of students) {
      const status = statusFor();
      attendanceRows.push({
        institutionId,
        userId: s.userId,
        date: d,
        status,
        checkInTime: status === "late" ? "08:35" : status === "absent" ? null : "07:55",
        markedById: teacherUsers[0].id,
        academicYearId,
      });
    }
    for (const t of teacherUsers) {
      attendanceRows.push({
        institutionId,
        userId: t.id,
        date: d,
        status: faker.number.int({ min: 1, max: 100 }) <= 96 ? "present" : "absent",
        checkInTime: "07:40",
        academicYearId,
      });
    }
  }
  // Batch inserts to keep packets small.
  for (let i = 0; i < attendanceRows.length; i += 2000) {
    await prisma.attendance.createMany({
      data: attendanceRows.slice(i, i + 2000),
    });
  }

  console.log("Creating grade scale + examinations...");
  const GRADES: [string, number, number, number][] = [
    ["A+", 90, 100, 10],
    ["A", 80, 89.99, 9],
    ["B+", 70, 79.99, 8],
    ["B", 60, 69.99, 7],
    ["C+", 50, 59.99, 6],
    ["C", 40, 49.99, 5],
    ["D", 33, 39.99, 4],
    ["F", 0, 32.99, 0],
  ];
  await prisma.gradeScale.createMany({
    data: GRADES.map(([grade, min, max, point], i) => ({
      institutionId,
      grade,
      minPercent: min,
      maxPercent: max,
      gradePoint: point,
      sortOrder: i,
    })),
  });
  const gradeFor = (pct: number) =>
    GRADES.find(([, min]) => pct >= min)?.[0] ?? "F";

  const exams = [
    {
      id: uuid(),
      name: "Unit Test 1",
      type: "unit_test" as const,
      start: "2026-06-15",
      end: "2026-06-20",
      published: true,
      totalMarks: 50,
      passing: 17,
    },
    {
      id: uuid(),
      name: "Unit Test 2",
      type: "unit_test" as const,
      start: "2026-08-17",
      end: "2026-08-22",
      published: false,
      totalMarks: 50,
      passing: 17,
    },
    {
      id: uuid(),
      name: "Midterm Examination",
      type: "midterm" as const,
      start: "2026-09-21",
      end: "2026-09-30",
      published: false,
      totalMarks: 100,
      passing: 33,
    },
  ];
  await prisma.examination.createMany({
    data: exams.map((e) => ({
      id: e.id,
      institutionId,
      name: e.name,
      type: e.type,
      academicYearId,
      startDate: day(e.start),
      endDate: day(e.end),
      isPublished: e.published,
    })),
  });

  const examScheduleRows: Prisma.ExamScheduleCreateManyInput[] = [];
  const resultRows: Prisma.ExamResultCreateManyInput[] = [];
  for (const exam of exams) {
    for (const cls of classIds) {
      const codes = subjectCodesFor(cls.order).filter((c) => c !== "PE").slice(0, 5);
      codes.forEach((code, i) => {
        const scheduleId = uuid();
        const date = new Date(day(exam.start));
        date.setUTCDate(date.getUTCDate() + i);
        examScheduleRows.push({
          id: scheduleId,
          examinationId: exam.id,
          classId: cls.id,
          subjectId: subjByCode[code].id,
          date,
          startTime: "09:00",
          endTime: exam.type === "midterm" ? "12:00" : "10:30",
          totalMarks: exam.totalMarks,
          passingMarks: exam.passing,
          roomNumber: `${cls.order}01`,
        });
        if (exam.published) {
          const classStudents = students.filter((s) => s.classId === cls.id);
          for (const st of classStudents) {
            const absent = faker.number.int({ min: 1, max: 100 }) <= 3;
            const pct = faker.number.int({ min: 30, max: 99 });
            const marks = absent
              ? null
              : Math.round((pct / 100) * exam.totalMarks * 2) / 2;
            resultRows.push({
              examScheduleId: scheduleId,
              studentId: st.id,
              marksObtained: marks,
              grade: absent ? null : gradeFor(pct),
              isAbsent: absent,
            });
          }
        }
      });
    }
  }
  await prisma.examSchedule.createMany({ data: examScheduleRows });
  for (let i = 0; i < resultRows.length; i += 2000) {
    await prisma.examResult.createMany({ data: resultRows.slice(i, i + 2000) });
  }

  console.log("Creating fee structures + payments...");
  const feeStructures: { id: string; classId: string; amount: number }[] = [];
  for (const cls of classIds) {
    feeStructures.push({
      id: uuid(),
      classId: cls.id,
      amount: 2000 + cls.order * 150,
    });
  }
  await prisma.feeStructure.createMany({
    data: feeStructures.map((f) => {
      const cls = classIds.find((c) => c.id === f.classId)!;
      return {
        id: f.id,
        institutionId,
        name: `Tuition Fee — ${cls.name}`,
        classId: f.classId,
        amount: f.amount,
        frequency: "monthly",
        academicYearId,
        dueDay: 10,
        lateFeePerDay: 20,
      };
    }),
  });

  const MONTHS = ["2026-04", "2026-05", "2026-06", "2026-07"];
  const feeRows: Prisma.FeePaymentCreateManyInput[] = [];
  let receiptCounter = 1;
  for (const st of students) {
    const fs = feeStructures.find((f) => f.classId === st.classId)!;
    for (const month of MONTHS) {
      const dueDate = day(`${month}-10`);
      const isCurrentMonth = month === "2026-07";
      const r = faker.number.int({ min: 1, max: 100 });
      let status: FeeStatus;
      let amountPaid = fs.amount;
      let paidDate: Date | null = faker.date.between({
        from: day(`${month}-01`),
        to: dueDate,
      });
      if (!isCurrentMonth) {
        if (r <= 94) {
          status = "paid";
        } else if (r <= 97) {
          status = "overdue";
          amountPaid = 0;
          paidDate = null;
        } else {
          status = "partial";
          amountPaid = Math.round(fs.amount / 2);
        }
      } else {
        if (r <= 55) {
          status = "paid";
        } else if (r <= 70) {
          status = "partial";
          amountPaid = Math.round(fs.amount / 2);
        } else {
          status = "overdue"; // due day (10th) has passed this month
          amountPaid = 0;
          paidDate = null;
        }
      }
      feeRows.push({
        studentId: st.id,
        feeStructureId: fs.id,
        amountDue: fs.amount,
        amountPaid,
        status,
        dueDate,
        paidDate,
        paymentMethod:
          status === "overdue" ? null : pick(["upi", "cash", "online", "cheque"]),
        receiptNumber:
          status === "overdue"
            ? null
            : `RCPT-${String(receiptCounter++).padStart(6, "0")}`,
        lateFee: status === "overdue" ? 200 : 0,
      });
    }
  }
  for (let i = 0; i < feeRows.length; i += 2000) {
    await prisma.feePayment.createMany({ data: feeRows.slice(i, i + 2000) });
  }

  console.log("Creating transport, library, hostel...");
  const routes = [
    "Route 1 — MG Road",
    "Route 2 — Whitefield",
    "Route 3 — Jayanagar",
    "Route 4 — Hebbal",
    "Route 5 — Electronic City",
  ].map((name, i) => ({
    id: uuid(),
    name,
    vehicleNumber: `KA-01-F${1000 + i * 7}`,
  }));
  await prisma.transportRoute.createMany({
    data: routes.map((r) => ({
      id: r.id,
      institutionId,
      name: r.name,
      vehicleNumber: r.vehicleNumber,
      driverName: faker.person.fullName({ sex: "male" }),
      driverPhone: faker.phone.number({ style: "international" }),
      capacity: 40,
    })),
  });
  const stops: { id: string; routeId: string }[] = [];
  const stopRows: Prisma.TransportStopCreateManyInput[] = [];
  routes.forEach((route) => {
    const stopCount = faker.number.int({ min: 4, max: 6 });
    for (let i = 0; i < stopCount; i++) {
      const id = uuid();
      stops.push({ id, routeId: route.id });
      stopRows.push({
        id,
        routeId: route.id,
        name: `${faker.location.street()}`,
        pickupTime: `0${7}:${String(10 + i * 8).padStart(2, "0")}`,
        dropTime: `1${4}:${String(10 + i * 8).padStart(2, "0")}`,
        orderIndex: i,
      });
    }
  });
  await prisma.transportStop.createMany({ data: stopRows });
  const transportStudents = students.filter((_, i) => i % 3 === 0); // ~167
  await prisma.studentTransport.createMany({
    data: transportStudents.map((s) => ({
      studentId: s.id,
      stopId: pick(stops).id,
      academicYearId,
    })),
  });

  const CATEGORIES = ["Fiction", "Science", "History", "Biography", "Reference", "Comics"];
  const bookRows: Prisma.LibraryBookCreateManyInput[] = [];
  const bookIds: string[] = [];
  for (let i = 0; i < 200; i++) {
    const id = uuid();
    bookIds.push(id);
    const copies = faker.number.int({ min: 1, max: 6 });
    bookRows.push({
      id,
      institutionId,
      title: faker.book.title(),
      author: faker.book.author(),
      isbn: faker.commerce.isbn(13),
      publisher: faker.book.publisher(),
      category: pick(CATEGORIES),
      totalCopies: copies,
      availableCopies: copies,
      shelfLocation: `${pick(["A", "B", "C", "D"])}-${faker.number.int({ min: 1, max: 30 })}`,
    });
  }
  await prisma.libraryBook.createMany({ data: bookRows });
  const txnRows: Prisma.LibraryTransactionCreateManyInput[] = [];
  for (let i = 0; i < 40; i++) {
    const issue = faker.date.recent({ days: 25 });
    const dueDate = new Date(issue);
    dueDate.setDate(dueDate.getDate() + 14);
    const returned = i % 3 === 0;
    const overdue = !returned && dueDate < TODAY;
    txnRows.push({
      bookId: pick(bookIds),
      userId: pick(studentUsers).id,
      issueDate: issue,
      dueDate,
      returnDate: returned ? new Date(dueDate.getTime() - 86400000 * 2) : null,
      status: returned ? "returned" : overdue ? "overdue" : "issued",
      fineAmount: overdue ? 50 : 0,
    });
  }
  await prisma.libraryTransaction.createMany({ data: txnRows });

  const hostelRoomRows: Prisma.HostelRoomCreateManyInput[] = [];
  const hostelRoomIds: string[] = [];
  for (const block of ["Aravalli", "Nilgiri"]) {
    for (let i = 1; i <= 10; i++) {
      const id = uuid();
      hostelRoomIds.push(id);
      hostelRoomRows.push({
        id,
        institutionId,
        blockName: block,
        roomNumber: `${block[0]}-${100 + i}`,
        floor: Math.ceil(i / 4),
        capacity: 4,
        roomType: "dormitory",
        monthlyFee: 6000,
      });
    }
  }
  await prisma.hostelRoom.createMany({ data: hostelRoomRows });
  const hostelStudents = students.filter((_, i) => i % 16 === 0).slice(0, 30);
  await prisma.hostelAllocation.createMany({
    data: hostelStudents.map((s, i) => ({
      roomId: hostelRoomIds[i % hostelRoomIds.length],
      studentId: s.id,
      academicYearId,
      checkInDate: day("2026-04-05"),
    })),
  });
  // Track occupancy counts.
  for (const roomId of hostelRoomIds) {
    const occupied = hostelStudents.filter(
      (_, i) => hostelRoomIds[i % hostelRoomIds.length] === roomId
    ).length;
    if (occupied > 0) {
      await prisma.hostelRoom.update({
        where: { id: roomId },
        data: { occupied },
      });
    }
  }

  console.log("Creating announcements, assignments, HR data...");
  const ANNOUNCEMENTS: [string, string, PriorityLevel, boolean][] = [
    ["Annual Sports Day on 14 August", "Track and field events begin 8 AM sharp. Parents are welcome!", "high", true],
    ["Unit Test 2 schedule released", "Unit Test 2 runs 17–22 August. Check the examinations page for the full timetable.", "urgent", true],
    ["Library week: double borrowing limit", "Borrow up to 4 books during library week.", "low", false],
    ["Fee reminder for July", "July tuition was due on the 10th. Please clear dues to avoid late fees.", "high", false],
    ["Independence Day celebration", "Flag hoisting at 8 AM on 15 August. All students in uniform.", "medium", false],
    ["New computer lab inaugurated", "Block B now hosts 40 new workstations for classes 6-10.", "medium", false],
    ["Parent-teacher meeting", "PTM for all classes on the first Saturday of August, 9 AM – 1 PM.", "high", false],
    ["Rainy day guidelines", "School remains open during rains; buses may run 10-15 minutes late.", "low", false],
    ["Science exhibition entries open", "Submit project abstracts to your science teacher by 5 August.", "medium", false],
    ["Yoga classes every Wednesday", "Morning assembly will include a 15-minute yoga session.", "low", false],
    ["Canteen menu revised", "A new nutritionist-approved menu starts Monday.", "low", false],
    ["Bus Route 3 stop added", "New stop at South End Circle from next week.", "medium", false],
    ["Scholarship test for Class 10", "Merit scholarship test on 30 August. Register at the office.", "high", false],
    ["Inter-school debate winners", "Congratulations to our senior debate team for winning the district trophy!", "medium", false],
    ["Uniform store timings", "The uniform store is open weekdays 9 AM – 3 PM.", "low", false],
    ["Health camp next month", "Free dental and vision check-ups for all students in September.", "medium", false],
    ["Hostel visiting hours update", "Weekend visiting hours are now 10 AM – 6 PM.", "low", false],
    ["Art competition submissions", "Theme: 'My Green City'. Submit by 20 August.", "low", false],
    ["Class 10 career counselling", "One-on-one sessions with counsellors from 1 September.", "medium", false],
    ["Emergency drill on Friday", "A fire evacuation drill will be held Friday at 11 AM.", "urgent", false],
  ];
  await prisma.announcement.createMany({
    data: ANNOUNCEMENTS.map(([title, content, priority, isPinned], i) => ({
      institutionId,
      title,
      content,
      priority,
      isPinned,
      authorId: superAdminId,
      publishedAt: faker.date.recent({ days: 20 }),
      targetRoles: i % 4 === 0 ? [] : i % 4 === 1 ? ["student", "parent"] : i % 4 === 2 ? ["teacher", "staff"] : ["student"],
    })),
  });

  // Assignments for classes 6-10 core subjects.
  const assignmentRows: { id: string; classId: string; subjectId: string; teacherId: string; title: string }[] = [];
  const seniorClasses = classIds.filter((c) => c.order >= 6);
  const ASSIGNMENT_TITLES = [
    "Chapter 4 problem set",
    "Lab report: acids & bases",
    "Essay: My favourite season",
    "Map work: rivers of India",
    "Algorithm flowchart practice",
    "Poem recitation prep",
    "Periodic table quiz prep",
    "Book review submission",
    "Grammar worksheet 7",
    "Statistics mini-project",
  ];
  ASSIGNMENT_TITLES.forEach((title, i) => {
    const cls = seniorClasses[i % seniorClasses.length];
    const csList = classSubjects.filter((cs) => cs.classId === cls.id && cs.code !== "PE");
    const cs = csList[i % csList.length];
    assignmentRows.push({
      id: uuid(),
      classId: cls.id,
      subjectId: cs.subjectId,
      teacherId: cs.teacherId,
      title,
    });
  });
  await prisma.assignment.createMany({
    data: assignmentRows.map((a, i) => ({
      id: a.id,
      institutionId,
      title: a.title,
      description:
        "Complete the work neatly and submit before the due date. Refer to your class notes.",
      subjectId: a.subjectId,
      classId: a.classId,
      teacherId: a.teacherId,
      dueDate: faker.date.soon({ days: 10 }),
      maxMarks: 20,
    })),
  });
  const submissionRows: Prisma.AssignmentSubmissionCreateManyInput[] = [];
  for (const a of assignmentRows) {
    const classStudents = students.filter((s) => s.classId === a.classId);
    for (const st of classStudents) {
      if (faker.number.int({ min: 1, max: 100 }) <= 45) {
        const graded = faker.number.int({ min: 1, max: 100 }) <= 50;
        submissionRows.push({
          assignmentId: a.id,
          studentId: st.id,
          content: "Submitted online.",
          marksObtained: graded ? faker.number.int({ min: 8, max: 20 }) : null,
          feedback: graded ? pick(["Good work!", "Neatly done.", "Revise section 2.", "Excellent!"]) : null,
          gradedAt: graded ? new Date() : null,
        });
      }
    }
  }
  for (let i = 0; i < submissionRows.length; i += 2000) {
    await prisma.assignmentSubmission.createMany({
      data: submissionRows.slice(i, i + 2000),
    });
  }

  // Leave + payroll
  const leaveRows: Prisma.LeaveRequestCreateManyInput[] = [];
  for (let i = 0; i < 12; i++) {
    const u = pick([...teacherUsers, ...staffUsers]);
    const start = faker.date.soon({ days: 20 });
    const end = new Date(start);
    end.setDate(end.getDate() + faker.number.int({ min: 0, max: 3 }));
    leaveRows.push({
      userId: u.id,
      leaveType: pick(["sick", "casual", "earned"]),
      startDate: start,
      endDate: end,
      reason: pick([
        "Family function",
        "Medical appointment",
        "Personal work",
        "Fever and rest advised",
      ]),
      status: pick(["pending", "pending", "approved", "rejected"]),
      approvedById: superAdminId,
    });
  }
  await prisma.leaveRequest.createMany({ data: leaveRows });

  const payrollRows: Prisma.PayrollCreateManyInput[] = [];
  for (const month of [6, 7]) {
    for (const t of teacherUsers) {
      const basic = faker.number.int({ min: 35, max: 90 }) * 1000;
      payrollRows.push({
        userId: t.id,
        month,
        year: 2026,
        basicSalary: basic,
        allowances: Math.round(basic * 0.2),
        deductions: Math.round(basic * 0.12),
        netSalary: Math.round(basic * 1.08),
        paymentStatus: month === 6 ? "paid" : "processed",
        paymentDate: month === 6 ? day("2026-06-30") : null,
      });
    }
    for (const s of staffUsers) {
      const basic = faker.number.int({ min: 20, max: 45 }) * 1000;
      payrollRows.push({
        userId: s.id,
        month,
        year: 2026,
        basicSalary: basic,
        allowances: Math.round(basic * 0.15),
        deductions: Math.round(basic * 0.1),
        netSalary: Math.round(basic * 1.05),
        paymentStatus: month === 6 ? "paid" : "pending",
        paymentDate: month === 6 ? day("2026-06-30") : null,
      });
    }
  }
  await prisma.payroll.createMany({ data: payrollRows });

  console.log("Creating inventory, visitors, notifications, messages...");
  const INVENTORY = [
    ["Whiteboard markers", "Stationery", 240, "pcs", 25],
    ["A4 paper reams", "Stationery", 80, "reams", 260],
    ["Basketballs", "Sports", 14, "pcs", 900],
    ["Football", "Sports", 8, "pcs", 1100],
    ["Microscopes", "Lab", 22, "pcs", 8500],
    ["Test tubes", "Lab", 300, "pcs", 15],
    ["Projector lamps", "Electronics", 6, "pcs", 4200],
    ["Desktop computers", "Electronics", 42, "pcs", 38000],
    ["Chart paper", "Stationery", 150, "sheets", 10],
    ["First aid kits", "Medical", 12, "kits", 650],
    ["Chess sets", "Sports", 20, "sets", 450],
    ["Lab coats", "Lab", 60, "pcs", 350],
    ["Staplers", "Stationery", 25, "pcs", 120],
    ["Water dispensers", "Facilities", 8, "pcs", 5200],
    ["Classroom chairs", "Furniture", 120, "pcs", 850],
  ] as const;
  await prisma.inventoryItem.createMany({
    data: INVENTORY.map(([name, category, quantity, unit, unitPrice]) => ({
      institutionId,
      name,
      category,
      quantity,
      unit,
      unitPrice,
      minStockAlert: 10,
    })),
  });

  await prisma.visitorLog.createMany({
    data: Array.from({ length: 10 }).map(() => {
      const checkIn = faker.date.recent({ days: 7 });
      return {
        institutionId,
        visitorName: faker.person.fullName(),
        phone: faker.phone.number({ style: "international" }),
        purpose: pick([
          "Admission enquiry",
          "Vendor meeting",
          "Parent meeting",
          "Maintenance visit",
          "Document collection",
        ]),
        whomToMeet: pick(["Principal", "Admin Office", "Accounts", "Class Teacher"]),
        checkIn,
        checkOut: faker.number.int({ min: 0, max: 1 })
          ? new Date(checkIn.getTime() + 45 * 60000)
          : null,
        idProofType: pick(["Aadhaar", "Driving Licence", "Voter ID"]),
      };
    }),
  });

  const alexUser = studentUsers.find((u) => u.email === "alex.kumar@edu.app")!;
  const rajeshUser = parentUsers.find((u) => u.email === "rajesh.kumar@edu.app")!;
  const sarahUser = teacherUsers[0];
  await prisma.notification.createMany({
    data: [
      {
        userId: alexUser.id,
        title: "Unit Test 1 results published",
        message: "Your Unit Test 1 results are now available.",
        type: "result",
        actionUrl: "/student/results",
      },
      {
        userId: alexUser.id,
        title: "Assignment due soon",
        message: "Statistics mini-project is due in 2 days.",
        type: "assignment",
        actionUrl: "/student/assignments",
      },
      {
        userId: rajeshUser.id,
        title: "July fee pending",
        message: "Tuition fee for July is pending. Tap to view details.",
        type: "fee",
        actionUrl: "/parent/fees",
      },
      {
        userId: sarahUser.id,
        title: "23 submissions to grade",
        message: "You have pending submissions in your gradebook.",
        type: "assignment",
        actionUrl: "/teacher/gradebook",
      },
      {
        userId: superAdminId,
        title: "Fee collection update",
        message: "July collection has crossed 60% of the projected amount.",
        type: "fee",
        actionUrl: "/admin/fees",
      },
    ],
  });

  await prisma.message.createMany({
    data: [
      {
        institutionId,
        senderId: rajeshUser.id,
        recipientId: sarahUser.id,
        subject: "Alex's progress in Mathematics",
        content:
          "Hello Ms. Johnson, could you share how Alex has been doing in Mathematics this term?",
      },
      {
        institutionId,
        senderId: sarahUser.id,
        recipientId: rajeshUser.id,
        subject: "Re: Alex's progress in Mathematics",
        content:
          "Hi Mr. Kumar, Alex is doing well — scored 42/50 in Unit Test 1. A little more practice with geometry will help.",
      },
    ],
  });

  console.log("Seed complete ✅");
  console.log(`  Students: ${students.length}, Parents: ${parents.length}, Teachers: ${teacherUsers.length}`);
  console.log(`  Timetable slots: ${slotRows.length}, Attendance rows: ${attendanceRows.length}`);
  console.log(`  Exam results: ${resultRows.length}, Fee rows: ${feeRows.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
