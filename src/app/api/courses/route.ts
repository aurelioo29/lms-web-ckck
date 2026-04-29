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
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  instructorId: z.string().uuid("Instructor tidak valid"),
});

const allowedSortFields = ["title", "slug", "level", "status", "createdAt"];

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function generateUniqueSlug(title: string) {
  const baseSlug = createSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.course.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export async function GET(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "courses.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const level = searchParams.get("level") || "";
  const instructorId = searchParams.get("instructorId") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const skip = (page - 1) * limit;
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  const where: Prisma.CourseWhereInput = {
    AND: [
      search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      status
        ? { status: status as Prisma.EnumCourseStatusFilter["equals"] }
        : {},
      level ? { level } : {},
      instructorId ? { instructorId } : {},
    ],
  };

  const [data, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: limit,
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
      orderBy: {
        [safeSortBy]: sortOrder,
      },
    }),
    prisma.course.count({ where }),
  ]);

  return NextResponse.json({
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "courses.create")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const payload = courseSchema.parse(body);

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

    const slug = await generateUniqueSlug(payload.title);
    const { ipAddress, userAgent } = await getRequestMeta();

    const course = await prisma.course.create({
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

    await createActivityLog({
      userId: session.user.id,
      action: "CREATE_COURSE",
      module: "courses",
      description: `${session.user.name} membuat course ${course.title}.`,
      ipAddress,
      userAgent,
      oldData: Prisma.JsonNull,
      newData: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        status: course.status,
        instructorId: course.instructorId,
      },
      metadata: {
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(
      {
        message: "Course berhasil dibuat.",
        data: course,
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

    console.error("Create course error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
