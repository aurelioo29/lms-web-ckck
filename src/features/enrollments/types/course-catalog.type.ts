export type CourseCatalogItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  level: string | null;
  status: "PUBLISHED";
  instructor: {
    id: string;
    name: string;
    username: string;
  };
  enrollment: {
    id: string;
    status: string;
    progress: number;
  } | null;
  _count: {
    sections: number;
    enrollments: number;
  };
};
