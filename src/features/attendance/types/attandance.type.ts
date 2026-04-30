export type AttendanceSessionItem = {
  id: string;
  courseId: string;
  title: string;
  qrCode: string | null;
  startAt: string;
  endAt: string;
  createdAt: string;
  course?: {
    id: string;
    title: string;
  };
  records?: AttendanceRecordItem[];
};

export type AttendanceRecordItem = {
  id: string;
  sessionId: string;
  userId: string;
  status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED" | "SICK";
  checkedAt: string | null;
  createdAt: string;
};
