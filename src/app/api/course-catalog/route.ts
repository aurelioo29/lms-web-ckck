import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const courses = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
    },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      enrollments: {
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
          status: true,
          progress: true,
        },
      },
      _count: {
        select: {
          sections: true,
          enrollments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const data = courses.map((course) => ({
    ...course,
    enrollment: course.enrollments[0] || null,
    enrollments: undefined,
  }));

  return NextResponse.json({
    data,
  });
}
