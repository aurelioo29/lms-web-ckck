import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { getRequestMeta } from "@/lib/request";

const schema = z.object({
  key: z.string().min(4, "Key minimal 4 karakter"),
  maxUsage: z.number().optional().nullable(),
  expiredAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "courses.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const data = await prisma.enrollKey.findMany({
    where: { courseId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data });
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "courses.update")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const payload = schema.parse(await req.json());

    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course tidak ditemukan." },
        { status: 404 },
      );
    }

    const existing = await prisma.enrollKey.findUnique({
      where: { key: payload.key },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Enroll key sudah digunakan." },
        { status: 409 },
      );
    }

    const enrollKey = await prisma.enrollKey.create({
      data: {
        courseId: id,
        key: payload.key,
        maxUsage: payload.maxUsage ?? null,
        expiredAt: payload.expiredAt ? new Date(payload.expiredAt) : null,
        isActive: payload.isActive,
      },
    });

    const { ipAddress, userAgent } = await getRequestMeta();

    await createActivityLog({
      userId: session.user.id,
      action: "CREATE_ENROLL_KEY",
      module: "enrollments",
      description: `${session.user.name} membuat enroll key untuk course ${course.title}.`,
      ipAddress,
      userAgent,
      oldData: Prisma.JsonNull,
      newData: enrollKey,
      metadata: {
        courseId: id,
      },
    });

    return NextResponse.json(
      {
        message: "Enroll key berhasil dibuat.",
        data: enrollKey,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validasi gagal.", errors: error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
