import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { getRequestMeta } from "@/lib/request";

const courseSchema = z.object({
  title: z.string().min(2, "Title minimal 2 karakter"),
  description: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  instructorId: z.string().uuid("Instructor tidak valid"),
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

async function generateUniqueSlug(title: string, currentId: string) {
  const baseSlug = createSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (
    await prisma.course.findFirst({
      where: {
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

  if (!hasPermission(session, "courses.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
        },
      },
    },
  });

  if (!course) {
    return NextResponse.json(
      { message: "Course tidak ditemukan." },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: course });
}

export async function PATCH(req: Request, { params }: RouteParams) {
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
    const payload = courseSchema.parse(body);

    const oldCourse = await prisma.course.findUnique({
      where: { id },
    });

    if (!oldCourse) {
      return NextResponse.json(
        { message: "Course tidak ditemukan." },
        { status: 404 },
      );
    }

    const instructor = await prisma.user.findUnique({
      where: {
        id: payload.instructorId,
      },
    });

    if (!instructor) {
      return NextResponse.json(
        { message: "Instructor tidak ditemukan." },
        { status: 404 },
      );
    }

    const slug =
      oldCourse.title === payload.title
        ? oldCourse.slug
        : await generateUniqueSlug(payload.title, id);

    const course = await prisma.course.update({
      where: { id },
      data: {
        title: payload.title,
        slug,
        description: payload.description || null,
        thumbnail: payload.thumbnail || null,
        level: payload.level || null,
        status: payload.status,
        instructorId: payload.instructorId,
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
    });

    const { ipAddress, userAgent } = await getRequestMeta();

    await createActivityLog({
      userId: session.user.id,
      action: "UPDATE_COURSE",
      module: "courses",
      description: `${session.user.name} memperbarui course ${course.title}.`,
      ipAddress,
      userAgent,
      oldData: {
        id: oldCourse.id,
        title: oldCourse.title,
        slug: oldCourse.slug,
        description: oldCourse.description,
        thumbnail: oldCourse.thumbnail,
        level: oldCourse.level,
        status: oldCourse.status,
        instructorId: oldCourse.instructorId,
      },
      newData: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        thumbnail: course.thumbnail,
        level: course.level,
        status: course.status,
        instructorId: course.instructorId,
      },
      metadata: {
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json({
      message: "Course berhasil diperbarui.",
      data: course,
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

    console.error("Update course error:", error);

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

  if (!hasPermission(session, "courses.delete")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const oldCourse = await prisma.course.findUnique({
    where: { id },
  });

  if (!oldCourse) {
    return NextResponse.json(
      { message: "Course tidak ditemukan." },
      { status: 404 },
    );
  }

  await prisma.course.delete({
    where: { id },
  });

  const { ipAddress, userAgent } = await getRequestMeta();

  await createActivityLog({
    userId: session.user.id,
    action: "DELETE_COURSE",
    module: "courses",
    description: `${session.user.name} menghapus course ${oldCourse.title}.`,
    ipAddress,
    userAgent,
    oldData: {
      id: oldCourse.id,
      title: oldCourse.title,
      slug: oldCourse.slug,
      status: oldCourse.status,
      instructorId: oldCourse.instructorId,
    },
    newData: Prisma.JsonNull,
    metadata: {
      deletedBy: session.user.id,
    },
  });

  return NextResponse.json({
    message: "Course berhasil dihapus.",
  });
}
