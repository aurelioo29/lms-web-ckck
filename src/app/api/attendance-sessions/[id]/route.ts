import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { getRequestMeta } from "@/lib/request";

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

  const data = await prisma.attendanceSession.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
        },
      },
      records: true,
    },
  });

  if (!data) {
    return NextResponse.json(
      { message: "Attendance session tidak ditemukan." },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "attendance.delete")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const oldData = await prisma.attendanceSession.findUnique({
    where: { id },
  });

  if (!oldData) {
    return NextResponse.json(
      { message: "Attendance session tidak ditemukan." },
      { status: 404 },
    );
  }

  await prisma.attendanceSession.delete({
    where: { id },
  });

  const { ipAddress, userAgent } = await getRequestMeta();

  await createActivityLog({
    userId: session.user.id,
    action: "DELETE_ATTENDANCE_SESSION",
    module: "attendance",
    description: `${session.user.name} menghapus attendance session ${oldData.title}.`,
    ipAddress,
    userAgent,
    oldData,
    newData: Prisma.JsonNull,
    metadata: {
      courseId: oldData.courseId,
    },
  });

  return NextResponse.json({
    message: "Attendance session berhasil dihapus.",
  });
}