"use client";

import { ChevronDown, Folder } from "lucide-react";

import type { Lesson, Section } from "../types/learning.type";
import LearningSidebarLesson from "./learning-sidebar-lesson";

type LearningSidebarSectionProps = {
  section: Section;
  activeLessonId?: string;
  completedLessonIds: Set<string>;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  onOpenLesson: (lesson: Lesson) => void;
};

export default function LearningSidebarSection({
  section,
  activeLessonId,
  completedLessonIds,
  collapsed,
  open,
  onToggle,
  onOpenLesson,
}: LearningSidebarSectionProps) {
  const completedCount = section.lessons.filter((lesson) =>
    completedLessonIds.has(lesson.id),
  ).length;

  const hasActiveLesson = section.lessons.some(
    (lesson) => lesson.id === activeLessonId,
  );

  if (collapsed) {
    return (
      <div className="group relative">
        <button
          type="button"
          onClick={onToggle}
          title={section.title}
          className={[
            "flex h-10 w-full items-center justify-center rounded-xl text-[13px] font-medium transition",
            hasActiveLesson
              ? "bg-white text-[#062b4f] shadow-sm"
              : "text-white/78 hover:bg-white/10 hover:text-white",
          ].join(" ")}
        >
          <Folder size={18} className="shrink-0" />
        </button>

        <div className="invisible absolute left-[calc(100%+10px)] top-0 z-50 min-w-[260px] rounded-2xl border border-white/10 bg-[#031c34] p-2 opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
          <div className="mb-1 border-b border-white/10 px-3 py-2">
            <p className="line-clamp-2 text-xs font-bold text-white">
              Topik {section.order}. {section.title}
            </p>

            <p className="mt-1 text-[11px] text-white/45">
              {completedCount}/{section.lessons.length} materi selesai
            </p>
          </div>

          <div className="space-y-1">
            {section.lessons.map((lesson) => (
              <LearningSidebarLesson
                key={lesson.id}
                lesson={lesson}
                active={activeLessonId === lesson.id}
                completed={completedLessonIds.has(lesson.id)}
                collapsedPopup
                onClick={() => onOpenLesson(lesson)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={[
          "flex min-h-10 w-full items-center rounded-xl text-left text-[13px] font-medium transition",
          "justify-start gap-3 px-3 py-2",
          hasActiveLesson || open
            ? "bg-white/15 text-white"
            : "text-white/78 hover:bg-white/10 hover:text-white",
        ].join(" ")}
      >
        <Folder size={18} className="shrink-0" />

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 leading-5">
            Topik {section.order}. {section.title}
          </p>

          <p className="mt-0.5 text-[11px] font-normal text-white/45">
            {completedCount}/{section.lessons.length} materi selesai
          </p>
        </div>

        <ChevronDown
          size={16}
          className={[
            "shrink-0 text-white/60 transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open ? (
        <div className="mt-1 space-y-1 border-l border-white/10 pl-4">
          {section.lessons.map((lesson) => (
            <LearningSidebarLesson
              key={lesson.id}
              lesson={lesson}
              active={activeLessonId === lesson.id}
              completed={completedLessonIds.has(lesson.id)}
              onClick={() => onOpenLesson(lesson)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
