import "server-only";
import ExcelJS from "exceljs";

/** One data row keyed by the (normalised) header name. */
export type SheetRow = Record<string, string>;

export interface ColumnSpec {
  /** Canonical key used in the parsed row objects. */
  key: string;
  /** Header text written into generated templates. */
  header: string;
  required: boolean;
  /** Example value shown in the template's sample row. */
  example: string;
  width?: number;
  note?: string;
}

/** "First Name " -> "firstname" so header matching is forgiving. */
function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, "");
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    // Dates arrive at UTC midnight; format as yyyy-MM-dd.
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("result" in value) return cellToString(value.result as ExcelJS.CellValue);
    if ("richText" in value) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("hyperlink" in value && typeof value.hyperlink === "string") {
      return value.hyperlink;
    }
    return "";
  }
  return String(value);
}

/** Max data rows accepted in one import — keeps a request bounded. */
export const MAX_IMPORT_ROWS = 1000;

export interface ParseResult {
  rows: SheetRow[];
  /** Headers present in the file that matched no known column. */
  unknownHeaders: string[];
}

/**
 * Read the first worksheet of an .xlsx or .csv buffer into row objects keyed
 * by ColumnSpec.key. Blank rows are skipped; header matching is
 * case/space-insensitive.
 */
export async function parseSheet(
  buffer: Buffer,
  columns: ColumnSpec[],
  fileName: string
): Promise<ParseResult | { error: string }> {
  const workbook = new ExcelJS.Workbook();
  try {
    if (/\.csv$/i.test(fileName)) {
      const { Readable } = await import("node:stream");
      await workbook.csv.read(Readable.from(buffer.toString("utf8")));
    } else {
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    }
  } catch {
    return { error: "Couldn't read that file — is it a valid .xlsx or .csv?" };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) {
    return { error: "The sheet has no data rows below the header" };
  }

  const byNormalized = new Map(
    columns.map((c) => [normalizeHeader(c.header), c.key])
  );
  const headerRow = sheet.getRow(1);
  const keyByColumn = new Map<number, string>();
  const unknownHeaders: string[] = [];
  headerRow.eachCell((cell, colNumber) => {
    const text = cellToString(cell.value).trim();
    if (!text) return;
    const key = byNormalized.get(normalizeHeader(text));
    if (key) keyByColumn.set(colNumber, key);
    else unknownHeaders.push(text);
  });

  const missing = columns
    .filter((c) => c.required && ![...keyByColumn.values()].includes(c.key))
    .map((c) => c.header);
  if (missing.length > 0) {
    return { error: `Missing required column(s): ${missing.join(", ")}` };
  }

  const rows: SheetRow[] = [];
  for (let i = 2; i <= sheet.rowCount; i++) {
    if (rows.length >= MAX_IMPORT_ROWS) break;
    const row = sheet.getRow(i);
    const record: SheetRow = {};
    let hasValue = false;
    for (const [colNumber, key] of keyByColumn) {
      const text = cellToString(row.getCell(colNumber).value).trim();
      record[key] = text;
      if (text) hasValue = true;
    }
    if (hasValue) rows.push(record);
  }

  if (rows.length === 0) {
    return { error: "No data rows found in the sheet" };
  }
  return { rows, unknownHeaders };
}

/**
 * Build a styled .xlsx template: header row, one example row, and a notes
 * sheet explaining each column.
 */
export async function buildTemplate(
  sheetName: string,
  columns: ColumnSpec[],
  sampleRows: string[][] = []
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EduNexus";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? Math.max(14, c.header.length + 4),
  }));

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FF0B3B32" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFB9F0DC" },
  };
  header.alignment = { vertical: "middle" };
  header.height = 22;
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const examples =
    sampleRows.length > 0 ? sampleRows : [columns.map((c) => c.example)];
  for (const values of examples) {
    sheet.addRow(values);
  }

  const notes = workbook.addWorksheet("Instructions");
  notes.columns = [
    { header: "Column", key: "column", width: 24 },
    { header: "Required", key: "required", width: 12 },
    { header: "What to enter", key: "note", width: 70 },
  ];
  notes.getRow(1).font = { bold: true };
  for (const c of columns) {
    notes.addRow({
      column: c.header,
      required: c.required ? "Yes" : "Optional",
      note: c.note ?? `Example: ${c.example}`,
    });
  }
  notes.addRow({});
  notes.addRow({
    column: "Row limit",
    required: "",
    note: `Up to ${MAX_IMPORT_ROWS} rows per file. Delete the sample row before importing.`,
  });

  const out = await workbook.xlsx.writeBuffer();
  return Buffer.from(out);
}

export function spreadsheetHeaders(fileName: string): HeadersInit {
  return {
    "Content-Type":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "no-store",
  };
}
