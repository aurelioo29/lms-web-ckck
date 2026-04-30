import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: id,
      },
    },
  });

  if (!enrollment) {
    return NextResponse.json(
      { message: "Anda belum join course ini." },
      { status: 403 },
    );
  }

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
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

  const lessonIds = course.sections.flatMap((section) =>
    section.lessons.map((lesson) => lesson.id),
  );

  const completedProgress = await prisma.lessonProgress.findMany({
    where: {
      userId: session.user.id,
      lessonId: {
        in: lessonIds,
      },
      isCompleted: true,
    },
    select: {
      lessonId: true,
    },
  });

  const completedLessonIds = completedProgress.map((item) => item.lessonId);

  return NextResponse.json({
    data: {
      course,
      enrollment,
      completedLessonIds,
    },
  });
}
