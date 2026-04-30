import Link from "next/link";
import { Button } from "antd";
import { ArrowLeft } from "lucide-react";

import { requirePermission } from "@/lib/require-permission";
import { prisma } from "@/lib/prisma";
import CourseBuilder from "@/features/courses/components/course-builder";
import EnrollKeyManager from "@/features/enrollments/components/enroll-key-manager";
import AttendanceSessionManager from "@/features/attendance/components/attendance-session-manager";

type CourseDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  await requirePermission("courses.view");

  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: {
        select: {
          name: true,
          username: true,
        },
      },
    },
  });

  if (!course) {
    return (
      <div>
        <h3 className="text-xl font-bold">Course tidak ditemukan.</h3>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/courses">
            <Button className="mb-3" icon={<ArrowLeft size={14} />}>
              Back
            </Button>
          </Link>

          <h3 className="mb-1 text-2xl font-bold text-slate-900">
            {course.title}
          </h3>

          <p className="text-sm text-slate-500">
            Builder course: sections, lessons, dan content pembelajaran.
          </p>
        </div>
      </div>

      <CourseBuilder courseId={course.id} />

      <div className="mt-6">
        <EnrollKeyManager courseId={course.id} />
      </div>

      <div className="mt-6">
        <AttendanceSessionManager courseId={course.id} />
      </div>
    </div>
  );
}
