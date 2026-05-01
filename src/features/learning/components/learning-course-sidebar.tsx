"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  GraduationCap,
  MessageSquare,
} from "lucide-react";

import type { Course, Lesson } from "../types/learning.type";
import LearningSidebarSection from "./learning-sidebar-section";

type LearningCourseSidebarProps = {
  course: Course;
  activeLessonId?: string;
  completedLessonIds: Set<string>;
  progress: number;
  collapsed: boolean;
  discussionOpen: boolean;
  onToggleCollapsed: () => void;
  onToggleDiscussion: () => void;
  onOpenLesson: (lesson: Lesson) => void;
};

export default function LearningCourseSidebar({
  course,
  activeLessonId,
  completedLessonIds,
  progress,
  collapsed,
  discussionOpen,
  onToggleCollapsed,
  onToggleDiscussion,
  onOpenLesson,
}: LearningCourseSidebarProps) {
  const activeSectionId = useMemo(() => {
    const activeSection = course.sections.find((section) =>
      section.lessons.some((lesson) => lesson.id === activeLessonId),
    );

    return activeSection?.id;
  }, [course.sections, activeLessonId]);

  const [openSectionId, setOpenSectionId] = useState<string | null>(
    activeSectionId ?? course.sections[0]?.id ?? null,
  );

  useEffect(() => {
    if (activeSectionId) {
      setOpenSectionId(activeSectionId);
    }
  }, [activeSectionId]);

  return (
    <aside
      className={[
        "fixed bottom-0 left-0 top-0 z-40 flex h-screen shrink-0 flex-col border-r border-white/10 bg-[#062b4f] text-white shadow-xl transition-all duration-300",
        collapsed ? "w-[72px] overflow-visible" : "w-[252px] overflow-hidden",
      ].join(" ")}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <div
          className={[
            "flex min-w-0 items-center gap-3",
            collapsed ? "justify-center" : "",
          ].join(" ")}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-black text-white ring-1 ring-white/10">
            CK
          </div>

          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-5 text-white">
                CKCK LMS
              </p>
              <p className="truncate text-[11px] text-white/55">
                Learning System
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-b border-white/10 px-3 py-4">
        {collapsed ? (
          <div
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white"
            title={course.title}
          >
            <GraduationCap size={18} />
          </div>
        ) : (
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                <GraduationCap size={17} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-bold leading-5 text-white">
                  {course.title}
                </p>

                <p className="mt-1 truncate text-[11px] text-white/55">
                  {course.level || "Course"}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-white/60">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 px-3 py-3">
        <button
          type="button"
          onClick={onToggleDiscussion}
          title={collapsed ? "Course Discussion" : undefined}
          className={[
            "flex h-10 w-full items-center rounded-xl text-left text-[13px] font-medium transition",
            collapsed ? "justify-center px-0" : "justify-start gap-3 px-3",
            discussionOpen
              ? "bg-white text-[#062b4f] shadow-sm"
              : "text-white/78 hover:bg-white/10 hover:text-white",
          ].join(" ")}
        >
          <MessageSquare size={18} className="shrink-0" />

          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1 truncate">Course Discussion</span>

              <ChevronDown
                size={16}
                className={[
                  "shrink-0 transition-transform duration-200",
                  discussionOpen ? "rotate-180" : "",
                ].join(" ")}
              />
            </>
          ) : null}
        </button>
      </div>

      <nav
        className={[
          "min-h-0 flex-1 space-y-1 px-3 pb-4",
          collapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden",
        ].join(" ")}
      >
        {!collapsed ? (
          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            Course Materials
          </div>
        ) : null}

        {course.sections.map((section) => (
          <LearningSidebarSection
            key={section.id}
            section={section}
            activeLessonId={activeLessonId}
            completedLessonIds={completedLessonIds}
            collapsed={collapsed}
            open={openSectionId === section.id}
            onToggle={() =>
              setOpenSectionId((current) =>
                current === section.id ? null : section.id,
              )
            }
            onOpenLesson={onOpenLesson}
          />
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex h-10 w-full items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/15"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            size={18}
            className={[
              "transition-transform duration-300",
              collapsed ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>
      </div>
    </aside>
  );
}
