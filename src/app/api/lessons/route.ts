import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { getRequestMeta } from "@/lib/request";

const lessonSchema = z.object({
  title: z.string().min(2, "Title lesson minimal 2 karakter"),
  type: z.enum(["TEXT", "VIDEO", "FILE", "QUIZ", "ASSIGNMENT"]).default("TEXT"),
  contentHtml: z.string().optional().nullable(),
  contentJson: z.unknown().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  order: z.number().optional(),
  isPreview: z.boolean().optional(),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function GET(_: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "lessons.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const lessons = await prisma.lesson.findMany({
    where: {
      sectionId: id,
    },
    orderBy: {
      order: "asc",
    },
  });

  return NextResponse.json({
    data: lessons,
  });
}

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "lessons.create")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const payload = lessonSchema.parse(body);

    const section = await prisma.courseSection.findUnique({
      where: { id },
    });

    if (!section) {
      return NextResponse.json(
        { message: "Section tidak ditemukan." },
        { status: 404 },
      );
    }

    const lastLesson = await prisma.lesson.findFirst({
      where: {
        sectionId: id,
      },
      orderBy: {
        order: "desc",
      },
    });

    const slug = await generateLessonSlug(id, payload.title);

    const lesson = await prisma.lesson.create({
      data: {
        sectionId: id,
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
        isPreview: payload.isPreview || false,
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
        sectionId: id,
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
