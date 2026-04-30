import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { createNotification } from "@/lib/notification";
import { getRequestMeta } from "@/lib/request";

const schema = z.object({
  lessonId: z.string().uuid(),
});

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = schema.parse(await req.json());

    const lesson = await prisma.lesson.findUnique({
      where: {
        id: payload.lessonId,
      },
      include: {
        section: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { message: "Lesson tidak ditemukan." },
        { status: 404 },
      );
    }

    const courseId = lesson.section.courseId;

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { message: "Anda belum join course ini." },
        { status: 403 },
      );
    }

    const existingProgress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: payload.lessonId,
        },
      },
    });

    if (existingProgress?.isCompleted) {
      return NextResponse.json(
        {
          message: "Lesson sudah selesai sebelumnya.",
        },
        { status: 409 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: session.user.id,
            lessonId: payload.lessonId,
          },
        },
        update: {
          isCompleted: true,
          completedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          lessonId: payload.lessonId,
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      await tx.pointTransaction.create({
        data: {
          userId: session.user.id,
          type: "EARNED",
          points: 10,
          source: "LESSON_COMPLETED",
          description: `Menyelesaikan lesson ${lesson.title}.`,
          metadata: {
            lessonId: lesson.id,
            courseId,
          },
        },
      });

      const totalLessons = await tx.lesson.count({
        where: {
          section: {
            courseId,
          },
        },
      });

      const completedLessons = await tx.lessonProgress.count({
        where: {
          userId: session.user.id,
          isCompleted: true,
          lesson: {
            section: {
              courseId,
            },
          },
        },
      });

      const progress =
        totalLessons > 0
          ? Math.min(Math.round((completedLessons / totalLessons) * 100), 100)
          : 0;

      const shouldCompleteCourse = progress >= 100;

      const updatedEnrollment = await tx.enrollment.update({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId,
          },
        },
        data: {
          progress,
          status: shouldCompleteCourse ? "COMPLETED" : "ACTIVE",
          completedAt: shouldCompleteCourse ? new Date() : null,
        },
      });

      let courseCompletionReward = 0;

      if (shouldCompleteCourse && enrollment.status !== "COMPLETED") {
        courseCompletionReward = 100;

        await tx.pointTransaction.create({
          data: {
            userId: session.user.id,
            type: "EARNED",
            points: 100,
            source: "COURSE_COMPLETED",
            description: `Menyelesaikan course ${lesson.section.course.title}.`,
            metadata: {
              courseId,
            },
          },
        });
      }

      return {
        totalLessons,
        completedLessons,
        progress,
        enrollment: updatedEnrollment,
        lessonReward: 10,
        courseCompletionReward,
        completedCourse: shouldCompleteCourse,
      };
    });

    const { ipAddress, userAgent } = await getRequestMeta();

    await createActivityLog({
      userId: session.user.id,
      action: "COMPLETE_LESSON",
      module: "lesson_progress",
      description: `${session.user.name} menyelesaikan lesson ${lesson.title}.`,
      ipAddress,
      userAgent,
      oldData: Prisma.JsonNull,
      newData: {
        lessonId: lesson.id,
        courseId,
        progress: result.progress,
      },
      metadata: {
        reward: result.lessonReward + result.courseCompletionReward,
      },
    });

    if (result.completedCourse) {
      await createNotification({
        userId: session.user.id,
        title: "Course Completed",
        message: `Selamat! Anda menyelesaikan course ${lesson.section.course.title}.`,
        type: "success",
        link: `/learn/${courseId}`,
      });
    }

    return NextResponse.json({
      message: result.completedCourse
        ? "Lesson selesai dan course completed 🎉"
        : "Lesson selesai 🎉",
      data: result,
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

    console.error("Lesson progress error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
