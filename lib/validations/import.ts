import { z } from "zod";

/** Column definitions shared by the template generator and the parser. */
export interface ImportColumn {
  key: string;
  header: string;
  required: boolean;
  example: string;
  width?: number;
  note?: string;
}

export const STUDENT_IMPORT_COLUMNS: ImportColumn[] = [
  {
    key: "firstName",
    header: "First Name",
    required: true,
    example: "Aarav",
    note: "Student's given name.",
  },
  {
    key: "lastName",
    header: "Last Name",
    required: true,
    example: "Sharma",
    note: "Student's family name.",
  },
  {
    key: "email",
    header: "Email",
    required: true,
    width: 30,
    example: "aarav.sharma@edu.app",
    note: "Must be unique across the school — it is the student's login id.",
  },
  {
    key: "className",
    header: "Class",
    required: true,
    example: "Class 6",
    note: "Must match an existing class name exactly, e.g. \"Class 6\".",
  },
  {
    key: "sectionName",
    header: "Section",
    required: true,
    example: "A",
    note: "Section letter within that class, e.g. A, B or C.",
  },
  {
    key: "rollNumber",
    header: "Roll Number",
    required: false,
    example: "12",
    note: "Whole number. Leave blank to assign later.",
  },
  {
    key: "gender",
    header: "Gender",
    required: false,
    example: "male",
    note: "One of: male, female, other.",
  },
  {
    key: "dateOfBirth",
    header: "Date of Birth",
    required: false,
    example: "2014-05-21",
    note: "Format YYYY-MM-DD, or a real date cell.",
  },
  {
    key: "phone",
    header: "Phone",
    required: false,
    example: "+91 98765 43210",
  },
  {
    key: "address",
    header: "Address",
    required: false,
    width: 30,
    example: "14 MG Road, Bengaluru",
  },
  {
    key: "bloodGroup",
    header: "Blood Group",
    required: false,
    example: "O+",
  },
  {
    key: "guardianName",
    header: "Guardian Name",
    required: false,
    example: "Rohit Sharma",
    note: "Emergency contact name.",
  },
  {
    key: "guardianPhone",
    header: "Guardian Phone",
    required: false,
    example: "+91 98765 43211",
  },
];

export const TEACHER_IMPORT_COLUMNS: ImportColumn[] = [
  { key: "firstName", header: "First Name", required: true, example: "Sarah" },
  { key: "lastName", header: "Last Name", required: true, example: "Johnson" },
  {
    key: "email",
    header: "Email",
    required: true,
    width: 30,
    example: "sarah.johnson@edu.app",
    note: "Unique login id for the teacher.",
  },
  {
    key: "employeeId",
    header: "Employee ID",
    required: false,
    example: "GVT-031",
    note: "Leave blank to auto-generate the next id.",
  },
  {
    key: "department",
    header: "Department",
    required: false,
    example: "Science",
  },
  {
    key: "designation",
    header: "Designation",
    required: false,
    example: "Senior Teacher",
  },
  {
    key: "qualification",
    header: "Qualification",
    required: false,
    example: "M.Sc, B.Ed",
  },
  {
    key: "experienceYears",
    header: "Experience Years",
    required: false,
    example: "8",
    note: "Whole number of years.",
  },
  {
    key: "joiningDate",
    header: "Joining Date",
    required: false,
    example: "2019-06-01",
    note: "Format YYYY-MM-DD.",
  },
  {
    key: "salary",
    header: "Monthly Salary",
    required: false,
    example: "55000",
    note: "Numbers only, no currency symbol.",
  },
  { key: "phone", header: "Phone", required: false, example: "+91 98765 43210" },
  {
    key: "gender",
    header: "Gender",
    required: false,
    example: "female",
    note: "One of: male, female, other.",
  },
];

export const MARKS_IMPORT_COLUMNS: ImportColumn[] = [
  {
    key: "admissionNo",
    header: "Admission No",
    required: true,
    example: "GVIS-0001",
    note: "Identifies the student — do not edit this column.",
  },
  {
    key: "studentName",
    header: "Student",
    required: false,
    width: 26,
    example: "Aarav Sharma",
    note: "For your reference only; changes here are ignored.",
  },
  {
    key: "marks",
    header: "Marks",
    required: false,
    example: "78",
    note: "Marks obtained. Leave blank if the student was absent.",
  },
  {
    key: "absent",
    header: "Absent",
    required: false,
    example: "no",
    note: "Enter yes / y / true to mark the student absent.",
  },
];

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const genderValue = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => v === undefined || ["male", "female", "other"].includes(v), {
    message: "Gender must be male, female or other",
  })
  .transform((v) => v as "male" | "female" | "other" | undefined);

const dateValue = optionalText.refine(
  (v) => v === undefined || /^\d{4}-\d{2}-\d{2}$/.test(v),
  { message: "Date must look like YYYY-MM-DD" }
);

const wholeNumber = optionalText.refine(
  (v) => v === undefined || /^\d+$/.test(v),
  { message: "Must be a whole number" }
);

const decimalNumber = optionalText.refine(
  (v) => v === undefined || /^\d+(\.\d+)?$/.test(v),
  { message: "Must be a number" }
);

export const studentImportRowSchema = z.object({
  firstName: z.string().trim().min(1, "First Name is required"),
  lastName: z.string().trim().min(1, "Last Name is required"),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  className: z.string().trim().min(1, "Class is required"),
  sectionName: z.string().trim().min(1, "Section is required"),
  rollNumber: wholeNumber,
  gender: genderValue,
  dateOfBirth: dateValue,
  phone: optionalText,
  address: optionalText,
  bloodGroup: optionalText,
  guardianName: optionalText,
  guardianPhone: optionalText,
});
export type StudentImportRow = z.infer<typeof studentImportRowSchema>;

export const teacherImportRowSchema = z.object({
  firstName: z.string().trim().min(1, "First Name is required"),
  lastName: z.string().trim().min(1, "Last Name is required"),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  employeeId: optionalText,
  department: optionalText,
  designation: optionalText,
  qualification: optionalText,
  experienceYears: wholeNumber,
  joiningDate: dateValue,
  salary: decimalNumber,
  phone: optionalText,
  gender: genderValue,
});
export type TeacherImportRow = z.infer<typeof teacherImportRowSchema>;

/** One rejected row, reported back to the admin with its sheet row number. */
export interface ImportRowError {
  row: number;
  identifier: string;
  message: string;
}

export interface ImportSummary {
  imported: number;
  skipped: number;
  errors: ImportRowError[];
  unknownHeaders: string[];
}
