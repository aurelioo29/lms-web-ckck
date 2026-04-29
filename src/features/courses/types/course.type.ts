export type CourseItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  level: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  instructorId: string;
  createdAt: string;
  updatedAt: string;
  instructor: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
};

export type CoursesResponse = {
  data: CourseItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type InstructorOption = {
  id: string;
  name: string;
  username: string;
};
