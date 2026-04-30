import { NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";
import { Prisma } from "@/generated/prisma";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { getRequestMeta } from "@/lib/request";

const schema = z.object({
  title: z.string().min(2, "Title minimal 2 karakter"),
  startAt: z.string().min(1, "Start wajib diisi"),
  endAt: z.string().min(1, "End wajib diisi"),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "attendance.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const data = await prisma.attendanceSession.findMany({
    where: {
      courseId: id,
    },
    include: {
      records: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ data });
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "attendance.create")) {
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

    const startAt = new Date(payload.startAt);
    const endAt = new Date(payload.endAt);

    if (endAt <= startAt) {
      return NextResponse.json(
        { message: "End time harus lebih besar dari start time." },
        { status: 400 },
      );
    }

    const rawCode = `ATT-${crypto.randomUUID()}`;

    const qrCode = await QRCode.toDataURL(
      JSON.stringify({
        type: "ATTENDANCE",
        code: rawCode,
        courseId: id,
      }),
    );

    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        courseId: id,
        title: payload.title,
        qrCode,
        startAt,
        endAt,
      },
    });

    const { ipAddress, userAgent } = await getRequestMeta();

    await createActivityLog({
      userId: session.user.id,
      action: "CREATE_ATTENDANCE_SESSION",
      module: "attendance",
      description: `${session.user.name} membuat attendance session ${attendanceSession.title}.`,
      ipAddress,
      userAgent,
      oldData: Prisma.JsonNull,
      newData: attendanceSession,
      metadata: {
        courseId: id,
      },
    });

    return NextResponse.json(
      {
        message: "Attendance session berhasil dibuat.",
        data: attendanceSession,
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

    console.error("Create attendance session error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
