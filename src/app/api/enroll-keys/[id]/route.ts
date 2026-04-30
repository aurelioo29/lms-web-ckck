import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { getRequestMeta } from "@/lib/request";

const schema = z.object({
  key: z.string().min(4),
  maxUsage: z.number().optional().nullable(),
  expiredAt: z.string().optional().nullable(),
  isActive: z.boolean(),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "courses.update")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const payload = schema.parse(await req.json());

  const oldData = await prisma.enrollKey.findUnique({
    where: { id },
  });

  if (!oldData) {
    return NextResponse.json(
      { message: "Enroll key tidak ditemukan." },
      { status: 404 },
    );
  }

  const duplicate = await prisma.enrollKey.findFirst({
    where: {
      key: payload.key,
      NOT: { id },
    },
  });

  if (duplicate) {
    return NextResponse.json(
      { message: "Enroll key sudah digunakan." },
      { status: 409 },
    );
  }

  const updated = await prisma.enrollKey.update({
    where: { id },
    data: {
      key: payload.key,
      maxUsage: payload.maxUsage ?? null,
      expiredAt: payload.expiredAt ? new Date(payload.expiredAt) : null,
      isActive: payload.isActive,
    },
  });

  const { ipAddress, userAgent } = await getRequestMeta();

  await createActivityLog({
    userId: session.user.id,
    action: "UPDATE_ENROLL_KEY",
    module: "enrollments",
    description: `${session.user.name} memperbarui enroll key.`,
    ipAddress,
    userAgent,
    oldData,
    newData: updated,
    metadata: {
      courseId: updated.courseId,
    },
  });

  return NextResponse.json({
    message: "Enroll key berhasil diperbarui.",
    data: updated,
  });
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "courses.update")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const oldData = await prisma.enrollKey.findUnique({
    where: { id },
  });

  if (!oldData) {
    return NextResponse.json(
      { message: "Enroll key tidak ditemukan." },
      { status: 404 },
    );
  }

  await prisma.enrollKey.delete({
    where: { id },
  });

  const { ipAddress, userAgent } = await getRequestMeta();

  await createActivityLog({
    userId: session.user.id,
    action: "DELETE_ENROLL_KEY",
    module: "enrollments",
    description: `${session.user.name} menghapus enroll key.`,
    ipAddress,
    userAgent,
    oldData,
    newData: Prisma.JsonNull,
    metadata: {
      courseId: oldData.courseId,
    },
  });

  return NextResponse.json({
    message: "Enroll key berhasil dihapus.",
  });
}
