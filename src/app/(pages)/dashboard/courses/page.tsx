import { requirePermission } from "@/lib/require-permission";
import CoursesTable from "@/features/courses/components/courses-table";

export default async function CoursesPage() {
  await requirePermission("courses.view");

  return (
    <div>
      <div className="mb-5">
        <h3 className="mb-1 text-2xl font-bold text-slate-900">Courses</h3>
        <p className="text-sm text-slate-500">
          Kelola course LMS, instructor, level, dan status publikasi.
        </p>
      </div>

      <CoursesTable />
    </div>
  );
}
