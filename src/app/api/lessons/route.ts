import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { getRequestMeta } from "@/lib/request";

const lessonSchema = z.object({
  sectionId: z.string().min(1, "Section wajib dipilih"),
  title: z.string().min(2, "Title lesson minimal 2 karakter"),
  type: z.enum(["TEXT", "VIDEO", "FILE", "QUIZ", "ASSIGNMENT"]).default("TEXT"),
  contentHtml: z.string().optional().nullable(),
  contentJson: z.unknown().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  order: z.number().optional(),
  isPreview: z.boolean().optional(),
});

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function generateLessonSlug(sectionId: string, title: string) {
  const baseSlug = createSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (
    await prisma.lesson.findFirst({
      where: {
        sectionId,
        slug,
      },
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "lessons.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const sectionId = req.nextUrl.searchParams.get("sectionId");

  if (!sectionId) {
    return NextResponse.json(
      { message: "sectionId wajib dikirim." },
      { status: 400 },
    );
  }

  const section = await prisma.courseSection.findUnique({
    where: {
      id: sectionId,
    },
    select: {
      id: true,
    },
  });

  if (!section) {
    return NextResponse.json(
      { message: "Section tidak ditemukan." },
      { status: 404 },
    );
  }

  const lessons = await prisma.lesson.findMany({
    where: {
      sectionId,
    },
    orderBy: {
      order: "asc",
    },
  });

  return NextResponse.json({
    data: lessons,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "lessons.create")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const payload = lessonSchema.parse(body);

    const section = await prisma.courseSection.findUnique({
      where: {
        id: payload.sectionId,
      },
    });

    if (!section) {
      return NextResponse.json(
        { message: "Section tidak ditemukan." },
        { status: 404 },
      );
    }

    const lastLesson = await prisma.lesson.findFirst({
      where: {
        sectionId: payload.sectionId,
      },
      orderBy: {
        order: "desc",
      },
    });

    const slug = await generateLessonSlug(payload.sectionId, payload.title);

    const lesson = await prisma.lesson.create({
      data: {
        sectionId: payload.sectionId,
        title: payload.title,
        slug,
        type: payload.type,
        contentHtml: payload.contentHtml || null,
        contentJson:
          payload.contentJson === undefined
            ? Prisma.JsonNull
            : (payload.contentJson as Prisma.InputJsonValue),
        videoUrl: payload.videoUrl || null,
        fileUrl: payload.fileUrl || null,
        order: payload.order ?? (lastLesson ? lastLesson.order + 1 : 1),
        isPreview: payload.isPreview ?? false,
      },
    });

    const { ipAddress, userAgent } = await getRequestMeta();

    await createActivityLog({
      userId: session.user.id,
      action: "CREATE_LESSON",
      module: "lessons",
      description: `${session.user.name} membuat lesson ${lesson.title}.`,
      ipAddress,
      userAgent,
      oldData: Prisma.JsonNull,
      newData: lesson,
      metadata: {
        courseId: section.courseId,
        sectionId: payload.sectionId,
      },
    });

    return NextResponse.json(
      {
        message: "Lesson berhasil dibuat.",
        data: lesson,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Validasi gagal.",
          errors: error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    console.error("Create lesson error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
