"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Empty, Layout, Progress, Tag, message } from "antd";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  FileText,
  Lock,
  PlayCircle,
  Trophy,
} from "lucide-react";
import StudentAttendanceCard from "@/features/attendance/components/student-attendance-card";

const { Sider, Content } = Layout;

type Lesson = {
  id: string;
  title: string;
  type: "TEXT" | "VIDEO" | "FILE" | "QUIZ" | "ASSIGNMENT";
  contentHtml: string | null;
  videoUrl: string | null;
  fileUrl: string | null;
  order: number;
  isPreview: boolean;
};

type Section = {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
};

type LearnData = {
  course: {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    level: string | null;
    sections: Section[];
  };
  enrollment: {
    id: string;
    status: string;
    progress: number;
  };
  completedLessonIds: string[];
};

function getLessonIcon(type: Lesson["type"]) {
  if (type === "VIDEO") return <PlayCircle size={16} />;
  return <FileText size={16} />;
}

function getLessonColor(type: Lesson["type"]) {
  if (type === "TEXT") return "blue";
  if (type === "VIDEO") return "purple";
  if (type === "FILE") return "orange";
  if (type === "QUIZ") return "green";
  if (type === "ASSIGNMENT") return "volcano";

  return "default";
}

export default function LearningPageClient({ courseId }: { courseId: string }) {
  const [data, setData] = useState<LearnData | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loadingComplete, setLoadingComplete] = useState(false);

  const allLessons = useMemo(() => {
    return data?.course.sections.flatMap((section) => section.lessons) || [];
  }, [data]);

  const completedSet = useMemo(() => {
    return new Set(data?.completedLessonIds || []);
  }, [data]);

  const activeLessonCompleted = activeLesson
    ? completedSet.has(activeLesson.id)
    : false;

  const completedCount = completedSet.size;
  const totalLessons = allLessons.length;

  async function fetchData(keepActiveLessonId?: string) {
    const res = await fetch(`/api/learn/${courseId}`, {
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok) {
      message.error(json.message || "Gagal mengambil course.");
      return;
    }

    setData(json.data);

    const lessons: Lesson[] =
      json.data.course.sections.flatMap(
        (section: Section) => section.lessons,
      ) || [];

    const nextActiveLesson =
      lessons.find((lesson) => lesson.id === keepActiveLessonId) ||
      lessons.find(
        (lesson) => !json.data.completedLessonIds.includes(lesson.id),
      ) ||
      lessons[0] ||
      null;

    setActiveLesson(nextActiveLesson);
  }

  async function completeLesson() {
    if (!activeLesson) return;

    try {
      setLoadingComplete(true);

      const res = await fetch("/api/lesson-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId: activeLesson.id,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal menyelesaikan lesson.");
      }

      message.success(json.message || "Lesson selesai.");

      await fetchData(activeLesson.id);

      const currentIndex = allLessons.findIndex(
        (lesson) => lesson.id === activeLesson.id,
      );

      const nextLesson = allLessons[currentIndex + 1];

      if (nextLesson) {
        setActiveLesson(nextLesson);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setLoadingComplete(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading learning page...
      </div>
    );
  }

  return (
    <Layout className="min-h-screen bg-slate-100">
      <Sider
        width={340}
        className="sticky left-0 top-0 h-screen overflow-auto border-r border-slate-200 bg-white"
      >
        <div className="border-b border-slate-200 p-4">
          <Link href="/dashboard/my-courses">
            <Button className="mb-4" icon={<ArrowLeft size={14} />}>
              Back to My Courses
            </Button>
          </Link>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="h-28 bg-slate-100">
              {data.course.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.course.thumbnail}
                  alt={data.course.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  <FileText size={36} />
                </div>
              )}
            </div>

            <div className="p-3">
              <div className="mb-2 flex flex-wrap gap-2">
                <Tag color="blue">{data.course.level || "General"}</Tag>

                {data.enrollment.status === "COMPLETED" ? (
                  <Tag color="green" icon={<Trophy size={12} />}>
                    COMPLETED
                  </Tag>
                ) : (
                  <Tag color="orange">{data.enrollment.status}</Tag>
                )}
              </div>

              <h2 className="m-0 text-base font-bold text-slate-900">
                {data.course.title}
              </h2>

              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                {data.course.description || "No description."}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
              <span>Course Progress</span>
              <span>
                {completedCount}/{totalLessons} lessons
              </span>
            </div>

            <Progress
              percent={data.enrollment.progress}
              size="small"
              status={data.enrollment.progress >= 100 ? "success" : "active"}
            />
          </div>
        </div>

        <div className="pb-4">
          {data.course.sections.map((section) => (
            <div key={section.id} className="border-b border-slate-100 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                {section.order}. {section.title}
              </p>

              <div className="space-y-1">
                {section.lessons.map((lesson) => {
                  const completed = completedSet.has(lesson.id);
                  const active = activeLesson?.id === lesson.id;

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => setActiveLesson(lesson)}
                      className={[
                        "flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                        active
                          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                          : "text-slate-600 hover:bg-slate-50 hover:text-blue-600",
                      ].join(" ")}
                    >
                      <span className="mt-[2px]">
                        {completed ? (
                          <CheckCircle2 size={16} className="text-green-600" />
                        ) : (
                          <Circle size={16} />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {lesson.title}
                        </span>

                        <span className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                          {getLessonIcon(lesson.type)}
                          {lesson.type}

                          {lesson.isPreview ? (
                            <span className="text-cyan-600">Preview</span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Sider>

      <Content className="min-h-screen overflow-auto bg-slate-100 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4">
            <StudentAttendanceCard courseId={courseId} />
          </div>

          {!activeLesson ? (
            <div className="rounded-xl bg-white p-10">
              <Empty description="Pilih lesson dari sidebar." />
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Tag color={getLessonColor(activeLesson.type)}>
                    {activeLesson.type}
                  </Tag>

                  {activeLessonCompleted ? (
                    <Tag color="green">COMPLETED</Tag>
                  ) : (
                    <Tag color="orange">IN PROGRESS</Tag>
                  )}

                  {activeLesson.isPreview ? (
                    <Tag color="cyan">PREVIEW</Tag>
                  ) : null}
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="m-0 text-2xl font-bold text-slate-900">
                      {activeLesson.title}
                    </h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">
                      Complete this lesson to earn points and update your
                      progress.
                    </p>
                  </div>

                  <Button
                    type="primary"
                    loading={loadingComplete}
                    disabled={activeLessonCompleted}
                    onClick={completeLesson}
                  >
                    {activeLessonCompleted ? "Completed" : "Mark Complete"}
                  </Button>
                </div>
              </div>

              <div className="px-6 py-6">
                {activeLesson.type === "TEXT" ||
                activeLesson.type === "ASSIGNMENT" ||
                activeLesson.type === "QUIZ" ? (
                  <div
                    className="lesson-content"
                    dangerouslySetInnerHTML={{
                      __html:
                        activeLesson.contentHtml ||
                        "<p>Belum ada content. Kosong seperti meeting tanpa agenda.</p>",
                    }}
                  />
                ) : null}

                {activeLesson.type === "VIDEO" ? (
                  <div>
                    {activeLesson.videoUrl ? (
                      <iframe
                        src={activeLesson.videoUrl}
                        className="h-[460px] w-full rounded-lg border"
                        allowFullScreen
                      />
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                        Video URL belum diisi.
                      </div>
                    )}

                    {activeLesson.contentHtml ? (
                      <div
                        className="lesson-content mt-6"
                        dangerouslySetInnerHTML={{
                          __html: activeLesson.contentHtml,
                        }}
                      />
                    ) : null}
                  </div>
                ) : null}

                {activeLesson.type === "FILE" ? (
                  <div>
                    {activeLesson.fileUrl ? (
                      <a href={activeLesson.fileUrl} target="_blank">
                        <Button icon={<FileText size={14} />}>
                          Download File
                        </Button>
                      </a>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                        File URL belum diisi.
                      </div>
                    )}

                    {activeLesson.contentHtml ? (
                      <div
                        className="lesson-content mt-6"
                        dangerouslySetInnerHTML={{
                          __html: activeLesson.contentHtml,
                        }}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
}
