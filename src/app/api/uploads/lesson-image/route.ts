import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxSize = 3 * 1024 * 1024; // 3MB

function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() || "png";
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (
    !hasPermission(session, "lessons.create") &&
    !hasPermission(session, "lessons.update")
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "File gambar wajib diupload." },
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
      { message: "Ukuran gambar maksimal 3MB." },
      { status: 400 },
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const extension = getFileExtension(file.name);
  const filename = `lesson-${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "lessons",
    "images",
  );

  await mkdir(uploadDir, { recursive: true });

  await writeFile(path.join(uploadDir, filename), buffer);

  return NextResponse.json({
    message: "Gambar berhasil diupload.",
    data: {
      url: `/uploads/lessons/images/${filename}`,
    },
  });
}
