import CourseCatalog from "@/features/enrollments/components/course-catalog";

export default function MyCoursesPage() {
  return (
    <div>
      <div className="mb-5">
        <h3 className="mb-1 text-2xl font-bold text-slate-900">My Courses</h3>
        <p className="text-sm text-slate-500">
          Lihat course published, join dengan enroll key, dan lanjutkan belajar.
        </p>
      </div>

      <CourseCatalog />
    </div>
  );
}
