"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Empty, Progress, Tag, message } from "antd";
import { BookOpen, LockKeyhole, PlayCircle, Users } from "lucide-react";

import JoinCourseModal from "./join-course-modal";
import type { CourseCatalogItem } from "../types/course-catalog.type";

export default function CourseCatalog() {
  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] =
    useState<CourseCatalogItem | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);

  async function fetchCourses() {
    try {
      setLoading(true);

      const res = await fetch("/api/course-catalog", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal mengambil course catalog.");
      }

      setCourses(json.data || []);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <>
      <Card loading={loading}>
        {courses.length === 0 ? (
          <Empty description="Belum ada course published. Admin mungkin masih sibuk ngopi." />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => {
              const enrolled = !!course.enrollment;

              return (
                <div
                  key={course.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                >
                  <div className="h-40 bg-slate-100">
                    {course.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <BookOpen size={42} />
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Tag color="blue">{course.level || "General"}</Tag>
                      {enrolled ? (
                        <Tag color="green">{course.enrollment?.status}</Tag>
                      ) : (
                        <Tag color="orange">NOT ENROLLED</Tag>
                      )}
                    </div>

                    <h3 className="mb-1 line-clamp-2 text-base font-bold text-slate-900">
                      {course.title}
                    </h3>

                    <p className="mb-3 text-xs text-slate-500">
                      Instructor: {course.instructor.name}
                    </p>

                    <p className="line-clamp-3 min-h-[60px] text-sm text-slate-600">
                      {course.description || "Tidak ada deskripsi."}
                    </p>

                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen size={13} />
                        {course._count.sections} section
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <Users size={13} />
                        {course._count.enrollments} enrolled
                      </span>
                    </div>

                    {enrolled ? (
                      <div className="mt-4">
                        <div className="mb-1 flex justify-between text-xs text-slate-500">
                          <span>Progress</span>
                          <span>{course.enrollment?.progress || 0}%</span>
                        </div>

                        <Progress
                          percent={course.enrollment?.progress || 0}
                          size="small"
                        />
                      </div>
                    ) : null}

                    <div className="mt-4">
                      {enrolled ? (
                        <Link href={`/learn/${course.id}`}>
                          <Button
                            type="primary"
                            block
                            icon={<PlayCircle size={14} />}
                          >
                            Continue Learning
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          block
                          icon={<LockKeyhole size={14} />}
                          onClick={() => {
                            setSelectedCourse(course);
                            setJoinOpen(true);
                          }}
                        >
                          Join Course
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <JoinCourseModal
        open={joinOpen}
        course={selectedCourse}
        onClose={() => {
          setJoinOpen(false);
          setSelectedCourse(null);
        }}
        onSuccess={fetchCourses}
      />
    </>
  );
}
