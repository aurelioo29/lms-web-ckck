"use client";

import { CheckCircle2 } from "lucide-react";

import type { Lesson } from "../types/learning.type";
import { getLessonIcon } from "./learning-sidebar-utils";

type LearningSidebarLessonProps = {
  lesson: Lesson;
  active: boolean;
  completed: boolean;
  collapsedPopup?: boolean;
  onClick: () => void;
};

export default function LearningSidebarLesson({
  lesson,
  active,
  completed,
  collapsedPopup = false,
  onClick,
}: LearningSidebarLessonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-lg text-left transition",
        collapsedPopup ? "h-9 px-3 text-xs" : "min-h-9 px-3 py-2 text-[13px]",
        active
          ? collapsedPopup
            ? "bg-[#1677ff] text-white"
            : "bg-white text-[#062b4f] shadow-sm"
          : collapsedPopup
            ? "text-white/75 hover:bg-white/10 hover:text-white"
            : "text-white/65 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      <span className="shrink-0">{getLessonIcon(lesson.type)}</span>

      <span className="min-w-0 flex-1 truncate">{lesson.title}</span>

      {completed ? (
        <CheckCircle2
          size={14}
          className={[
            "shrink-0",
            active && !collapsedPopup ? "text-[#062b4f]" : "text-blue-300",
          ].join(" ")}
        />
      ) : (
        <span
          className={[
            "h-3 w-3 shrink-0 rounded-sm border",
            active && !collapsedPopup
              ? "border-[#062b4f]/40"
              : "border-white/30",
          ].join(" ")}
        />
      )}
    </button>
  );
}
