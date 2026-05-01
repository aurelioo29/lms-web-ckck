import { CheckCircle2, FileText, PlayCircle } from "lucide-react";

import type { LessonType } from "../types/learning.type";

export function getLessonIcon(type: LessonType) {
  if (type === "VIDEO") {
    return <PlayCircle size={15} className="text-blue-500" />;
  }

  if (type === "QUIZ") {
    return <CheckCircle2 size={15} className="text-orange-500" />;
  }

  if (type === "ASSIGNMENT") {
    return <FileText size={15} className="text-orange-500" />;
  }

  return <FileText size={15} className="text-blue-400" />;
}

export function getLessonColor(type: LessonType) {
  if (type === "TEXT") return "blue";
  if (type === "VIDEO") return "purple";
  if (type === "FILE") return "orange";
  if (type === "QUIZ") return "green";
  if (type === "ASSIGNMENT") return "volcano";

  return "default";
}
