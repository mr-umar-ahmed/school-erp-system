import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import {
  MAX_FILE_SIZE,
  isAllowedMimeType,
  sniffMimeType,
  storedFileUrl,
} from "@/lib/uploads";

// Uploads go through a route handler (not a server action) so they aren't
// subject to the server-action body cap or sequential dispatch. Session
// cookie is SameSite=Lax, so cross-site POSTs arrive without credentials.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.institutionId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File is too large (max 4 MB)" },
      { status: 413 }
    );
  }
  if (!isAllowedMimeType(file.type)) {
    return NextResponse.json(
      { error: "Only PDF, JPG, PNG and WebP files are allowed" },
      { status: 415 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffMimeType(bytes);
  if (sniffed === null) {
    return NextResponse.json(
      { error: "File content doesn't look like a PDF or image" },
      { status: 415 }
    );
  }

  const name = (file.name || "attachment").slice(0, 200);
  const created = await prisma.storedFile.create({
    data: {
      institutionId: user.institutionId,
      uploaderId: user.id,
      name,
      mimeType: sniffed,
      size: bytes.byteLength,
      data: bytes,
    },
    select: { id: true, name: true, mimeType: true, size: true },
  });

  return NextResponse.json({
    id: created.id,
    url: storedFileUrl(created.id, created.name),
    name: created.name,
    mimeType: created.mimeType,
    size: created.size,
  });
}
