import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxSize = 2 * 1024 * 1024; // 2MB

function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() || "png";
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "courses.create")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "File thumbnail wajib diupload." },
      { status: 400 },
    );
  }

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { message: "File harus JPG, PNG, atau WEBP." },
      { status: 400 },
    );
  }

  if (file.size > maxSize) {
    return NextResponse.json(
      { message: "Ukuran file maksimal 2MB." },
      { status: 400 },
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const extension = getFileExtension(file.name);
  const filename = `course-${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "courses");
  await mkdir(uploadDir, { recursive: true });

  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);

  const url = `/uploads/courses/${filename}`;

  return NextResponse.json({
    message: "Thumbnail berhasil diupload.",
    data: {
      url,
    },
  });
}
