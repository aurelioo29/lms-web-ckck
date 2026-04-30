export type EnrollKeyItem = {
  id: string;
  courseId: string;
  key: string;
  maxUsage: number | null;
  usedCount: number;
  expiredAt: string | null;
  isActive: boolean;
  createdAt: string;
};
