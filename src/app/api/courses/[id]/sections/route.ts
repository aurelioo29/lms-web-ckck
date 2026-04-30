import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { getRequestMeta } from "@/lib/request";

const sectionSchema = z.object({
  title: z.string().min(2, "Title section minimal 2 karakter"),
  order: z.number().optional(),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "courses.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const sections = await prisma.courseSection.findMany({
    where: {
      courseId: id,
    },
    include: {
      lessons: {
        orderBy: {
          order: "asc",
        },
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  return NextResponse.json({
    data: sections,
  });
}

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "courses.update")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const payload = sectionSchema.parse(body);

    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course tidak ditemukan." },
        { status: 404 },
      );
    }

    const lastSection = await prisma.courseSection.findFirst({
      where: {
        courseId: id,
      },
      orderBy: {
        order: "desc",
      },
    });

    const section = await prisma.courseSection.create({
      data: {
        courseId: id,
        title: payload.title,
        order: payload.order ?? (lastSection ? lastSection.order + 1 : 1),
      },
    });

    const { ipAddress, userAgent } = await getRequestMeta();

    await createActivityLog({
      userId: session.user.id,
      action: "CREATE_COURSE_SECTION",
      module: "courses",
      description: `${session.user.name} membuat section ${section.title}.`,
      ipAddress,
      userAgent,
      oldData: Prisma.JsonNull,
      newData: section,
      metadata: {
        courseId: id,
      },
    });

    return NextResponse.json(
      {
        message: "Section berhasil dibuat.",
        data: section,
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

    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
