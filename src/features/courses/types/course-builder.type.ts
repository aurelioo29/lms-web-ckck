export type LessonType = "TEXT" | "VIDEO" | "FILE" | "QUIZ" | "ASSIGNMENT";

export type LessonItem = {
  id: string;
  sectionId: string;
  title: string;
  slug: string;
  type: LessonType;
  contentHtml: string | null;
  contentJson: unknown | null;
  videoUrl: string | null;
  fileUrl: string | null;
  order: number;
  isPreview: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CourseSectionItem = {
  id: string;
  courseId: string;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  lessons: LessonItem[];
};
