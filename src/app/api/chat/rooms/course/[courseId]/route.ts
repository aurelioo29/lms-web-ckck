import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    courseId: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      instructorId: true,
    },
  });

  if (!course) {
    return NextResponse.json(
      { message: "Course tidak ditemukan." },
      { status: 404 },
    );
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
  });

  const isInstructor = course.instructorId === session.user.id;
  const isAdmin = session.user.roles?.includes("SUPERADMIN");

  if (!enrollment && !isInstructor && !isAdmin) {
    return NextResponse.json(
      { message: "Anda tidak punya akses ke chat course ini." },
      { status: 403 },
    );
  }

  const room = await prisma.chatRoom.upsert({
    where: {
      courseId,
    },
    update: {},
    create: {
      courseId,
    },
  });

  const messages = await prisma.chatMessage.findMany({
    where: {
      roomId: room.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 100,
  });

  return NextResponse.json({
    data: {
      room,
      messages,
      currentUserId: session.user.id,
    },
  });
}
