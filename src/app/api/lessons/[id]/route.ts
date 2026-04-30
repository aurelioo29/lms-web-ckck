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
  type: z.enum(["TEXT", "VIDEO", "FILE", "QUIZ", "ASSIGNMENT"]),
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

async function generateLessonSlug(
  sectionId: string,
  title: string,
  currentId: string,
) {
  const baseSlug = createSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (
    await prisma.lesson.findFirst({
      where: {
        sectionId,
        slug,
        NOT: {
          id: currentId,
        },
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

  const lesson = await prisma.lesson.findUnique({
    where: { id },
  });

  if (!lesson) {
    return NextResponse.json(
      { message: "Lesson tidak ditemukan." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: lesson,
  });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "lessons.update")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const payload = lessonSchema.parse(body);

    const oldLesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        section: true,
      },
    });

    if (!oldLesson) {
      return NextResponse.json(
        { message: "Lesson tidak ditemukan." },
        { status: 404 },
      );
    }

    const slug =
      oldLesson.title === payload.title
        ? oldLesson.slug
        : await generateLessonSlug(oldLesson.sectionId, payload.title, id);

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
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
        order: payload.order ?? oldLesson.order,
        isPreview: payload.isPreview || false,
      },
    });

    const { ipAddress, userAgent } = await getRequestMeta();

    await createActivityLog({
      userId: session.user.id,
      action: "UPDATE_LESSON",
      module: "lessons",
      description: `${session.user.name} memperbarui lesson ${lesson.title}.`,
      ipAddress,
      userAgent,
      oldData: {
        id: oldLesson.id,
        title: oldLesson.title,
        slug: oldLesson.slug,
        type: oldLesson.type,
        contentHtml: oldLesson.contentHtml,
        videoUrl: oldLesson.videoUrl,
        fileUrl: oldLesson.fileUrl,
        order: oldLesson.order,
        isPreview: oldLesson.isPreview,
      },
      newData: lesson,
      metadata: {
        courseId: oldLesson.section.courseId,
        sectionId: oldLesson.sectionId,
      },
    });

    return NextResponse.json({
      message: "Lesson berhasil diperbarui.",
      data: lesson,
    });
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

    console.error("Update lesson error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "lessons.delete")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const oldLesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      section: true,
    },
  });

  if (!oldLesson) {
    return NextResponse.json(
      { message: "Lesson tidak ditemukan." },
      { status: 404 },
    );
  }

  await prisma.lesson.delete({
    where: { id },
  });

  const { ipAddress, userAgent } = await getRequestMeta();

  await createActivityLog({
    userId: session.user.id,
    action: "DELETE_LESSON",
    module: "lessons",
    description: `${session.user.name} menghapus lesson ${oldLesson.title}.`,
    ipAddress,
    userAgent,
    oldData: {
      id: oldLesson.id,
      title: oldLesson.title,
      slug: oldLesson.slug,
      type: oldLesson.type,
    },
    newData: Prisma.JsonNull,
    metadata: {
      courseId: oldLesson.section.courseId,
      sectionId: oldLesson.sectionId,
    },
  });

  return NextResponse.json({
    message: "Lesson berhasil dihapus.",
  });
}
