import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { getRequestMeta } from "@/lib/request";

const schema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = schema.parse(await req.json());

    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id: payload.sessionId },
      include: {
        course: true,
      },
    });

    if (!attendanceSession) {
      return NextResponse.json(
        { message: "Attendance session tidak ditemukan." },
        { status: 404 },
      );
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: attendanceSession.courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { message: "Anda belum join course ini." },
        { status: 403 },
      );
    }

    const now = new Date();

    if (now < attendanceSession.startAt) {
      return NextResponse.json(
        { message: "Absensi belum dibuka." },
        { status: 400 },
      );
    }

    if (now > attendanceSession.endAt) {
      return NextResponse.json(
        { message: "Absensi sudah ditutup." },
        { status: 400 },
      );
    }

    const record = await prisma.attendanceRecord.upsert({
      where: {
        sessionId_userId: {
          sessionId: payload.sessionId,
          userId: session.user.id,
        },
      },
      update: {
        status: "PRESENT",
        checkedAt: now,
      },
      create: {
        sessionId: payload.sessionId,
        userId: session.user.id,
        status: "PRESENT",
        checkedAt: now,
      },
    });

    await prisma.pointTransaction.create({
      data: {
        userId: session.user.id,
        type: "EARNED",
        points: 5,
        source: "ATTENDANCE_CHECK_IN",
        description: `Check-in attendance ${attendanceSession.title}.`,
        metadata: {
          attendanceSessionId: attendanceSession.id,
          courseId: attendanceSession.courseId,
        },
      },
    });

    const { ipAddress, userAgent } = await getRequestMeta();

    await createActivityLog({
      userId: session.user.id,
      action: "ATTENDANCE_CHECK_IN",
      module: "attendance",
      description: `${session.user.name} melakukan attendance check-in.`,
      ipAddress,
      userAgent,
      oldData: Prisma.JsonNull,
      newData: record,
      metadata: {
        courseId: attendanceSession.courseId,
        attendanceSessionId: attendanceSession.id,
      },
    });

    return NextResponse.json({
      message: "Absensi berhasil. +5 points 🎉",
      data: record,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validasi gagal.", errors: error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    console.error("Attendance check-in error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
