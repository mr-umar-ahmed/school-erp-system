import "dotenv/config";
import ExcelJS from "exceljs";
import { signSessionToken } from "@/lib/auth/token";
import { prisma } from "@/lib/prisma";
import { parseSheet } from "@/lib/spreadsheet";
import { STUDENT_IMPORT_COLUMNS } from "@/lib/validations/import";

const BASE = "http://localhost:3000";

async function cookieFor(email: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const token = await signSessionToken({
    sub: user.id,
    role: user.role,
    institutionId: user.institutionId,
    name: `${user.firstName} ${user.lastName}`,
  });
  return `edunexus_session=${token}`;
}

async function main() {
  const adminCookie = await cookieFor("admin@edunexus.app");
  const teacherCookie = await cookieFor("sarah.johnson@edu.app");

  const tplRes = await fetch(`${BASE}/api/templates/students`, {
    headers: { cookie: adminCookie },
  });
  const tplBuf = Buffer.from(await tplRes.arrayBuffer());
  console.log("students template:", tplRes.status, tplBuf.byteLength, "bytes");
  console.log("  disposition:", tplRes.headers.get("content-disposition"));

  const parsed = await parseSheet(tplBuf, STUDENT_IMPORT_COLUMNS, "t.xlsx");
  console.log("  round-trip parse:", JSON.stringify(parsed).slice(0, 240));

  console.log("anon template:", (await fetch(`${BASE}/api/templates/students`)).status);
  console.log(
    "teacher->teachers template:",
    (await fetch(`${BASE}/api/templates/teachers`, { headers: { cookie: teacherCookie } })).status
  );

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  const form = new FormData();
  form.append("file", new File([new Uint8Array(png)], "dot.png", { type: "image/png" }));
  const up = await fetch(`${BASE}/api/files`, {
    method: "POST",
    headers: { cookie: teacherCookie },
    body: form,
  });
  const upText = await up.text();
  console.log("upload png:", up.status, upText.slice(0, 400));
  const upBody = (upText ? JSON.parse(upText) : {}) as { url?: string; error?: string };

  const fake = new FormData();
  fake.append(
    "file",
    new File([new Uint8Array(Buffer.from("MZ not really a pdf"))], "bad.pdf", {
      type: "application/pdf",
    })
  );
  const upFake = await fetch(`${BASE}/api/files`, {
    method: "POST",
    headers: { cookie: teacherCookie },
    body: fake,
  });
  console.log("upload spoofed pdf:", upFake.status, JSON.stringify(await upFake.json()));

  const anonUp = await fetch(`${BASE}/api/files`, { method: "POST", body: new FormData() });
  console.log("upload anonymous:", anonUp.status);

  if (upBody.url) {
    const served = await fetch(`${BASE}${upBody.url}`, { headers: { cookie: teacherCookie } });
    console.log(
      "serve file:",
      served.status,
      served.headers.get("content-type"),
      served.headers.get("cache-control")
    );
    console.log("serve file anon:", (await fetch(`${BASE}${upBody.url}`)).status);
    console.log(
      "serve unknown id:",
      (
        await fetch(`${BASE}/api/files/00000000-0000-4000-8000-000000000000`, {
          headers: { cookie: teacherCookie },
        })
      ).status
    );
  }

  // Marks template for a schedule this teacher owns.
  const cs = await prisma.classSubject.findFirst({
    where: { teacher: { email: "sarah.johnson@edu.app" } },
  });
  const schedule = cs
    ? await prisma.examSchedule.findFirst({
        where: { classId: cs.classId, subjectId: cs.subjectId },
      })
    : null;
  if (schedule) {
    const marks = await fetch(`${BASE}/api/templates/marks?schedule=${schedule.id}`, {
      headers: { cookie: teacherCookie },
    });
    const buf = Buffer.from(await marks.arrayBuffer());
    console.log("marks template:", marks.status, buf.byteLength, "bytes");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    console.log("  roster rows:", ws.rowCount - 1, "| row2:", JSON.stringify(ws.getRow(2).values));
  } else {
    console.log("marks template: no schedule found for that teacher");
  }

  // Parse a hand-built import file with one good and two bad rows.
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Students");
  ws.addRow(["First Name", "Last Name", "Email", "Class", "Section", "Roll Number", "Nickname"]);
  ws.addRow(["Test", "Importer", "t@edu.app", "Class 6", "A", "99", "TI"]);
  ws.addRow(["Bad", "Row", "not-an-email", "Class 6", "A", "", ""]);
  const out = Buffer.from(await wb.xlsx.writeBuffer());
  console.log("mixed file parse:", JSON.stringify(await parseSheet(out, STUDENT_IMPORT_COLUMNS, "x.xlsx")));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
