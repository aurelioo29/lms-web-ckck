"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Empty, Layout, Select, Tag, message } from "antd";
import { ArrowLeft, ArrowRight, FileText, MessageSquare } from "lucide-react";

import StudentAttendanceCard from "@/features/attendance/components/student-attendance-card";
import CourseChatRoom from "@/features/chat/components/course-chat-room";

import LearningCourseSidebar from "./learning-course-sidebar";
import { getLessonColor } from "./learning-sidebar-utils";
import type { LearnData, Lesson, Section } from "../types/learning.type";

const { Content } = Layout;

export default function LearningPageClient({ courseId }: { courseId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonIdFromUrl = searchParams.get("lesson");

  const [data, setData] = useState<LearnData | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [discussionOpen, setDiscussionOpen] = useState(false);

  const sidebarWidth = sidebarCollapsed ? 72 : 252;
  const discussionWidth = discussionOpen ? 420 : 0;

  const allLessons = useMemo(() => {
    return data?.course.sections.flatMap((section) => section.lessons) || [];
  }, [data]);

  const completedSet = useMemo(() => {
    return new Set(data?.completedLessonIds || []);
  }, [data]);

  const activeLessonIndex = activeLesson
    ? allLessons.findIndex((lesson) => lesson.id === activeLesson.id)
    : -1;

  const previousLesson =
    activeLessonIndex > 0 ? allLessons[activeLessonIndex - 1] : null;

  const nextLesson =
    activeLessonIndex >= 0 && activeLessonIndex < allLessons.length - 1
      ? allLessons[activeLessonIndex + 1]
      : null;

  const activeLessonCompleted = activeLesson
    ? completedSet.has(activeLesson.id)
    : false;

  function openLesson(lesson: Lesson) {
    setActiveLesson(lesson);

    router.replace(`/learn/${courseId}?lesson=${lesson.id}`, {
      scroll: false,
    });
  }

  async function fetchData() {
    const res = await fetch(`/api/learn/${courseId}`, {
      cache: "no-store",
    });

    if (res.status === 401) {
      router.replace("/login");
      return;
    }

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

    const selectedFromUrl =
      lessons.find((lesson) => lesson.id === lessonIdFromUrl) || null;

    const firstIncomplete =
      lessons.find(
        (lesson) => !json.data.completedLessonIds.includes(lesson.id),
      ) || null;

    const selectedLesson =
      selectedFromUrl || firstIncomplete || lessons[0] || null;

    setActiveLesson(selectedLesson);

    if (selectedLesson && !lessonIdFromUrl) {
      router.replace(`/learn/${courseId}?lesson=${selectedLesson.id}`, {
        scroll: false,
      });
    }
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

      await fetchData();

      if (nextLesson) {
        openLesson(nextLesson);
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
    <Layout className="min-h-screen overflow-x-hidden bg-slate-100">
      <LearningCourseSidebar
        course={data.course}
        activeLessonId={activeLesson?.id}
        completedLessonIds={completedSet}
        progress={data.enrollment.progress}
        collapsed={sidebarCollapsed}
        discussionOpen={discussionOpen}
        onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
        onToggleDiscussion={() => setDiscussionOpen((value) => !value)}
        onOpenLesson={openLesson}
      />

      <Content
        className="min-h-screen overflow-x-hidden transition-all duration-300"
        style={{
          marginLeft: sidebarWidth,
          marginRight: discussionWidth,
          width: `calc(100vw - ${sidebarWidth}px - ${discussionWidth}px)`,
        }}
      >
        <div className="w-full max-w-full p-4">
          {/* Course Header */}
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Link href="/dashboard/my-courses">
                <Button icon={<ArrowLeft size={14} />}>
                  Back to My Courses
                </Button>
              </Link>

              <Button
                icon={<MessageSquare size={15} />}
                onClick={() => setDiscussionOpen((value) => !value)}
              >
                Discussion
              </Button>
            </div>

            <h1 className="m-0 text-2xl font-bold text-slate-900">
              {data.course.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Link href="/dashboard" className="text-blue-600">
                Dashboard
              </Link>

              <span className="text-slate-400">/</span>

              <Link href="/dashboard/my-courses" className="text-blue-600">
                My courses
              </Link>

              <span className="text-slate-400">/</span>

              <span className="text-blue-600">{data.course.title}</span>

              {activeLesson ? (
                <>
                  <span className="text-slate-400">/</span>
                  <span className="text-blue-600">{activeLesson.title}</span>
                </>
              ) : null}
            </div>
          </div>

          <StudentAttendanceCard courseId={courseId} />

          {!activeLesson ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
              <Empty description="Pilih materi dari sidebar." />
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Lesson Header */}
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
                  <h2 className="m-0 text-xl font-semibold text-slate-900">
                    {activeLesson.title}
                  </h2>

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

              {/* Lesson Content */}
              <div className="max-w-full overflow-x-hidden px-6 py-7">
                {(activeLesson.type === "TEXT" ||
                  activeLesson.type === "ASSIGNMENT" ||
                  activeLesson.type === "QUIZ") && (
                  <div
                    className="lesson-content max-w-full overflow-x-hidden break-words"
                    dangerouslySetInnerHTML={{
                      __html:
                        activeLesson.contentHtml ||
                        "<p>Belum ada content. Kosong seperti rapat tanpa notulen.</p>",
                    }}
                  />
                )}

                {activeLesson.type === "VIDEO" && (
                  <div className="max-w-full overflow-x-hidden">
                    {activeLesson.videoUrl ? (
                      <iframe
                        src={activeLesson.videoUrl}
                        className="h-[460px] w-full max-w-full rounded-lg border"
                        allowFullScreen
                      />
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                        Video URL belum diisi.
                      </div>
                    )}

                    {activeLesson.contentHtml ? (
                      <div
                        className="lesson-content mt-6 max-w-full overflow-x-hidden break-words"
                        dangerouslySetInnerHTML={{
                          __html: activeLesson.contentHtml,
                        }}
                      />
                    ) : null}
                  </div>
                )}

                {activeLesson.type === "FILE" && (
                  <div className="max-w-full overflow-x-hidden">
                    {activeLesson.fileUrl ? (
                      <a
                        href={activeLesson.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
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
                        className="lesson-content mt-6 max-w-full overflow-x-hidden break-words"
                        dangerouslySetInnerHTML={{
                          __html: activeLesson.contentHtml,
                        }}
                      />
                    ) : null}
                  </div>
                )}
              </div>

              {/* Lesson Navigation */}
              <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-6 py-4">
                <Button
                  disabled={!previousLesson}
                  type="link"
                  icon={<ArrowLeft size={14} />}
                  onClick={() => previousLesson && openLesson(previousLesson)}
                  className="max-w-[260px] truncate"
                >
                  {previousLesson ? previousLesson.title : "Previous"}
                </Button>

                <Select
                  className="w-[320px]"
                  placeholder="Jump to..."
                  value={activeLesson.id}
                  onChange={(lessonId) => {
                    const lesson = allLessons.find(
                      (item) => item.id === lessonId,
                    );

                    if (lesson) {
                      openLesson(lesson);
                    }
                  }}
                  options={allLessons.map((lesson) => ({
                    label: lesson.title,
                    value: lesson.id,
                  }))}
                />

                <Button
                  disabled={!nextLesson}
                  type="link"
                  onClick={() => nextLesson && openLesson(nextLesson)}
                  className="max-w-[260px] truncate"
                >
                  {nextLesson ? nextLesson.title : "Next"}
                  <ArrowRight size={14} className="ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Content>

      {/* Discussion Panel */}
      {discussionOpen ? (
        <aside className="fixed bottom-0 right-0 top-0 z-50 w-[420px] border-l border-slate-200 bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <MessageSquare size={17} />
              Course Discussion
            </div>

            <Button size="small" onClick={() => setDiscussionOpen(false)}>
              Close
            </Button>
          </div>

          <div className="h-[calc(100vh-64px)] overflow-auto p-4">
            <CourseChatRoom courseId={courseId} />
          </div>
        </aside>
      ) : null}
    </Layout>
  );
}
