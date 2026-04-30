import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { createNotification } from "@/lib/notification";
import { getRequestMeta } from "@/lib/request";

const schema = z.object({
  courseId: z.string().uuid(),
  key: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = schema.parse(await req.json());

    const course = await prisma.course.findUnique({
      where: { id: payload.courseId },
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course tidak ditemukan." },
        { status: 404 },
      );
    }

    if (course.status !== "PUBLISHED") {
      return NextResponse.json(
        { message: "Course belum dipublish." },
        { status: 400 },
      );
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: payload.courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { message: "Anda sudah terdaftar di course ini." },
        { status: 409 },
      );
    }

    let enrollKey = null;

    if (payload.key) {
      enrollKey = await prisma.enrollKey.findUnique({
        where: { key: payload.key },
      });

      if (!enrollKey || enrollKey.courseId !== payload.courseId) {
        return NextResponse.json(
          { message: "Enroll key tidak valid." },
          { status: 400 },
        );
      }

      if (!enrollKey.isActive) {
        return NextResponse.json(
          { message: "Enroll key tidak aktif." },
          { status: 400 },
        );
      }

      if (enrollKey.expiredAt && enrollKey.expiredAt < new Date()) {
        return NextResponse.json(
          { message: "Enroll key sudah expired." },
          { status: 400 },
        );
      }

      if (
        enrollKey.maxUsage !== null &&
        enrollKey.usedCount >= enrollKey.maxUsage
      ) {
        return NextResponse.json(
          { message: "Enroll key sudah mencapai batas penggunaan." },
          { status: 400 },
        );
      }
    }

    const enrollment = await prisma.$transaction(async (tx) => {
      const created = await tx.enrollment.create({
        data: {
          userId: session.user.id,
          courseId: payload.courseId,
          status: "ACTIVE",
          progress: 0,
        },
      });

      if (enrollKey) {
        await tx.enrollKey.update({
          where: { id: enrollKey.id },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      return created;
    });

    const { ipAddress, userAgent } = await getRequestMeta();

    await createActivityLog({
      userId: session.user.id,
      action: "JOIN_COURSE",
      module: "enrollments",
      description: `${session.user.name} join course ${course.title}.`,
      ipAddress,
      userAgent,
      oldData: Prisma.JsonNull,
      newData: enrollment,
      metadata: {
        courseId: course.id,
        enrollKeyUsed: Boolean(enrollKey),
      },
    });

    await createNotification({
      userId: session.user.id,
      title: "Berhasil Join Course",
      message: `Anda berhasil join course ${course.title}.`,
      type: "success",
      link: `/learn/${course.id}`,
    });

    return NextResponse.json(
      {
        message: "Berhasil join course.",
        data: enrollment,
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

    console.error("Join course error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
