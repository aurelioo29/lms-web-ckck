export type LessonType = "TEXT" | "VIDEO" | "FILE" | "QUIZ" | "ASSIGNMENT";

export type Lesson = {
  id: string;
  title: string;
  type: LessonType;
  contentHtml: string | null;
  videoUrl: string | null;
  fileUrl: string | null;
  order: number;
  isPreview: boolean;
};

export type Section = {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  level: string | null;
  sections: Section[];
};

export type Enrollment = {
  id: string;
  status: string;
  progress: number;
};

export type LearnData = {
  course: Course;
  enrollment: Enrollment;
  completedLessonIds: string[];
};

export type LearningSidebarLesson = Pick<Lesson, "id" | "title" | "type">;

export type LearningSidebarSection = {
  id: string;
  title: string;
  order: number;
  lessons: LearningSidebarLesson[];
};
